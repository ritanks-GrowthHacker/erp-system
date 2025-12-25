import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function verifySupplierToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== 'supplier') {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supplier = await verifySupplierToken(req);
  
  if (!supplier) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id: invoiceId } = await params;

    // Verify invoice belongs to supplier using raw query
    const result = await erpDb.execute(sql`
      SELECT * FROM supplier_invoices WHERE id = ${invoiceId}
    `);

    const invoice = Array.from(result)[0] as any;

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.supplier_id !== supplier.supplierId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this invoice' },
        { status: 403 }
      );
    }

    // Update invoice status to sent
    await erpDb.execute(sql`
      UPDATE supplier_invoices 
      SET payment_status = 'sent', updated_at = NOW() 
      WHERE id = ${invoiceId}
    `);

    return NextResponse.json({ 
      success: true,
      message: 'Invoice sent successfully' 
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
