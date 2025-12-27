import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { sql } from 'drizzle-orm';

// POST /api/erp/purchasing/supplier-quotations/[id]/accept
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireErpAccess(req);
    if (error) return error;

    if (!hasPermission(user, 'purchasing', 'edit')) {
      return NextResponse.json(
        { error: 'No permission to accept quotations' },
        { status: 403 }
      );
    }

    const { id: quotationId } = await params;

    // First verify the quotation belongs to user's organization
    const verifyResult = await erpDb.execute(sql`
      SELECT sq.id
      FROM supplier_quotation_submissions sq
      LEFT JOIN suppliers s ON sq.supplier_id = s.id
      WHERE sq.id = ${quotationId}
        AND s.erp_organization_id = ${user.erpOrganizationId}
    `);

    if (!verifyResult || Array.from(verifyResult).length === 0) {
      return NextResponse.json(
        { error: 'Quotation not found or access denied' },
        { status: 404 }
      );
    }

    // Update quotation status
    await erpDb.execute(sql`
      UPDATE supplier_quotation_submissions sq
      SET 
        status = 'accepted',
        reviewed_by = ${user.id},
        reviewed_at = NOW(),
        updated_at = NOW()
      FROM suppliers s
      WHERE sq.id = ${quotationId}
        AND sq.supplier_id = s.id
        AND s.erp_organization_id = ${user.erpOrganizationId}
    `);

    // Update RFQ status to 'closed' or 'received' when a quotation is accepted
    await erpDb.execute(sql`
      UPDATE request_for_quotations rfq
      SET status = 'closed', updated_at = NOW()
      FROM supplier_quotation_submissions sq
      WHERE sq.id = ${quotationId}
        AND rfq.id = sq.rfq_id
    `);

    // Get quotation details for invoice generation
    const quotationResult = await erpDb.execute(sql`
      SELECT sq.*, s.payment_terms, s.erp_organization_id
      FROM supplier_quotation_submissions sq
      LEFT JOIN suppliers s ON sq.supplier_id = s.id
      WHERE sq.id = ${quotationId}
        AND s.erp_organization_id = ${user.erpOrganizationId}
    `);

    const quotations = Array.from(quotationResult);
    if (quotations.length > 0) {
      const quotation: any = quotations[0];
      const paymentTerms = quotation.payment_terms || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTerms);

      // Auto-generate invoice
      const invoiceNumberResult = await erpDb.execute(sql`
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-([0-9]+)') AS INTEGER)), 0) + 1 as next_num
        FROM supplier_invoices
      `);
      const invoiceNumbers = Array.from(invoiceNumberResult);
      const nextNum = invoiceNumbers[0]?.next_num || 1;
      const invoiceNumber = `INV-${String(nextNum).padStart(6, '0')}`;

      await erpDb.execute(sql`
        INSERT INTO supplier_invoices (
          invoice_number,
          supplier_id,
          quotation_id,
          erp_organization_id,
          invoice_date,
          due_date,
          subtotal,
          tax_amount,
          shipping_charges,
          discount_amount,
          total_amount,
          currency_code,
          payment_status,
          notes,
          created_at,
          updated_at
        ) VALUES (
          ${invoiceNumber},
          ${quotation.supplier_id},
          ${quotationId},
          ${quotation.erp_organization_id},
          NOW(),
          ${dueDate.toISOString().split('T')[0]},
          ${quotation.total_amount},
          0,
          0,
          0,
          ${quotation.total_amount},
          ${quotation.currency_code || 'INR'},
          'pending',
          ${`Auto-generated from accepted quotation ${quotation.submission_number}`},
          NOW(),
          NOW()
        )
      `);

      // Create notification for supplier
      await erpDb.execute(sql`
        INSERT INTO supplier_portal_notifications (
          supplier_id,
          notification_type,
          title,
          message,
          related_entity_type,
          related_entity_id
        ) VALUES (
          ${quotation.supplier_id},
          'quotation_accepted',
          'Quotation Accepted!',
          ${`Your quotation has been accepted! Invoice ${invoiceNumber} has been automatically generated.`},
          'quotation',
          ${quotationId}
        )
      `);
    }

    return NextResponse.json({
      message: 'Quotation accepted successfully. Invoice has been auto-generated.',
      success: true,
    });
  } catch (error: any) {
    console.error('Error accepting quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to accept quotation' }, { status: 500 });
  }
}
