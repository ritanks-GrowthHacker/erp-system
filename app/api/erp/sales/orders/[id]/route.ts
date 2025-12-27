import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { salesOrders, salesOrderLines, salesHistory, stockLevels, products } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { handleDatabaseError, logDatabaseError } from '@/lib/db/error-handler';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/erp/sales/orders/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'sales', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view sales orders' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const order = await erpDb.query.salesOrders.findFirst({
      where: and(
        eq(salesOrders.id, id),
        eq(salesOrders.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        customer: true,
        warehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // Check if there's a delivery assignment
    let deliveryAssignment = null;
    try {
      const deliveryResult = await erpDb.execute(sql`
        SELECT 
          id,
          delivery_partner_name as partner_name,
          delivery_partner_mobile as partner_mobile,
          delivery_partner_email as partner_email,
          status,
          assigned_at,
          picked_up_at,
          delivered_at
         FROM delivery_assignments
         WHERE sales_order_id = ${id}
           AND erp_organization_id = ${user.erpOrganizationId}
      `);
      
      const deliveryResultArray = Array.from(deliveryResult);
      if (deliveryResultArray.length > 0) {
        const delivery = deliveryResultArray[0] as any;
        deliveryAssignment = {
          id: delivery.id,
          partnerName: delivery.partner_name,
          partnerMobile: delivery.partner_mobile,
          partnerEmail: delivery.partner_email,
          status: delivery.status,
          assigned_at: delivery.assigned_at,
          picked_up_at: delivery.picked_up_at,
          delivered_at: delivery.delivered_at,
        };
      }
    } catch (deliveryError) {
      // If delivery_assignments table doesn't exist yet, ignore the error
      console.log('Delivery assignment query failed (table might not exist yet):', deliveryError);
    }

    return NextResponse.json({ 
      salesOrder: {
        ...order,
        deliveryAssignment
      }
    });
  } catch (error: any) {
    logDatabaseError('Fetching sales order', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// PUT /api/erp/sales/orders/[id] - Update order status (including delivery)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'sales', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to edit sales orders' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, deliveryDate, notes } = body;

    // Get existing order
    const existingOrder = await erpDb.query.salesOrders.findFirst({
      where: and(
        eq(salesOrders.id, id),
        eq(salesOrders.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Sales order not found' },
        { status: 404 }
      );
    }

    // If status is being changed to 'delivered', record sales history
    if (status === 'delivered' && existingOrder.status !== 'delivered') {
      const deliveryDateObj = deliveryDate ? new Date(deliveryDate) : new Date();
      
      // Calculate period (start of month to end of month for delivered date)
      const periodStart = new Date(deliveryDateObj.getFullYear(), deliveryDateObj.getMonth(), 1);
      const periodEnd = new Date(deliveryDateObj.getFullYear(), deliveryDateObj.getMonth() + 1, 0);

      // Record sales history for each line item
      for (const line of existingOrder.lines) {
        const quantitySold = parseFloat(line.quantityOrdered);
        const unitPrice = parseFloat(line.unitPrice);
        const revenue = quantitySold * unitPrice;

        // Check if sales history already exists for this product/period
        const periodStartStr = periodStart.toISOString().split('T')[0];
        const periodEndStr = periodEnd.toISOString().split('T')[0];
        
        const existingHistory = await erpDb.query.salesHistory.findFirst({
          where: and(
            eq(salesHistory.productId, line.productId),
            eq(salesHistory.warehouseId, existingOrder.warehouseId),
            sql`${salesHistory.periodStart} = ${periodStartStr}`,
            sql`${salesHistory.periodEnd} = ${periodEndStr}`
          ),
        });

        if (existingHistory) {
          // Update existing record
          await erpDb
            .update(salesHistory)
            .set({
              quantitySold: sql`${salesHistory.quantitySold} + ${quantitySold}`,
              revenue: sql`${salesHistory.revenue} + ${revenue}`,
              numberOfOrders: sql`${salesHistory.numberOfOrders} + 1`,
            })
            .where(eq(salesHistory.id, existingHistory.id));
        } else {
          // Insert new record
          await erpDb.insert(salesHistory).values({
            erpOrganizationId: user.erpOrganizationId,
            productId: line.productId,
            warehouseId: existingOrder.warehouseId,
            periodStart: periodStartStr,
            periodEnd: periodEndStr,
            quantitySold: quantitySold.toString(),
            revenue: revenue.toString(),
            numberOfOrders: 1,
            averageOrderQuantity: quantitySold.toString(),
          });
        }

        // Deduct from stock levels
        const stockLevel = await erpDb.query.stockLevels.findFirst({
          where: and(
            eq(stockLevels.productId, line.productId),
            eq(stockLevels.warehouseId, existingOrder.warehouseId)
          ),
        });

        if (stockLevel) {
          await erpDb
            .update(stockLevels)
            .set({
              quantityOnHand: sql`${stockLevels.quantityOnHand} - ${quantitySold}`,
              updatedAt: new Date(),
            })
            .where(eq(stockLevels.id, stockLevel.id));
        }
      }
    }

    // Update sales order
    const [updatedOrder] = await erpDb
      .update(salesOrders)
      .set({
        status: status || existingOrder.status,
        notes: notes || existingOrder.notes,
        updatedAt: new Date(),
      })
      .where(eq(salesOrders.id, id))
      .returning();

    return NextResponse.json({ salesOrder: updatedOrder });
  } catch (error: any) {
    logDatabaseError('Updating sales order', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}
