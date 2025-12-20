import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { stockAdjustments, stockAdjustmentLines, stockLevels } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/erp/inventory/adjustments/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  try {
    const adjustment = await erpDb.query.stockAdjustments.findFirst({
      where: and(
        eq(stockAdjustments.id, id),
        eq(stockAdjustments.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        warehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!adjustment) {
      return NextResponse.json(
        { error: 'Stock adjustment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ adjustment });
  } catch (err: any) {
    console.error('Error fetching stock adjustment:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stock adjustment' },
      { status: 500 }
    );
  }
}

// POST /api/erp/inventory/adjustments/[id]/confirm
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireErpAccess(req, 'manager');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to confirm stock adjustments' },
      { status: 403 }
    );
  }

  try {
    // Get adjustment with lines
    const adjustment = await erpDb.query.stockAdjustments.findFirst({
      where: and(
        eq(stockAdjustments.id, id),
        eq(stockAdjustments.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        lines: true,
      },
    });

    if (!adjustment) {
      return NextResponse.json(
        { error: 'Stock adjustment not found' },
        { status: 404 }
      );
    }

    if (adjustment.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft adjustments can be confirmed' },
        { status: 400 }
      );
    }

    // Update stock levels for each line
    for (const line of adjustment.lines) {
      const difference = parseFloat(line.countedQuantity) - parseFloat(line.systemQuantity);
      
      if (difference !== 0) {
        // Check if stock level exists
        const existingStock = await erpDb.query.stockLevels.findFirst({
          where: and(
            eq(stockLevels.productId, line.productId),
            eq(stockLevels.warehouseId, adjustment.warehouseId),
            line.warehouseLocationId 
              ? eq(stockLevels.locationId, line.warehouseLocationId)
              : sql`location_id IS NULL`
          ),
        });

        if (existingStock) {
          // Update existing stock level
          await erpDb
            .update(stockLevels)
            .set({
              quantityOnHand: sql`quantity_on_hand + ${difference}`,
              lastCountedAt: new Date(),
              lastCountedBy: user.id,
              updatedAt: new Date(),
            })
            .where(eq(stockLevels.id, existingStock.id));
        } else {
          // Create new stock level
          await erpDb.insert(stockLevels).values({
            productId: line.productId,
            productVariantId: line.productVariantId || null,
            warehouseId: adjustment.warehouseId,
            locationId: line.warehouseLocationId || null,
            quantityOnHand: line.countedQuantity,
            quantityReserved: '0',
            lastCountedAt: new Date(),
            lastCountedBy: user.id,
          });
        }
      }
    }

    // Update adjustment status
    const [updated] = await erpDb
      .update(stockAdjustments)
      .set({
        status: 'confirmed',
        approvedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(stockAdjustments.id, id))
      .returning();

    return NextResponse.json({ adjustment: updated });
  } catch (err: any) {
    console.error('Error confirming stock adjustment:', err);
    return NextResponse.json(
      { error: 'Failed to confirm stock adjustment' },
      { status: 500 }
    );
  }
}

// DELETE /api/erp/inventory/adjustments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireErpAccess(req, 'manager');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'delete')) {
    return NextResponse.json(
      { error: 'No permission to delete stock adjustments' },
      { status: 403 }
    );
  }

  try {
    const existing = await erpDb.query.stockAdjustments.findFirst({
      where: and(
        eq(stockAdjustments.id, id),
        eq(stockAdjustments.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Stock adjustment not found' },
        { status: 404 }
      );
    }

    // Can only delete draft adjustments
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft adjustments' },
        { status: 400 }
      );
    }

    await erpDb
      .delete(stockAdjustments)
      .where(eq(stockAdjustments.id, id));

    return NextResponse.json({ message: 'Stock adjustment deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting stock adjustment:', err);
    return NextResponse.json(
      { error: 'Failed to delete stock adjustment' },
      { status: 500 }
    );
  }
}