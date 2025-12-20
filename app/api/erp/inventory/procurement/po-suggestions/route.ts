import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireErpAccess, hasPermission } from '@/lib/auth';

// GET: Fetch purchase order suggestions
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'view')) {
    return NextResponse.json({ error: 'No permission to view inventory' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const suggestions = await erpDb.execute(sql`
      SELECT 
        pos.*,
        p.name as product_name,
        p.sku as product_sku,
        p.image_url as product_image,
        w.name as warehouse_name,
        pc.name as category_name
      FROM purchase_order_suggestions pos
      JOIN products p ON p.id = pos.product_id
      LEFT JOIN warehouses w ON w.id = pos.warehouse_id
      LEFT JOIN product_categories pc ON pc.id = p.product_category_id
      WHERE pos.erp_organization_id = ${user.erpOrganizationId}
      ${status !== 'all' ? sql`AND pos.status = ${status}` : sql``}
      ORDER BY 
        CASE pos.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        pos.days_of_stock_remaining ASC,
        pos.created_at DESC
    `);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error fetching purchase order suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Generate new suggestions (run the automated function)
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'edit')) {
    return NextResponse.json({ error: 'No permission to edit inventory' }, { status: 403 });
  }

  try {
    // Run the stored procedure to generate suggestions
    await erpDb.execute(sql`SELECT generate_purchase_order_suggestions()`);

    // Count the newly generated suggestions
    const countResult = await erpDb.execute(sql`
      SELECT COUNT(*) as count 
      FROM purchase_order_suggestions 
      WHERE erp_organization_id = ${user.erpOrganizationId}
      AND status = 'pending'
    `);

    const count = countResult[0]?.count || 0;

    return NextResponse.json({ 
      message: 'Purchase order suggestions generated successfully',
      count: parseInt(count.toString())
    });
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update suggestion status
export async function PUT(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'inventory', 'edit')) {
    return NextResponse.json({ error: 'No permission to edit inventory' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Suggestion ID and status are required' },
        { status: 400 }
      );
    }

    const result = await erpDb.execute(sql`
      UPDATE purchase_order_suggestions
      SET
        status = ${status},
        notes = ${notes || null},
        approved_at = ${status === 'approved' ? sql`NOW()` : sql`NULL`},
        approved_by = ${status === 'approved' ? user.id : null}
      WHERE id = ${id} AND erp_organization_id = ${user.erpOrganizationId}
      RETURNING *
    `);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json({ suggestion: result[0] });
  } catch (error: any) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion', details: error.message },
      { status: 500 }
    );
  }
}
