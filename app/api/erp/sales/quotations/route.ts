import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { salesQuotations, salesQuotationLines } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { handleDatabaseError, logDatabaseError } from '@/lib/db/error-handler';

// GET /api/erp/sales/quotations
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'sales', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view quotations' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const conditions = [eq(salesQuotations.erpOrganizationId, user.organizationId)];

    if (status) {
      conditions.push(eq(salesQuotations.status, status));
    }

    if (search) {
      conditions.push(
        like(salesQuotations.quotationNumber, `%${search}%`)
      );
    }

    const quotationsList = await erpDb.query.salesQuotations.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(salesQuotations.createdAt)],
      limit,
      offset,
    });

    const [countResult] = await erpDb
      .select({ count: sql<number>`count(*)::int` })
      .from(salesQuotations)
      .where(and(...conditions));

    const totalCount = countResult?.count || 0;

    return NextResponse.json({
      quotations: quotationsList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    logDatabaseError('Fetching sales quotations', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}

// POST /api/erp/sales/quotations
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'sales', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create quotations' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      customerId,
      validUntil,
      paymentTerms,
      notes,
      lines,
    } = body;

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Customer and at least one line item are required' },
        { status: 400 }
      );
    }

    // Generate quotation number
    const lastQuotation = await erpDb.query.salesQuotations.findFirst({
      where: eq(salesQuotations.erpOrganizationId, user.organizationId),
      orderBy: [desc(salesQuotations.createdAt)],
    });

    const quotationNumber = `QT${String(
      (lastQuotation ? parseInt(lastQuotation.quotationNumber.replace('QT', '')) : 0) + 1
    ).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      const lineTotal = parseFloat(line.quantity) * parseFloat(line.unitPrice);
      subtotal += lineTotal;
      const lineTax = lineTotal * (parseFloat(line.taxRate || 0) / 100);
      taxAmount += lineTax;
    }

    const totalAmount = subtotal + taxAmount;

    // Create quotation
    const [newQuotation] = await erpDb
      .insert(salesQuotations)
      .values({
        erpOrganizationId: user.organizationId,
        customerId,
        quotationNumber,
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: validUntil || null,
        status: 'draft',
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paymentTerms: paymentTerms || 30,
        notes: notes || null,
        createdBy: user.id,
      })
      .returning();

    // Create quotation lines
    const quotationLines = await erpDb
      .insert(salesQuotationLines)
      .values(
        lines.map((line: any) => ({
          salesQuotationId: newQuotation.id,
          productId: line.productId,
          productVariantId: line.productVariantId,
          description: line.description,
          quantity: line.quantity,
          uomId: line.uomId,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate || '0',
          discount: line.discount || '0',
          notes: line.notes,
        }))
      )
      .returning();

    return NextResponse.json(
      { quotation: { ...newQuotation, lines: quotationLines } },
      { status: 201 }
    );
  } catch (error: any) {
    logDatabaseError('Creating sales quotation', error);
    const dbError = handleDatabaseError(error);
    return NextResponse.json({ error: dbError.message }, { status: dbError.statusCode });
  }
}
