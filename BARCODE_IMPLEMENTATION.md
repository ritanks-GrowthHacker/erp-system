# Auto-Generated Barcode Implementation

## Overview
The ERP system now automatically generates barcodes for all products. Barcodes are created using the format: `{ProductName}-{SKU}-{WarehouseCode}`

## Features Implemented

### 1. **Automatic Barcode Generation on Product Creation**
- When a new product is created via the UI or API, a barcode is automatically generated
- Format: `PRODUCTNAME-SKU-WH00`
- Example: `LAPTOPHP15-LT-HP-001-WH00`

### 2. **Database Migration Script**
Located at: `scripts/auto-generate-barcodes.sql`

This script:
- Creates a PostgreSQL function `generate_product_barcode()`
- Updates all existing products with NULL barcodes
- Creates a trigger to auto-generate barcodes on INSERT
- Uses the primary warehouse code when available

### 3. **API Integration**
File: `app/api/erp/inventory/products/route.ts`
- POST endpoint automatically generates barcode if not provided
- Uses product name (first 20 chars) + SKU + default warehouse code

## Implementation Details

### Barcode Format Rules:
1. **Product Name**: First 20 characters, uppercase, special chars removed
2. **SKU**: Full SKU code in uppercase
3. **Warehouse Code**: Primary warehouse code (defaults to 'WH00')

### Example Barcodes:
| Product | SKU | Warehouse | Generated Barcode |
|---------|-----|-----------|-------------------|
| HP Laptop 15" | LT-HP-001 | WH01 | HPLAPTOP15-LT-HP-001-WH01 |
| Dell Mouse Wireless | MS-DL-001 | WH02 | DELLMOUSEWIRELESS-MS-DL-001-WH02 |
| Samsung Monitor 24" | MN-SM-001 | WH00 | SAMSUNGMONITOR24-MN-SM-001-WH00 |

## Installation Instructions

### Step 1: Run the SQL Migration
1. Open **pgAdmin**
2. Connect to your database
3. Open and execute `scripts/auto-generate-barcodes.sql`
4. This will:
   - Create the barcode generation function
   - Update existing products with NULL barcodes
   - Create the auto-generation trigger

### Step 2: Verify Installation
Run this query in pgAdmin:
```sql
SELECT 
  id,
  name,
  sku,
  barcode,
  created_at
FROM erp.products
WHERE barcode IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Step 3: Test New Product Creation
1. Go to `/erp/inventory/products`
2. Click "Add Product"
3. Fill in product details (name, SKU will be auto-generated)
4. Submit the form
5. Check the product list - barcode should be auto-generated

## Technical Changes

### Files Modified:
1. **app/api/erp/inventory/products/route.ts**
   - Added auto-generation logic in POST endpoint
   - Barcode field now auto-populated if not provided

2. **app/erp/inventory/products/page.tsx**
   - Fixed React key warning
   - Barcode displayed in table (read-only)
   - No manual barcode input needed

3. **app/erp/inventory/analytics/page.tsx**
   - Fixed NaN issues with proper null checks
   - Added fallback values for all numeric operations

### Database Changes:
- **Function**: `generate_product_barcode()` - Generates barcode strings
- **Trigger**: `auto_generate_product_barcode` - Runs before INSERT on products table
- **Updated**: All existing products with NULL barcodes

## Benefits

✅ **No Manual Entry Required** - Barcodes auto-generated on product creation
✅ **Consistent Format** - All barcodes follow the same pattern
✅ **Unique Identifiers** - Combines product name, SKU, and warehouse
✅ **Database-Level Safety** - Trigger ensures no product without barcode
✅ **Backward Compatible** - Works with existing products via migration

## Troubleshooting

### If barcodes are not generating:
1. Check if the SQL migration was executed successfully
2. Verify the trigger exists: 
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'auto_generate_product_barcode';
   ```
3. Check if the function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'generate_product_barcode';
   ```

### To regenerate all barcodes:
Run this query in pgAdmin:
```sql
UPDATE erp.products p
SET barcode = generate_product_barcode(
  p.name,
  p.sku,
  'WH00'
);
```

## Future Enhancements

Potential improvements:
- [ ] Update barcode when product is assigned to different primary warehouse
- [ ] Add barcode scanning integration
- [ ] Generate QR codes alongside barcodes
- [ ] Custom barcode format per organization
- [ ] Batch barcode printing feature

## Support

If you encounter any issues, check:
1. Database migration logs
2. API response when creating products
3. Browser console for any JavaScript errors
