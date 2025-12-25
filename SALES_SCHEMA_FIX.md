# Sales Quotations & Invoices Schema Fix

## Problem
The sales quotations and invoices API endpoints were failing because the database schema was missing the required tables:
- `sales_quotations` 
- `sales_quotation_lines`
- `sales_invoices`
- `sales_invoice_lines`

## Solution

### 1. Added Schema Definitions
Added the following tables to [lib/db/schema/purchasing-sales.ts](lib/db/schema/purchasing-sales.ts):

**Sales Quotations:**
- Main table: `salesQuotations`
- Lines table: `salesQuotationLines`
- Includes: quotation number, customer, dates, status, amounts, payment terms

**Sales Invoices:**
- Main table: `salesInvoices`  
- Lines table: `salesInvoiceLines`
- Includes: invoice number, customer, sales order link, dates, status, amounts, payment tracking

### 2. Added Relations
Added Drizzle ORM relations for:
- `salesQuotationsRelations` - Links to customers, organization, and quotation lines
- `salesQuotationLinesRelations` - Links to quotations, products, variants
- `salesInvoicesRelations` - Links to customers, orders, organization, and invoice lines
- `salesInvoiceLinesRelations` - Links to invoices, products, variants

### 3. Created Migration Script
Created SQL migration at [scripts/add-sales-quotations-invoices.sql](scripts/add-sales-quotations-invoices.sql) to:
- Create all 4 new tables
- Add proper indexes for performance
- Set up foreign key constraints
- Add table comments for documentation

## How to Apply

Run the migration script against your ERP database:

```powershell
# Using psql
Get-Content .\scripts\add-sales-quotations-invoices.sql | psql -U postgres -d erp_system

# Or using your database client
psql -U postgres -d erp_system -f .\scripts\add-sales-quotations-invoices.sql
```

## Schema Details

### sales_quotations
- Tracks customer quotations/proposals
- Status: draft, sent, accepted, rejected, expired
- Links to customers and organization
- Stores totals, tax, payment terms

### sales_quotation_lines
- Individual line items for quotations
- Links to products with quantity and pricing
- Supports discounts and tax rates
- Optional product variant support

### sales_invoices
- Customer invoices with payment tracking
- Can link to sales orders
- Tracks paid amount and balance
- Status: draft, sent, paid, partially_paid, overdue

### sales_invoice_lines
- Line items for invoices
- Product details with pricing
- Discount and tax support
- Quantity tracking

## API Endpoints Fixed
After running the migration, these endpoints will work:
- ✅ `POST /api/erp/sales/quotations` - Create quotations
- ✅ `GET /api/erp/sales/quotations` - List quotations
- ✅ `POST /api/erp/sales/invoices` - Create invoices
- ✅ `GET /api/erp/sales/invoices` - List invoices
- ✅ `GET /api/erp/sales/analytics` - Sales analytics (uses these tables)

## Files Modified
1. `lib/db/schema/purchasing-sales.ts` - Added table schemas and relations
2. `scripts/add-sales-quotations-invoices.sql` - Migration script

## Next Steps
1. Run the migration script
2. Restart your application
3. Test the quotations and invoices API endpoints
4. Verify data can be created and retrieved
