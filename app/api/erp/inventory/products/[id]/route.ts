import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { products, productSuppliers } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/erp/inventory/products/[id]
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

    const product = await erpDb.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        category: true,
        variants: true,
        stockLevels: {
          with: {
            warehouse: true,
            location: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (err: any) {
    console.error('Error fetching product:', err);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/erp/inventory/products/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to edit products' },
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

    const body = await req.json();
    const {
      name,
      barcode,
      description,
      productCategoryId,
      costPrice,
      salePrice,
      reorderPoint,
      reorderQuantity,
      leadTimeDays,
      imageUrl,
      notes,
      isActive,
      suppliers,
    } = body;

    // Check if product exists
    const existing = await erpDb.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product
    const [updatedProduct] = await erpDb
      .update(products)
      .set({
        name: name ?? existing.name,
        barcode: barcode ?? existing.barcode,
        description: description ?? existing.description,
        productCategoryId: productCategoryId ?? existing.productCategoryId,
        costPrice: costPrice ?? existing.costPrice,
        salePrice: salePrice ?? existing.salePrice,
        reorderPoint: reorderPoint ?? existing.reorderPoint,
        reorderQuantity: reorderQuantity ?? existing.reorderQuantity,
        leadTimeDays: leadTimeDays ?? existing.leadTimeDays,
        imageUrl: imageUrl ?? existing.imageUrl,
        notes: notes ?? existing.notes,
        isActive: isActive ?? existing.isActive,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Update suppliers if provided
    if (suppliers && Array.isArray(suppliers)) {
      // Delete existing suppliers
      await erpDb.delete(productSuppliers).where(eq(productSuppliers.productId, id));

      // Add new suppliers
      if (suppliers.length > 0) {
        const supplierValues = suppliers.map((sup: any) => ({
          productId: id,
          supplierId: sup.supplierId,
          supplierSku: sup.supplierSku || null,
          supplierProductName: sup.supplierProductName || null,
          unitPrice: sup.unitPrice,
          leadTimeDays: parseInt(sup.leadTimeDays) || 0,
          minimumOrderQuantity: sup.minimumOrderQuantity || '1',
          isPrimary: sup.isPrimary || false,
          isActive: sup.isActive !== false,
        }));

        await erpDb.insert(productSuppliers).values(supplierValues);
      }
    }

    return NextResponse.json({ product: updatedProduct });
  } catch (err: any) {
    console.error('Error updating product:', err);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/erp/inventory/products/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireErpAccess(req, 'manager');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'delete')) {
    return NextResponse.json(
      { error: 'No permission to delete products' },
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

    // Check if product exists
    const existing = await erpDb.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete (mark as inactive)
    await erpDb
      .update(products)
      .set({
        isActive: false,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}