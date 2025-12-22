import { NextRequest, NextResponse } from 'next/server';
import { erpDb as db } from '@/lib/db';
import { qualityChecks, products } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

// GET /api/erp/manufacturing/quality - List all Quality Checks
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'manufacturing', 'view')) {
    return NextResponse.json({ error: 'No permission to view quality checks' }, { status: 403 });
  }

  try {
    const erpOrganizationId = user.erpOrganizationId;

    const qcList = await db
      .select({
        id: qualityChecks.id,
        qcNumber: qualityChecks.qcNumber,
        type: qualityChecks.type,
        productId: qualityChecks.productId,
        productName: products.name,
        productSku: products.sku,
        batchNumber: qualityChecks.batchNumber,
        sourceReference: qualityChecks.sourceReference,
        quantityChecked: qualityChecks.quantityChecked,
        quantityPassed: qualityChecks.quantityPassed,
        quantityFailed: qualityChecks.quantityFailed,
        quantityRework: qualityChecks.quantityRework,
        status: qualityChecks.status,
        inspector: qualityChecks.inspector,
        checkDate: qualityChecks.checkDate,
        createdAt: qualityChecks.createdAt,
      })
      .from(qualityChecks)
      .leftJoin(products, eq(qualityChecks.productId, products.id))
      .where(eq(qualityChecks.erpOrganizationId, erpOrganizationId))
      .orderBy(desc(qualityChecks.createdAt));

    return NextResponse.json(qcList);
  } catch (error) {
    console.error('Error fetching quality checks:', error);
    return NextResponse.json({ error: 'Failed to fetch quality checks' }, { status: 500 });
  }
}

// POST /api/erp/manufacturing/quality - Create new Quality Check
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'manufacturing', 'create')) {
    return NextResponse.json({ error: 'No permission to create quality checks' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const erpOrganizationId = user.erpOrganizationId;

    const [newQC] = await db
      .insert(qualityChecks)
      .values({
        erpOrganizationId,
        ...body,
        checkDate: new Date(body.checkDate),
      })
      .returning();

    return NextResponse.json(newQC, { status: 201 });
  } catch (error) {
    console.error('Error creating quality check:', error);
    return NextResponse.json({ error: 'Failed to create quality check' }, { status: 500 });
  }
}
