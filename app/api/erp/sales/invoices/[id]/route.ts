import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { erpDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params;
    const invoiceId = params.id;

    // Fetch invoice with customer details and line items
    const invoiceQuery = await erpDb.execute(sql`
      SELECT 
        si.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ${invoiceId}
      AND si.erp_organization_id = ${decoded.organizationId}
    `);

    const invoiceResult = Array.from(invoiceQuery);
    
    if (!invoiceResult || invoiceResult.length === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceResult[0] as any;

    // Fetch invoice line items
    const linesQuery = await erpDb.execute(sql`
      SELECT 
        sil.*,
        p.name as product_name
      FROM sales_invoice_lines sil
      LEFT JOIN products p ON sil.product_id = p.id
      WHERE sil.sales_invoice_id = ${invoiceId}
      ORDER BY sil.created_at
    `);

    const lines = Array.from(linesQuery);

    // Format response
    const response = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      totalAmount: invoice.total_amount,
      paidAmount: invoice.paid_amount || '0',
      balanceAmount: invoice.balance_amount || invoice.total_amount,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      currencyCode: invoice.currency_code,
      paymentTerms: invoice.payment_terms,
      notes: invoice.notes,
      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        phone: invoice.customer_phone,
      },
      lines: lines.map((line: any) => ({
        id: line.id,
        productId: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        taxRate: line.tax_rate,
        product: {
          name: line.product_name,
        },
      })),
      salesOrderId: invoice.sales_order_id,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoice', error: error.message },
      { status: 500 }
    );
  }
}
