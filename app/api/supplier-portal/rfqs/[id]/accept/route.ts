import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { verifySupplierAuth } from '@/lib/auth/supplier-auth';
import { erpDb as db } from '@/lib/db';

interface Params {
  id: string; // rfq_supplier_id
}

// POST /api/supplier-portal/rfqs/[id]/accept - Accept RFQ
export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { supplier, error } = await verifySupplierAuth(request);
    if (error) return error;

    const { id: rfqSupplierId } = await context.params;

    // Verify access and get RFQ details
    const rfqSupplierResult = await db.execute(sql`
      SELECT rs.*, rfq.status as rfq_status, rfq.id as rfq_id
      FROM rfq_suppliers rs
      JOIN request_for_quotations rfq ON rs.rfq_id = rfq.id
      WHERE rs.id = ${rfqSupplierId} AND rs.supplier_id = ${supplier.id}
    `);

    if (!rfqSupplierResult || Array.from(rfqSupplierResult).length === 0) {
      return NextResponse.json({ error: 'RFQ not found or no access' }, { status: 404 });
    }

    const rfqSupplier = Array.from(rfqSupplierResult)[0] as any;

    // Check if already accepted or rejected
    if (rfqSupplier.response_status !== 'pending') {
      return NextResponse.json(
        { error: `RFQ already ${rfqSupplier.response_status}` },
        { status: 400 }
      );
    }

    // Update rfq_suppliers record
    await db.execute(sql`
      UPDATE rfq_suppliers
      SET 
        response_status = 'accepted',
        response_date = NOW(),
        accepted_at = NOW(),
        responded = true
      WHERE id = ${rfqSupplierId}
    `);

    // Update RFQ status to in_progress if it was sent
    if (rfqSupplier.rfq_status === 'sent') {
      await db.execute(sql`
        UPDATE request_for_quotations
        SET status = 'in_progress', updated_at = NOW()
        WHERE id = ${rfqSupplier.rfq_id}
      `);
    }

    return NextResponse.json({
      message: 'RFQ accepted successfully',
      rfqSupplierId: rfqSupplierId,
      rfqId: rfqSupplier.rfq_id,
    });
  } catch (error: any) {
    console.error('Error accepting RFQ:', error);
    return NextResponse.json(
      { error: 'Failed to accept RFQ', details: error.message },
      { status: 500 }
    );
  }
}
