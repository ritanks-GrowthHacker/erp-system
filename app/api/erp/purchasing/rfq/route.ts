import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { requestForQuotations, rfqLines, rfqSuppliers } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/erp/purchasing/rfq
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view RFQs' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');

    const conditions = [eq(requestForQuotations.erpOrganizationId, user.erpOrganizationId)];
    
    if (status) {
      conditions.push(eq(requestForQuotations.status, status));
    }

    const rfqs = await erpDb.query.requestForQuotations.findMany({
      where: and(...conditions),
      with: {
        lines: {
          with: {
            product: true,
          },
        },
        suppliers: {
          with: {
            supplier: true,
          },
        },
      },
      orderBy: [desc(requestForQuotations.createdAt)],
    });

    return NextResponse.json({ rfqs });
  } catch (err: any) {
    console.error('Error fetching RFQs:', err);
    return NextResponse.json(
      { error: 'Failed to fetch RFQs' },
      { status: 500 }
    );
  }
}

// POST /api/erp/purchasing/rfq
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create RFQs' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      deadlineDate,
      notes,
      lines,
      supplierIds,
    } = body;

    if (!title || !lines || lines.length === 0 || !supplierIds || supplierIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate RFQ number
    const lastRFQ = await erpDb.query.requestForQuotations.findFirst({
      where: eq(requestForQuotations.erpOrganizationId, user.erpOrganizationId),
      orderBy: [desc(requestForQuotations.createdAt)],
    });

    const lastNum = lastRFQ ? parseInt((lastRFQ as any).rfqNumber.split('-')[1]) : 0;
    const rfqNumber = `RFQ-${String(lastNum + 1).padStart(6, '0')}`;

    // Create RFQ
    const [newRFQ] = await erpDb.insert(requestForQuotations).values({
      erpOrganizationId: user.erpOrganizationId,
      rfqNumber,
      title,
      description,
      deadlineDate,
      notes,
      createdBy: user.id,
    }).returning();

    // Create RFQ lines
    for (const line of lines) {
      await erpDb.insert(rfqLines).values({
        rfqId: newRFQ.id,
        productId: line.productId,
        quantityRequested: line.quantityRequested,
        targetPrice: line.targetPrice || null,
        description: line.description,
      });
    }

    // Create RFQ suppliers
    for (const supplierId of supplierIds) {
      await erpDb.insert(rfqSuppliers).values({
        rfqId: newRFQ.id,
        supplierId,
      });
    }

    return NextResponse.json({ rfq: newRFQ }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating RFQ:', err);
    return NextResponse.json(
      { error: 'Failed to create RFQ' },
      { status: 500 }
    );
  }
}
