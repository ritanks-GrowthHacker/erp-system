import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { eq, and, like } from 'drizzle-orm';

// GET /api/erp/sales/customers
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'sales', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view customers' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const conditions = [eq(customers.erpOrganizationId, user.erpOrganizationId)];
    
    if (search) {
      conditions.push(like(customers.name, `%${search}%`));
    }
    
    if (isActive !== null) {
      conditions.push(eq(customers.isActive, isActive === 'true'));
    }

    const customersList = await erpDb.query.customers.findMany({
      where: and(...conditions),
      with: {
        contacts: true,
      },
    });

    return NextResponse.json({ customers: customersList });
  } catch (err: any) {
    console.error('Error fetching customers:', err);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/erp/sales/customers
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req, 'user');
  if (error) return error;

  if (!hasPermission(user, 'sales', 'create')) {
    return NextResponse.json(
      { error: 'No permission to create customers' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      code,
      email,
      phone,
      website,
      billingAddress,
      shippingAddress,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      currencyCode,
      creditLimit,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Generate code if not provided
    const customerCode = code || `CUS${Date.now().toString().slice(-6)}`;

    // Check if code already exists
    const existing = await erpDb.query.customers.findFirst({
      where: and(
        eq(customers.erpOrganizationId, user.erpOrganizationId),
        eq(customers.code, customerCode)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this code already exists' },
        { status: 409 }
      );
    }

    const [newCustomer] = await erpDb
      .insert(customers)
      .values({
        erpOrganizationId: user.erpOrganizationId,
        name,
        code: customerCode,
        email,
        phone,
        website,
        billingAddress,
        shippingAddress,
        city,
        state,
        country,
        postalCode,
        taxId,
        paymentTerms: paymentTerms || 30,
        currencyCode: currencyCode || 'USD',
        creditLimit: creditLimit || '0',
        notes,
        createdBy: user.id,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating customer:', err);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
