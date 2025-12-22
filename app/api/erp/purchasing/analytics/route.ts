import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { requireErpAccess, hasPermission } from '@/lib/auth';
import { sql } from 'drizzle-orm';

// GET /api/erp/purchasing/analytics
export async function GET(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  if (!hasPermission(user, 'purchasing', 'view')) {
    return NextResponse.json(
      { error: 'No permission to view purchasing analytics' },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const supplierId = searchParams.get('supplierId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let poSummary: any = [];
    let rfqSummary: any = [];
    let topSuppliers: any = [];
    let purchaseTrends: any = [];
    let categorySpending: any = [];
    let invoiceSummary: any = [];
    let deliveryPerformance: any = [];
    let topProducts: any = [];
    let pendingReceipts: any = [];

    try {
      // Purchase order summary statistics
      poSummary = await erpDb.execute(sql`
        SELECT 
          COUNT(*) as total_purchase_orders,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
          COUNT(CASE WHEN status = 'partially_received' THEN 1 END) as partially_received_count,
          COUNT(CASE WHEN status = 'received' THEN 1 END) as received_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
          COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as total_purchase_value,
          COALESCE(SUM(CASE WHEN status IN ('confirmed', 'partially_received') THEN CAST(total_amount AS DECIMAL) ELSE 0 END), 0) as pending_value,
          COALESCE(SUM(CASE WHEN status = 'received' THEN CAST(total_amount AS DECIMAL) ELSE 0 END), 0) as completed_value
        FROM purchase_orders
        WHERE erp_organization_id = ${user.erpOrganizationId}
        ${supplierId ? sql`AND supplier_id = ${supplierId}` : sql``}
        ${startDate ? sql`AND po_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND po_date <= ${endDate}` : sql``}
      `);
    } catch (e: any) {
      console.error('Error in poSummary:', e.message);
      poSummary = [];
    }

    try {
      // RFQ statistics
      rfqSummary = await erpDb.execute(sql`
        SELECT 
          COUNT(*) as total_rfqs,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN status = 'received' THEN 1 END) as received_count,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count
        FROM request_for_quotations
        WHERE erp_organization_id = ${user.erpOrganizationId}
        ${startDate ? sql`AND rfq_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND rfq_date <= ${endDate}` : sql``}
      `);
    } catch (e: any) {
      console.error('Error in rfqSummary:', e.message);
      rfqSummary = [];
    }

    try {
      // Supplier performance (top suppliers by purchase value)
      topSuppliers = await erpDb.execute(sql`
        SELECT 
          s.id,
          s.name,
          s.code,
          COUNT(po.id) as total_orders,
          COALESCE(SUM(CAST(po.total_amount AS DECIMAL)), 0) as total_purchase_value,
          COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_orders,
          ROUND(
            (COUNT(CASE WHEN po.status = 'received' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(po.id), 0) * 100), 2
          ) as completion_rate
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE s.erp_organization_id = ${user.erpOrganizationId}
        ${startDate ? sql`AND po.po_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND po.po_date <= ${endDate}` : sql``}
        GROUP BY s.id, s.name, s.code
        ORDER BY total_purchase_value DESC
        LIMIT 10
      `);
    } catch (e: any) {
      console.error('Error in topSuppliers:', e.message);
      topSuppliers = [];
    }

    try {
      // Purchase trends by month (last 12 months)
      purchaseTrends = await erpDb.execute(sql`
        SELECT 
          TO_CHAR(po_date, 'YYYY-MM') as month,
          COUNT(*) as order_count,
          COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as total_value
        FROM purchase_orders
        WHERE erp_organization_id = ${user.erpOrganizationId}
          AND po_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(po_date, 'YYYY-MM')
        ORDER BY month DESC
      `);
    } catch (e: any) {
      console.error('Error in purchaseTrends:', e.message);
      purchaseTrends = [];
    }

    try {
      // Category-wise spending
      categorySpending = await erpDb.execute(sql`
        SELECT 
          COALESCE(c.name, 'Uncategorized') as category_name,
          COUNT(DISTINCT po.id) as order_count,
          COALESCE(SUM(CAST(pol.quantity_ordered AS DECIMAL) * CAST(pol.unit_price AS DECIMAL)), 0) as total_spending
        FROM purchase_order_lines pol
        JOIN purchase_orders po ON pol.purchase_order_id = po.id
        LEFT JOIN products p ON pol.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE po.erp_organization_id = ${user.erpOrganizationId}
        ${startDate ? sql`AND po.po_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND po.po_date <= ${endDate}` : sql``}
        GROUP BY c.name
        ORDER BY total_spending DESC
        LIMIT 10
      `);
    } catch (e: any) {
      console.error('Error in categorySpending:', e.message);
      categorySpending = [];
    }

    try {
      // Vendor invoice summary
      invoiceSummary = await erpDb.execute(sql`
        SELECT 
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
          COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as total_invoice_value,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN CAST(total_amount AS DECIMAL) ELSE 0 END), 0) as pending_value,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN CAST(total_amount AS DECIMAL) ELSE 0 END), 0) as paid_value
        FROM vendor_invoices
        WHERE erp_organization_id = ${user.erpOrganizationId}
        ${supplierId ? sql`AND supplier_id = ${supplierId}` : sql``}
        ${startDate ? sql`AND invoice_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND invoice_date <= ${endDate}` : sql``}
      `);
    } catch (e: any) {
      console.error('Error in invoiceSummary:', e.message);
      invoiceSummary = [];
    }

    try {
      // Average delivery time
      deliveryPerformance = await erpDb.execute(sql`
        SELECT 
          COUNT(*) as completed_orders,
          AVG(
            EXTRACT(DAY FROM (received_date - po_date))
          ) as avg_delivery_days
        FROM purchase_orders
        WHERE erp_organization_id = ${user.erpOrganizationId}
          AND status = 'received'
          AND received_date IS NOT NULL
        ${supplierId ? sql`AND supplier_id = ${supplierId}` : sql``}
        ${startDate ? sql`AND po_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND po_date <= ${endDate}` : sql``}
      `);
    } catch (e: any) {
      console.error('Error in deliveryPerformance:', e.message);
      deliveryPerformance = [];
    }

    try {
      // Top purchased products
      topProducts = await erpDb.execute(sql`
        SELECT 
          p.id,
          p.name,
          p.sku,
          COUNT(DISTINCT pol.purchase_order_id) as order_count,
          COALESCE(SUM(CAST(pol.quantity_ordered AS DECIMAL)), 0) as total_quantity,
          COALESCE(SUM(CAST(pol.quantity_ordered AS DECIMAL) * CAST(pol.unit_price AS DECIMAL)), 0) as total_value
        FROM purchase_order_lines pol
        JOIN products p ON pol.product_id = p.id
        JOIN purchase_orders po ON pol.purchase_order_id = po.id
        WHERE po.erp_organization_id = ${user.erpOrganizationId}
        ${startDate ? sql`AND po.po_date >= ${startDate}` : sql``}
        ${endDate ? sql`AND po.po_date <= ${endDate}` : sql``}
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_value DESC
        LIMIT 10
      `);
    } catch (e: any) {
      console.error('Error in topProducts:', e.message);
      topProducts = [];
    }

    try {
      // Pending items to receive
      pendingReceipts = await erpDb.execute(sql`
        SELECT 
          po.id,
          po.po_number,
          s.name as supplier_name,
          po.po_date,
          po.expected_delivery_date,
          po.total_amount,
          EXTRACT(DAY FROM (CURRENT_DATE - po.expected_delivery_date)) as days_overdue
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.erp_organization_id = ${user.erpOrganizationId}
          AND po.status IN ('confirmed', 'partially_received')
        ORDER BY po.expected_delivery_date ASC
        LIMIT 20
      `);
    } catch (e: any) {
      console.error('Error in pendingReceipts:', e.message);
      pendingReceipts = [];
    }

    return NextResponse.json({
      poSummary: Array.from(poSummary || [])[0] || {},
      rfqSummary: Array.from(rfqSummary || [])[0] || {},
      invoiceSummary: Array.from(invoiceSummary || [])[0] || {},
      deliveryPerformance: Array.from(deliveryPerformance || [])[0] || {},
      topSuppliers: Array.from(topSuppliers || []),
      purchaseTrends: Array.from(purchaseTrends || []),
      categorySpending: Array.from(categorySpending || []),
      topProducts: Array.from(topProducts || []),
      pendingReceipts: Array.from(pendingReceipts || []),
    });
  } catch (err: any) {
    console.error('Error fetching purchasing analytics:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch purchasing analytics',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: 500 }
    );
  }
}
