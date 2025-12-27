import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { products, stockLevels, warehouses } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/erp/inventory/products/[id]/lifecycle
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view products' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to user's organization
    const product = await erpDb.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch warehouse stock levels using Drizzle ORM
    const warehouseStockLevels = await erpDb
      .select({
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
        quantityOnHand: stockLevels.quantityOnHand,
        quantityReserved: stockLevels.quantityReserved,
        reorderPoint: products.reorderPoint,
        lastUpdated: stockLevels.updatedAt,
      })
      .from(stockLevels)
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(
        and(
          eq(stockLevels.productId, id),
          eq(warehouses.erpOrganizationId, user.erpOrganizationId)
        )
      )
      .orderBy(desc(stockLevels.updatedAt));

    // Calculate available quantity for each warehouse
    const warehouseData = warehouseStockLevels.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      quantityOnHand: parseFloat(item.quantityOnHand || '0'),
      quantityReserved: parseFloat(item.quantityReserved || '0'),
      quantityAvailable: 
        parseFloat(item.quantityOnHand || '0') - 
        parseFloat(item.quantityReserved || '0'),
      reorderPoint: parseFloat(item.reorderPoint || '0'),
      lastUpdated: item.lastUpdated,
    }));

    // Calculate total inventory across all warehouses
    const totalOnHand = warehouseData.reduce(
      (sum, wh) => sum + wh.quantityOnHand, 
      0
    );
    const totalReserved = warehouseData.reduce(
      (sum, wh) => sum + wh.quantityReserved, 
      0
    );
    const totalAvailable = totalOnHand - totalReserved;

    return NextResponse.json({
      productId: id,
      productName: product.name,
      productSku: product.sku,
      summary: {
        totalOnHand,
        totalReserved,
        totalAvailable,
        reorderPoint: parseFloat(product.reorderPoint || '0'),
        reorderQuantity: parseFloat(product.reorderQuantity || '0'),
      },
      warehouses: warehouseData,
    });
  } catch (err: any) {
    console.error('Error fetching product lifecycle:', err);
    return NextResponse.json(
      { error: 'Failed to fetch product lifecycle data' },
      { status: 500 }
    );
  }
}