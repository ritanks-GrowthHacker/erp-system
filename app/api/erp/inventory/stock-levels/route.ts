import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { stockLevels, warehouses, products } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/erp/inventory/stock-levels
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view stock levels' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const lowStock = searchParams.get('lowStock') === 'true';

    // Build query conditions
    const conditions = [];
    
    if (warehouseId) {
      conditions.push(eq(stockLevels.warehouseId, warehouseId));
    }
    
    if (productId) {
      conditions.push(eq(stockLevels.productId, productId));
    }

    let stockLevelsList = await erpDb.query.stockLevels.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        product: true,
        warehouse: true,
        location: true,
      },
    });

    // Filter for low stock if requested
    if (lowStock) {
      stockLevelsList = stockLevelsList.filter((sl: any) => {
        const available = parseFloat(sl.quantityOnHand || '0') - parseFloat(sl.quantityReserved || '0');
        const reorderPoint = parseFloat(sl.product?.reorderPoint || '0');
        return available <= reorderPoint;
      });
    }

    return NextResponse.json({ stockLevels: stockLevelsList });
  } catch (err: any) {
    console.error('Error fetching stock levels:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stock levels' },
      { status: 500 }
    );
  }
}

// POST /api/erp/inventory/stock-levels
// Manual stock level creation/update
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create stock levels' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      productId,
      warehouseId,
      locationId,
      quantityOnHand,
      quantityReserved,
    } = body;

    if (!productId || !warehouseId) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, warehouseId' },
        { status: 400 }
      );
    }

    // Verify warehouse belongs to organization
    const warehouse = await erpDb.query.warehouses.findFirst({
      where: and(
        eq(warehouses.id, warehouseId),
        eq(warehouses.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Verify product belongs to organization
    const product = await erpDb.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Check if stock level already exists
    const existing = await erpDb.query.stockLevels.findFirst({
      where: and(
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId),
        locationId 
          ? eq(stockLevels.locationId, locationId)
          : sql`location_id IS NULL`
      ),
    });

    if (existing) {
      // Update existing
      const [updated] = await erpDb
        .update(stockLevels)
        .set({
          quantityOnHand: quantityOnHand ?? existing.quantityOnHand,
          quantityReserved: quantityReserved ?? existing.quantityReserved,
          lastCountedAt: new Date(),
          lastCountedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(stockLevels.id, existing.id))
        .returning();

      return NextResponse.json({ stockLevel: updated });
    } else {
      // Create new
      const [newStockLevel] = await erpDb
        .insert(stockLevels)
        .values({
          productId,
          warehouseId,
          locationId: locationId || null,
          quantityOnHand: quantityOnHand || '0',
          quantityReserved: quantityReserved || '0',
          lastCountedAt: new Date(),
          lastCountedBy: user.id,
        })
        .returning();

      return NextResponse.json({ stockLevel: newStockLevel }, { status: 201 });
    }
  } catch (err: any) {
    console.error('Error creating/updating stock level:', err);
    return NextResponse.json(
      { error: 'Failed to create/update stock level' },
      { status: 500 }
    );
  }
}

