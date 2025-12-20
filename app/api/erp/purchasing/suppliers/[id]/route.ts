import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { suppliers, purchaseOrders, requestForQuotations, rfqSuppliers, vendorInvoices } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
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
      invoices,
      statistics: {
        totalPurchaseOrders: pos.length,
        pendingPurchaseOrders: pendingPOs,
        completedPurchaseOrders: completedPOs,
        totalPurchaseValue: totalPurchaseValue.toFixed(2),
        totalRFQs: rfqList.length,
        totalInvoices: invoices.length,
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
