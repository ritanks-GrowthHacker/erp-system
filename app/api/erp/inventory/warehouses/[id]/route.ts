import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { warehouses, warehouseLocations } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// GET /api/erp/inventory/warehouses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view warehouses' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    
    const warehouse = await erpDb.query.warehouses.findFirst({
      where: and(
        eq(warehouses.id, id),
        eq(warehouses.erpOrganizationId, user.erpOrganizationId)
      ),
      with: {
        locations: true,
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ warehouse });
  } catch (err: any) {
    console.error('Error fetching warehouse:', err);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

// PUT /api/erp/inventory/warehouses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireErpAccess(req, 'manager');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'edit')) {
    return NextResponse.json(
      { error: 'No permission to edit warehouses' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      code,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      managerUserId,
      isActive,
    } = body;

    // Check if warehouse exists
    const existing = await erpDb.query.warehouses.findFirst({
      where: and(
        eq(warehouses.id, id),
        eq(warehouses.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Check if code is being changed and already exists
    if (code && code !== existing.code) {
      const codeExists = await erpDb.query.warehouses.findFirst({
        where: and(
          eq(warehouses.erpOrganizationId, user.erpOrganizationId),
          eq(warehouses.code, code)
        ),
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Warehouse with this code already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await erpDb
      .update(warehouses)
      .set({
        name: name ?? existing.name,
        code: code ?? existing.code,
        address: address ?? existing.address,
        city: city ?? existing.city,
        state: state ?? existing.state,
        country: country ?? existing.country,
        postalCode: postalCode ?? existing.postalCode,
        phone: phone ?? existing.phone,
        email: email ?? existing.email,
        managerUserId: managerUserId ?? existing.managerUserId,
        isActive: isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      .returning();

    return NextResponse.json({ warehouse: updated });
  } catch (err: any) {
    console.error('Error updating warehouse:', err);
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

// DELETE /api/erp/inventory/warehouses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireErpAccess(req, 'manager');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'delete')) {
    return NextResponse.json(
      { error: 'No permission to delete warehouses' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const existing = await erpDb.query.warehouses.findFirst({
      where: and(
        eq(warehouses.id, id),
        eq(warehouses.erpOrganizationId, user.erpOrganizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Check if warehouse has stock levels
    const hasStock = await erpDb.query.stockLevels.findFirst({
      where: eq(warehouses.id, id),
    });

    if (hasStock) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with existing stock. Mark as inactive instead.' },
        { status: 400 }
      );
    }

    await erpDb
      .delete(warehouses)
      .where(eq(warehouses.id, id));

    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting warehouse:', err);
    return NextResponse.json(
      { error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}
