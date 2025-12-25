import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { suppliers, purchaseOrders, requestForQuotations, rfqSuppliers, vendorInvoices } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { handleDatabaseError, logDatabaseError } from '@/lib/db/error-handler';

// GET /api/erp/purchasing/suppliers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view supplier details' },
      { status: 403 }
    );
  }

  try {
    const { id: supplierId } = await params;

    // Fetch supplier details
    const supplier = await erpDb.query.suppliers.findFirst({
      where: and(
        eq(suppliers.id, supplierId),
        eq(suppliers.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        contacts: true,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Fetch purchase orders for this supplier
    const pos = await erpDb.query.purchaseOrders.findMany({
      where: and(
        eq(purchaseOrders.supplierId, supplierId),
        eq(purchaseOrders.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        lines: {
          with: {
            product: true,
          },
        },
        warehouse: true,
      },
      orderBy: [desc(purchaseOrders.createdAt)],
      limit: 50,
    });

    // Fetch RFQs sent to this supplier
    const rfqList = await erpDb
      .select({
        rfq: requestForQuotations,
        rfqSupplier: rfqSuppliers,
      })
      .from(rfqSuppliers)
      .leftJoin(requestForQuotations, eq(rfqSuppliers.rfqId, requestForQuotations.id))
      .where(and(
        eq(rfqSuppliers.supplierId, supplierId),
        eq(requestForQuotations.erpOrganizationId, user.erpOrganizationId)
      ))
      .orderBy(desc(requestForQuotations.createdAt))
      .limit(50);

    // Fetch invoices for this supplier
    const invoices = await erpDb.query.vendorInvoices.findMany({
      where: and(
        eq(vendorInvoices.supplierId, supplierId),
        eq(vendorInvoices.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        purchaseOrder: true,
      },
      orderBy: [desc(vendorInvoices.createdAt)],
      limit: 50,
    });

    // Fetch supplier portal invoices for this supplier
    const supplierInvoicesResult = await erpDb.execute(sql`
      SELECT 
        si.*,
        sq.submission_number as quotation_number,
        sq.rfq_id,
        rfq.rfq_number
      FROM supplier_invoices si
      LEFT JOIN supplier_quotation_submissions sq ON si.quotation_id = sq.id
      LEFT JOIN request_for_quotations rfq ON sq.rfq_id = rfq.id
      WHERE si.supplier_id = ${supplierId}
        AND si.erp_organization_id = ${user.erpOrganizationId}
      ORDER BY si.created_at DESC
      LIMIT 50
    `);

    const supplierInvoices = Array.from(supplierInvoicesResult);
    const allInvoices = [...invoices, ...supplierInvoices];

    // Fetch supplier quotations from supplier portal
    const quotationsResult = await erpDb.execute(sql`
      SELECT 
        sq.*,
        rfq.rfq_number,
        rfq.title as rfq_title
      FROM supplier_quotation_submissions sq
      LEFT JOIN request_for_quotations rfq ON sq.rfq_id = rfq.id
      WHERE sq.supplier_id = ${supplierId}
      ORDER BY sq.submission_date DESC, sq.created_at DESC
      LIMIT 50
    `);
    
    const quotations = Array.from(quotationsResult);

    // Fetch payment receipts for this supplier
    const receiptsResult = await erpDb.execute(sql`
      SELECT 
        r.*,
        si.invoice_number,
        si.invoice_date
      FROM supplier_invoice_receipts r
      JOIN supplier_invoices si ON r.invoice_id = si.id
      WHERE r.supplier_id = ${supplierId}
        AND r.erp_organization_id = ${user.erpOrganizationId}
      ORDER BY r.receipt_date DESC
      LIMIT 50
    `);
    
    const receipts = Array.from(receiptsResult);

    // Calculate statistics
    const totalPurchaseValue = pos.reduce(
      (sum, po) => sum + parseFloat(po.totalAmount || '0'),
      0
    );

    const pendingPOs = pos.filter(po => po.status === 'confirmed' || po.status === 'partially_received').length;
    const completedPOs = pos.filter(po => po.status === 'received').length;

    return NextResponse.json({
      supplier,
      purchaseOrders: pos,
      rfqs: rfqList.map(r => r.rfq),
      quotations,
      invoices: allInvoices,
      receipts,
      statistics: {
        totalPurchaseOrders: pos.length,
        pendingPurchaseOrders: pendingPOs,
        completedPurchaseOrders: completedPOs,
        totalPurchaseValue: totalPurchaseValue.toFixed(2),
        totalRFQs: rfqList.length,
        totalQuotations: quotations.length,
        totalInvoices: allInvoices.length,
        totalReceipts: receipts.length,
      },
    });
  } catch (error: any) {
    logDatabaseError('Fetching supplier details', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// PUT /api/erp/purchasing/suppliers/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to edit suppliers' },
      { status: 403 }
    );
  }

  try {
    const { id: supplierId } = await params;
    const body = await req.json();

    const {
      name,
      code,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      currencyCode,
      notes,
      isActive,
    } = body;

    // Check if supplier exists
    const existingSupplier = await erpDb.query.suppliers.findFirst({
      where: and(
        eq(suppliers.id, supplierId),
        eq(suppliers.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Update supplier
    const [updatedSupplier] = await erpDb
      .update(suppliers)
      .set({
        name,
        code,
        email,
        phone,
        website,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        paymentTerms,
        currencyCode,
        notes,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplierId))
      .returning();

    return NextResponse.json({ supplier: updatedSupplier });
  } catch (error: any) {
    logDatabaseError('Updating supplier', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}
