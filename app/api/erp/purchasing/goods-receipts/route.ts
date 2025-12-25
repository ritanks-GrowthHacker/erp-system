import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { goodsReceipts, goodsReceiptLines } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, sql, desc } from 'drizzle-orm';
import { handleDatabaseError, logDatabaseError } from '@/lib/db/error-handler';

// GET /api/erp/purchasing/goods-receipts
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view goods receipts' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const purchaseOrderId = searchParams.get('purchaseOrderId');

    // Fetch goods receipts from purchase orders
    const result = await erpDb.execute(sql`
      SELECT 
        gr.*,
        po.po_number,
        s.name as supplier_name,
        w.name as warehouse_name,
        NULL as invoice_id,
        NULL as invoice_number,
        'purchase_order' as receipt_type,
        COUNT(grl.id) as line_count,
        SUM(grl.quantity_received) as total_qty_received,
        SUM(grl.quantity_accepted) as total_qty_accepted,
        SUM(grl.quantity_rejected) as total_qty_rejected
      FROM goods_receipts gr
      LEFT JOIN purchase_orders po ON gr.purchase_order_id = po.id
      LEFT JOIN suppliers s ON gr.supplier_id = s.id
      LEFT JOIN warehouses w ON gr.warehouse_id = w.id
      LEFT JOIN goods_receipt_lines grl ON gr.id = grl.goods_receipt_id
      WHERE gr.erp_organization_id = ${user.erpOrganizationId}
      ${status ? sql`AND gr.status = ${status}` : sql``}
      ${purchaseOrderId ? sql`AND gr.purchase_order_id = ${purchaseOrderId}` : sql``}
      GROUP BY gr.id, po.po_number, s.name, w.name
      ORDER BY gr.created_at DESC
    `);

    // Fetch supplier invoice receipts
    const supplierReceipts = await erpDb.execute(sql`
      SELECT 
        r.id,
        r.receipt_number,
        r.receipt_date as created_at,
        r.amount,
        r.payment_method,
        r.payment_reference,
        r.status,
        r.notes,
        s.name as supplier_name,
        si.id as invoice_id,
        si.invoice_number,
        'supplier_invoice' as receipt_type,
        NULL as po_number,
        NULL as warehouse_name,
        NULL as line_count,
        NULL as total_qty_received,
        NULL as total_qty_accepted,
        NULL as total_qty_rejected
      FROM supplier_invoice_receipts r
      JOIN suppliers s ON r.supplier_id = s.id
      JOIN supplier_invoices si ON r.invoice_id = si.id
      WHERE r.erp_organization_id = ${user.erpOrganizationId}
      ${status ? sql`AND r.status = ${status}` : sql``}
      ORDER BY r.receipt_date DESC
    `);

    // Combine both receipt types
    const allReceipts = [...Array.from(result), ...Array.from(supplierReceipts)];

    return NextResponse.json({ goodsReceipts: allReceipts });
  } catch (error: any) {
    logDatabaseError('Fetching goods receipts', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// POST /api/erp/purchasing/goods-receipts
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create goods receipts' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { 
      purchaseOrderId,
      warehouseId,
      supplierId,
      receiptDate,
      deliveryNoteNumber,
      vehicleNumber,
      driverName,
      notes,
      lines 
    } = body;

    if (!purchaseOrderId || !warehouseId || !supplierId || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const lastGR = await erpDb.execute(sql`
      SELECT receipt_number FROM goods_receipts 
      WHERE erp_organization_id = ${user.erpOrganizationId}
      ORDER BY created_at DESC LIMIT 1
    `);
    
    let receiptNumber = 'GR-0001';
    if (Array.from(lastGR).length > 0) {
      const lastNum = parseInt((Array.from(lastGR)[0] as any).receipt_number.split('-')[1]) + 1;
      receiptNumber = `GR-${lastNum.toString().padStart(4, '0')}`;
    }

    // Create goods receipt
    const grResult = await erpDb.insert(goodsReceipts).values({
      erpOrganizationId: user.erpOrganizationId,
      purchaseOrderId,
      warehouseId,
      supplierId,
      receiptNumber,
      receiptDate: receiptDate || new Date().toISOString().split('T')[0],
      deliveryNoteNumber: deliveryNoteNumber || null,
      vehicleNumber: vehicleNumber || null,
      driverName: driverName || null,
      status: 'received',
      notes,
      receivedBy: user.id,
    }).returning();

    // Create receipt lines
    const lineValues = lines.map((line: any) => ({
      goodsReceiptId: grResult[0].id,
      purchaseOrderLineId: line.purchaseOrderLineId,
      productId: line.productId,
      productVariantId: line.productVariantId || null,
      warehouseLocationId: line.warehouseLocationId || null,
      quantityOrdered: line.quantityOrdered.toString(),
      quantityReceived: line.quantityReceived.toString(),
      quantityAccepted: line.quantityAccepted?.toString() || line.quantityReceived.toString(),
      quantityRejected: line.quantityRejected?.toString() || '0',
      uomId: line.uomId || null,
      rejectionReason: line.rejectionReason || null,
      notes: line.notes || '',
    }));

    await erpDb.insert(goodsReceiptLines).values(lineValues);

    return NextResponse.json({ 
      goodsReceipt: grResult[0],
      message: 'Goods receipt created successfully'
    });
  } catch (error: any) {
    logDatabaseError('Creating goods receipt', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// PUT /api/erp/purchasing/goods-receipts (Update status to accepted)
export async function PUT(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to update goods receipts' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { goodsReceiptId, status, qualityCheckedBy } = body;

    if (!goodsReceiptId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await erpDb.update(goodsReceipts)
      .set({ 
        status,
        qualityCheckedBy: qualityCheckedBy || user.id,
        updatedAt: new Date(),
      })
      .where(and(
        eq(goodsReceipts.id, goodsReceiptId),
        eq(goodsReceipts.erpOrganizationId, user.erpOrganizationId)
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Goods receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      goodsReceipt: result[0],
      message: 'Goods receipt updated successfully'
    });
  } catch (error: any) {
    logDatabaseError('Updating goods receipt', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}
