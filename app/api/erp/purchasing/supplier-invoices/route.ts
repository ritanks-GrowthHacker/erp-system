import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { sql } from 'drizzle-orm';
import { handleDatabaseError, logDatabaseError } from '@/lib/db/error-handler';

// GET /api/erp/purchasing/supplier-invoices - Get all supplier invoices (from quotations)
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view invoices' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');

    let query = sql`
      SELECT 
        si.*,
        s.name as supplier_name,
        s.code as supplier_code,
        s.email as supplier_email,
        sq.submission_number as quotation_number,
        sq.rfq_id,
        rfq.rfq_number
      FROM supplier_invoices si
      LEFT JOIN suppliers s ON si.supplier_id = s.id
      LEFT JOIN supplier_quotation_submissions sq ON si.quotation_id = sq.id
      LEFT JOIN request_for_quotations rfq ON sq.rfq_id = rfq.id
      WHERE si.erp_organization_id = ${user.erpOrganizationId}
    `;

    if (status) {
      query = sql`${query} AND si.payment_status = ${status}`;
    }

    if (supplierId) {
      query = sql`${query} AND si.supplier_id = ${supplierId}`;
    }

    query = sql`${query} ORDER BY si.created_at DESC`;

    const result = await erpDb.execute(query);
    const invoices = Array.from(result);

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching supplier invoices:', error);
    logDatabaseError('Fetching supplier invoices', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// PUT /api/erp/purchasing/supplier-invoices - Update invoice (mark as paid)
export async function PUT(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to update invoices' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { invoiceId, paymentStatus, paidAmount, paymentDate, paymentMethod, paymentReference, paymentNotes } = body;

    if (!invoiceId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await erpDb.execute(sql`
      UPDATE supplier_invoices
      SET 
        payment_status = ${paymentStatus},
        paid_amount = ${paidAmount || 0},
        payment_date = ${paymentDate || null},
        payment_method = ${paymentMethod || null},
        payment_reference = ${paymentReference || null},
        payment_notes = ${paymentNotes || null},
        updated_at = NOW()
      WHERE id = ${invoiceId}
      AND erp_organization_id = ${user.erpOrganizationId}
    `);

    // Create notification for supplier if marking as paid
    if (paymentStatus === 'paid') {
      await erpDb.execute(sql`
        INSERT INTO supplier_portal_notifications (
          supplier_id,
          notification_type,
          title,
          message,
          related_entity_type,
          related_entity_id
        )
        SELECT 
          supplier_id,
          'payment_received',
          'Payment Received',
          'Payment for invoice ' || invoice_number || ' has been processed.',
          'invoice',
          ${invoiceId}
        FROM supplier_invoices
        WHERE id = ${invoiceId}
      `);
    }

    return NextResponse.json({ 
      message: 'Invoice updated successfully',
      success: true 
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    logDatabaseError('Updating invoice', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}
