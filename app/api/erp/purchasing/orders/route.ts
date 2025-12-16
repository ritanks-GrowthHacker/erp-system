import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { purchaseOrders, purchaseOrderLines, suppliers } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc, sql } from 'drizzle-orm';

// GET /api/erp/purchasing/orders
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view purchase orders' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');

    const conditions = [eq(purchaseOrders.erpOrganizationId, user.erpOrganizationId)];
    
    if (status) {
      conditions.push(eq(purchaseOrders.status, status));
    }
    
    if (supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }

    const orders = await erpDb.query.purchaseOrders.findMany({
      where: and(...conditions),
      with: {
        supplier: true,
        warehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(purchaseOrders.createdAt)],
    });

    return NextResponse.json({ purchaseOrders: orders });
  } catch (err: any) {
    console.error('Error fetching purchase orders:', err);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/erp/purchasing/orders
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create purchase orders' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      supplierId,
      warehouseId,
      expectedDeliveryDate,
      notes,
      lines,
    } = body;

    if (!supplierId || !warehouseId || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate PO number
    const lastPO = await erpDb.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.erpOrganizationId, user.erpOrganizationId),
      orderBy: [desc(purchaseOrders.createdAt)],
    });

    const poNumber = `PO${String((lastPO ? parseInt(lastPO.poNumber.replace('PO', '')) : 0) + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      const lineTotal = parseFloat(line.quantity) * parseFloat(line.unitPrice);
      subtotal += lineTotal;
      taxAmount += lineTotal * (parseFloat(line.taxRate || 0) / 100);
    }

    // Create purchase order
    const [newPO] = await erpDb
      .insert(purchaseOrders)
      .values({
        erpOrganizationId: user.erpOrganizationId,
        supplierId,
        warehouseId,
        poNumber,
        expectedDeliveryDate: expectedDeliveryDate || null,
        status: 'draft',
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: (subtotal + taxAmount).toFixed(2),
        notes,
        createdBy: user.id,
      })
      .returning();

    // Create PO lines
    const poLines = await erpDb
      .insert(purchaseOrderLines)
      .values(
        lines.map((line: any) => ({
          purchaseOrderId: newPO.id,
          productId: line.productId,
          productVariantId: line.productVariantId,
          description: line.description,
          quantityOrdered: line.quantity,
          uomId: line.uomId,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate || '0',
          expectedDeliveryDate: line.expectedDeliveryDate || null,
          notes: line.notes,
        }))
      )
      .returning();

    return NextResponse.json(
      { purchaseOrder: { ...newPO, lines: poLines } },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating purchase order:', err);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
