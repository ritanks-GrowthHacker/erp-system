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
      AND pos.status NOT IN ('approved', 'ordered')
      ${status !== 'all' && status !== 'pending' ? sql`AND pos.status = ${status}` : sql``}
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

    // Get the suggestion details with supplier info
    const suggestion = await erpDb.execute(sql`
      SELECT 
        pos.*,
        p.name as product_name,
        ps.supplier_id,
        ps.unit_price
      FROM purchase_order_suggestions pos
      JOIN products p ON p.id = pos.product_id
      LEFT JOIN LATERAL (
        SELECT supplier_id, unit_price
        FROM product_suppliers
        WHERE product_id = pos.product_id
          AND is_active = true
        ORDER BY is_primary DESC, created_at DESC
        LIMIT 1
      ) ps ON true
      WHERE pos.id = ${id} AND pos.erp_organization_id = ${user.erpOrganizationId}
    `);

    if (suggestion.length === 0) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const suggestionData = suggestion[0];

    // Update suggestion status (will be changed to 'ordered' after PO creation)
    let finalStatus = status;
    const result = await erpDb.execute(sql`
      UPDATE purchase_order_suggestions
      SET
        status = ${finalStatus},
        notes = ${notes || null},
        approved_at = ${status === 'approved' ? sql`NOW()` : sql`NULL`},
        approved_by = ${status === 'approved' ? user.id : null}
      WHERE id = ${id} AND erp_organization_id = ${user.erpOrganizationId}
      RETURNING *
    `);

    // If approved, create purchase order
    if (status === 'approved') {
      const supplierId = suggestionData.supplier_id;
      const warehouseId = suggestionData.warehouse_id;

      if (!supplierId) {
        return NextResponse.json(
          { error: 'No supplier found for this product. Please assign a supplier first.' },
          { status: 400 }
        );
      }

      // Generate PO number
      const lastPO = await erpDb.execute(sql`
        SELECT po_number FROM purchase_orders
        WHERE erp_organization_id = ${user.erpOrganizationId}
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const lastPoNumber = (lastPO[0]?.po_number as string) || 'PO000000';
      const nextNumber = parseInt(String(lastPoNumber).replace('PO', '')) + 1;
      const poNumber = `PO${String(nextNumber).padStart(6, '0')}`;

      // Calculate amounts
      const unitPrice = parseFloat(String(suggestionData.unit_price || '0'));
      const quantity = parseFloat(String(suggestionData.suggested_quantity || '0'));
      const subtotal = unitPrice * quantity;
      const taxRate = 18; // Default 18% GST
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Create purchase order
      const newPO = await erpDb.execute(sql`
        INSERT INTO purchase_orders (
          erp_organization_id,
          supplier_id,
          warehouse_id,
          po_number,
          po_date,
          status,
          subtotal,
          tax_amount,
          total_amount,
          notes,
          created_by
        ) VALUES (
          ${user.erpOrganizationId},
          ${supplierId},
          ${warehouseId},
          ${poNumber},
          NOW(),
          'draft',
          ${subtotal.toFixed(2)},
          ${taxAmount.toFixed(2)},
          ${totalAmount.toFixed(2)},
          ${`Auto-generated from PO Suggestion - Priority: ${suggestionData.priority}, Days Remaining: ${suggestionData.days_of_stock_remaining}`},
          ${user.id}
        )
        RETURNING *
      `);

      // Create PO line
      await erpDb.execute(sql`
        INSERT INTO purchase_order_lines (
          purchase_order_id,
          product_id,
          description,
          quantity_ordered,
          unit_price,
          tax_rate
        ) VALUES (
          ${newPO[0].id},
          ${suggestionData.product_id},
          ${suggestionData.product_name},
          ${suggestionData.suggested_quantity},
          ${unitPrice.toFixed(2)},
          ${taxRate.toString()}
        )
      `);

      // Update suggestion status to 'ordered' now that PO is created
      await erpDb.execute(sql`
        UPDATE purchase_order_suggestions
        SET status = 'ordered', po_number = ${poNumber}
        WHERE id = ${id}
      `);

      // Send email to supplier
      try {
        await fetch(`${req.nextUrl.origin}/api/erp/purchasing/orders/${newPO[0].id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
        });
      } catch (emailError) {
        console.error('Failed to send PO email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        suggestion: { ...result[0], status: 'ordered', po_number: poNumber },
        purchaseOrder: newPO[0],
        message: 'Purchase order created and sent to supplier successfully'
      });
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
