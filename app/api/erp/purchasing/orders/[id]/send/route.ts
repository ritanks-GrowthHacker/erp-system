import { NextRequest, NextResponse } from 'next/server';
import { erpDb, mainDb } from '@/lib/db';
import { purchaseOrders, purchaseOrderLines, suppliers } from '@/lib/db/schema/purchasing-sales';
import { products } from '@/lib/db/schema/inventory';
import { eq, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/emailServices';
import { getPurchaseOrderEmailTemplate } from '@/lib/emailTemplates';
import { requireErpAccess } from '@/lib/auth';

// POST /api/erp/purchasing/orders/[id]/send
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireErpAccess(req);
    if (error) return error;

    const { id: poId } = await params;

    // Fetch PO with details
    const [po] = await erpDb
      .select({
        po: purchaseOrders,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, poId));

    if (!po || !po.supplier) {
      return NextResponse.json({ error: 'Purchase order or supplier not found' }, { status: 404 });
    }

    if (!po.supplier.email) {
      return NextResponse.json({ error: 'Supplier email not found' }, { status: 400 });
    }

    // Fetch PO lines with product details
    const lines = await erpDb
      .select({
        line: purchaseOrderLines,
        product: products,
      })
      .from(purchaseOrderLines)
      .leftJoin(products, eq(purchaseOrderLines.productId, products.id))
      .where(eq(purchaseOrderLines.purchaseOrderId, poId));

    // Fetch organization details from main DB
    const [org] = await mainDb.execute(
      sql`SELECT name, logo_url FROM organizations WHERE id = ${user.organizationId} LIMIT 1`
    );

    const organizationName = (org as any)?.name || 'Organization';
    const organizationLogo = (org as any)?.logo_url;

    // Prepare email data
    const emailData = {
      poNumber: po.po.poNumber,
      poDate: new Date(po.po.poDate).toLocaleDateString('en-IN'),
      expectedDeliveryDate: po.po.expectedDeliveryDate
        ? new Date(po.po.expectedDeliveryDate).toLocaleDateString('en-IN')
        : undefined,
      supplierName: po.supplier.name,
      supplierEmail: po.supplier.email,
      totalAmount: po.po.totalAmount || '0',
      currencyCode: po.po.currencyCode || 'INR',
      lines: lines.map(l => ({
        productName: l.product?.name || 'Unknown Product',
        description: l.line.description || undefined,
        quantity: l.line.quantityOrdered,
        unitPrice: l.line.unitPrice,
        total: (parseFloat(l.line.quantityOrdered) * parseFloat(l.line.unitPrice)).toString(),
      })),
    };

    // Generate and send email
    const emailHtml = getPurchaseOrderEmailTemplate(emailData, organizationName, organizationLogo);
    const emailResult = await sendEmail({
      to: po.supplier.email,
      subject: `Purchase Order ${po.po.poNumber} from ${organizationName}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Failed to send email: ' + emailResult.error }, { status: 500 });
    }

    // Update PO status to 'sent'
    await erpDb
      .update(purchaseOrders)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(purchaseOrders.id, poId));

    return NextResponse.json({
      success: true,
      message: 'Purchase order sent successfully',
      messageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error('Error sending PO:', error);
    return NextResponse.json({ error: error.message || 'Failed to send purchase order' }, { status: 500 });
  }
}
