import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { stockMovements, stockMovementLines } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

// GET /api/erp/inventory/movements
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view stock movements' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const movementType = searchParams.get('movementType');
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const conditions = [eq(stockMovements.erpOrganizationId, user.erpOrganizationId)];
    
    if (movementType) {
      conditions.push(eq(stockMovements.movementType, movementType));
    }
    
    if (status) {
      conditions.push(eq(stockMovements.status, status));
    }
    
    if (warehouseId) {
      // Movement involves this warehouse as source or destination
      conditions.push(
        and(
          eq(stockMovements.sourceWarehouseId, warehouseId)
        ) as any
      );
    }
    
    if (fromDate) {
      conditions.push(gte(stockMovements.createdAt, new Date(fromDate)));
    }
    
    if (toDate) {
      conditions.push(lte(stockMovements.createdAt, new Date(toDate)));
    }

    const movements = await erpDb.query.stockMovements.findMany({
      where: and(...conditions),
      with: {
        lines: {
          with: {
            product: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(stockMovements.createdAt)],
    });

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total: movements.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching stock movements:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}

// POST /api/erp/inventory/movements
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create stock movements' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      movementType,
      sourceWarehouseId,
      sourceLocationId,
      destinationWarehouseId,
      destinationLocationId,
      scheduledDate,
      notes,
      lines, // Array of { productId, productVariantId, quantityOrdered, unitCost }
    } = body;

    if (!movementType || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: movementType, lines' },
        { status: 400 }
      );
    }

    // Validate movement type requirements
    if (movementType === 'internal_transfer' && (!sourceWarehouseId || !destinationWarehouseId)) {
      return NextResponse.json(
        { error: 'Internal transfer requires both source and destination warehouses' },
        { status: 400 }
      );
    }

    // Create movement
    const [newMovement] = await erpDb
      .insert(stockMovements)
      .values({
        erpOrganizationId: user.erpOrganizationId,
        movementType,
        sourceWarehouseId: sourceWarehouseId || null,
        sourceLocationId: sourceLocationId || null,
        destinationWarehouseId: destinationWarehouseId || null,
        destinationLocationId: destinationLocationId || null,
        status: 'draft',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        createdBy: user.id,
      })
      .returning();

    // Create movement lines
    const movementLines = await erpDb
      .insert(stockMovementLines)
      .values(
        lines.map((line: any) => ({
          stockMovementId: newMovement.id,
          productId: line.productId,
          productVariantId: line.productVariantId || null,
          serialLotId: line.serialLotId || null,
          quantityOrdered: line.quantityOrdered,
          quantityProcessed: '0',
          uomId: line.uomId || null,
          unitCost: line.unitCost || null,
          notes: line.notes || null,
        }))
      )
      .returning();

    return NextResponse.json({
      movement: newMovement,
      lines: movementLines,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating stock movement:', err);
    return NextResponse.json(
      { error: 'Failed to create stock movement' },
      { status: 500 }
    );
  }
}
