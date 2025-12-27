import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { salesOrders, salesOrderLines, salesHistory, stockLevels } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { handleDatabaseError, logDatabaseError } from '@/lib/db/error-handler';

// GET /api/erp/sales/orders
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'sales', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view sales orders' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const conditions = [eq(salesOrders.erpOrganizationId, user.erpOrganizationId)];
    
    if (status) {
      conditions.push(eq(salesOrders.status, status));
    }
    
    if (customerId) {
      conditions.push(eq(salesOrders.customerId, customerId));
    }

    const orders = await erpDb.query.salesOrders.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        warehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(salesOrders.createdAt)],
    });

    return NextResponse.json({ orders: orders, salesOrders: orders });
  } catch (error: any) {
    logDatabaseError('Fetching sales orders', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// POST /api/erp/sales/orders
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'sales', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create sales orders' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      customerId,
      warehouseId,
      expectedDeliveryDate,
      shippingAddress,
      notes,
      lines,
    } = body;

    if (!customerId || !warehouseId || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate SO number
    const lastSO = await erpDb.query.salesOrders.findFirst({
      where: eq(salesOrders.erpOrganizationId, user.erpOrganizationId),
      orderBy: [desc(salesOrders.createdAt)],
    });

    const soNumber = `SO${String((lastSO ? parseInt(lastSO.soNumber.replace('SO', '')) : 0) + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      const lineTotal = parseFloat(line.quantity) * parseFloat(line.unitPrice);
      subtotal += lineTotal;
      taxAmount += lineTotal * (parseFloat(line.taxRate || 0) / 100);
    }

    // Create sales order
    const [newSO] = await erpDb
      .insert(salesOrders)
      .values({
        erpOrganizationId: user.erpOrganizationId,
        customerId,
        warehouseId,
        soNumber,
        expectedDeliveryDate: expectedDeliveryDate || null,
        status: 'draft',
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: (subtotal + taxAmount).toFixed(2),
        shippingAddress,
        notes,
        createdBy: user.id,
      })
      .returning();

    // Create SO lines
    const soLines = await erpDb
      .insert(salesOrderLines)
      .values(
        lines.map((line: any) => ({
          salesOrderId: newSO.id,
          productId: line.productId,
          productVariantId: line.productVariantId,
          description: line.description,
          quantityOrdered: line.quantity,
          uomId: line.uomId,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate || '0',
          notes: line.notes,
        }))
      )
      .returning();

    return NextResponse.json(
      { salesOrder: { ...newSO, lines: soLines } },
      { status: 201 }
    );
  } catch (error: any) {
    logDatabaseError('Creating sales order', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}
