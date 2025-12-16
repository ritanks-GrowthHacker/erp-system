import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { warehouses } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// GET /api/erp/inventory/warehouses
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view warehouses' },
      { status: 403 }
    );
  }

  try {
    const warehousesList = await erpDb.query.warehouses.findMany({
      where: eq(warehouses.erpOrganizationId, user.erpOrganizationId),
      with: {
        locations: true,
      },
    });

    return NextResponse.json({ warehouses: warehousesList });
  } catch (err: any) {
    console.error('Error fetching warehouses:', err);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/erp/inventory/warehouses
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'manager');
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create warehouses' },
      { status: 403 }
    );
  }

  try {
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
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await erpDb.query.warehouses.findFirst({
      where: and(
        eq(warehouses.erpOrganizationId, user.erpOrganizationId),
        eq(warehouses.code, code)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Warehouse with this code already exists' },
        { status: 409 }
      );
    }

    const [newWarehouse] = await erpDb
      .insert(warehouses)
      .values({
        erpOrganizationId: user.erpOrganizationId,
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
        isActive: true,
      })
      .returning();

    return NextResponse.json({ warehouse: newWarehouse }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating warehouse:', err);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
