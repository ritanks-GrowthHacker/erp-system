# 📦 Inventory Management Workflow Guide

## Complete Product-to-Stock Flow

### Step 1: Create a Product
**Path**: Inventory → Products → "+ Add Product"

1. Click "+ Add Product" button
2. Fill in product details:
   - **Name**: e.g., "Laptop Dell XPS 15"
   - **SKU**: e.g., "DELL-XPS-001"
   - **Category**: Select or create category
   - **Product Type**: storable, consumable, or service
   - **Reorder Point**: e.g., 10 (alerts trigger when stock falls below this)
   - **Cost Price**: e.g., 50000
   - **Sale Price**: e.g., 75000
3. Click "Create Product"

**Result**: Product created but has NO stock yet

---

### Step 2: Create a Warehouse (if not exists)
**Path**: Inventory → Warehouses → "+ Add Warehouse"

1. Click "+ Add Warehouse"
2. Fill warehouse details:
   - **Name**: e.g., "Mumbai Main Warehouse"
   - **Code**: e.g., "MUM-WH-01"
   - **Address**: Full address
   - **City**: Mumbai
   - **State**: Maharashtra
   - **Country**: India
   - **Phone** & **Email**: Contact details
3. Click "Create Warehouse"

**Result**: Warehouse created, ready to store products

---

### Step 3: Check Stock Status
**Path**: Inventory → Stock Levels

**What you'll see**:
- If product has NO stock: It won't appear in the list
- If product has stock: Shows current quantity, warehouse, location

**To search for a product**:
1. Use the search bar: Type product name or SKU
2. Filter by warehouse: Select specific warehouse
3. Toggle "Low Stock Only": See items needing reorder

---

### Step 4: Assign Stock to Warehouse
**Path**: Inventory → Stock Levels → "Assign Product to Warehouse"

This is how you ADD stock when it doesn't exist or increase quantity:

1. Click **"Assign Product to Warehouse"** button
2. Fill the form:
   - **Product**: Select the product you created
   - **Warehouse**: Select where to store it
   - **Location** (Optional): Specific location within warehouse (Zone A, Shelf 1, etc.)
   - **Quantity**: e.g., 100
3. Click **"Assign Stock"**

**Result**: 
- Stock level created/updated
- Product now appears in Stock Levels list
- If quantity < reorder point → Alert generated

---

### Step 5: View Stock Levels
**Path**: Inventory → Stock Levels

**Table shows**:
- **Product**: Name and SKU
- **Warehouse**: Where it's stored
- **Location**: Specific location OR warehouse city/state
- **On Hand**: Total physical quantity
- **Reserved**: Quantity reserved for orders
- **Available**: On Hand - Reserved
- **Reorder Point**: Minimum threshold
- **Status**: In Stock / Low Stock / Out of Stock

**Status Colors**:
- 🟢 **Green**: In Stock (available > reorder point)
- 🟡 **Yellow**: Low Stock (available ≤ reorder point but > 0)
- 🔴 **Red**: Out of Stock (available ≤ 0)

---

### Step 6: Monitor Stock Alerts
**Path**: Inventory → Alerts

**Alerts automatically appear when**:
- Stock level ≤ reorder point → **Low Stock** alert (Yellow)
- Stock level ≤ 0 → **Out of Stock** alert (Red/Critical)

**What you see**:
- **Active Alerts**: Current unresolved alerts
- **Out of Stock Count**: Products with zero stock
- **Low Stock Count**: Products below reorder point

**Alert Details**:
- Product name and SKU
- Warehouse location
- Current quantity vs. threshold quantity
- Alert type and level
- Creation date

**Actions**:
- **Mark Resolved**: Dismiss alert after fixing issue

---

### Step 7: View Analytics
**Path**: Inventory → Analytics

**Dashboard shows**:
- **Total Products**: Count of unique products
- **Total Inventory Value**: Sum of (quantity × cost price)
- **Low Stock Items**: Count of items needing attention
- **Out of Stock Items**: Count of items with zero stock

**Charts & Reports**:
- **Top Products by Quantity**: Most stocked items
- **Stock by Category**: Distribution across categories
- **Recent Movements**: Latest stock transactions

---

## Common Workflows

### Workflow A: New Product Entry
```
1. Inventory → Products → Create Product
2. Inventory → Stock Levels → Assign Product to Warehouse
3. Verify: Product appears in Stock Levels with quantity
4. Check: Analytics updates with new product
```

### Workflow B: Stock Replenishment
```
1. Inventory → Alerts → Check Low Stock alerts
2. Inventory → Stock Levels → Find product
3. Click "Assign Product to Warehouse" → Add more quantity
4. Verify: Alert disappears (if stock > reorder point)
```

### Workflow C: Stock Transfer Between Warehouses
```
1. Inventory → Movements → Create Movement
2. Type: Internal Transfer
3. Source Warehouse: Where stock currently is
4. Destination Warehouse: Where to move it
5. Add product lines with quantities
6. Status: Complete
7. Verify: Stock levels updated in both warehouses
```

### Workflow D: Daily Stock Check
```
1. Inventory → Dashboard → View summary cards
2. Inventory → Alerts → Check active alerts
3. Inventory → Stock Levels → Review low stock filter
4. Inventory → Analytics → Review inventory value
```

---

## Troubleshooting

### ❓ "I added a product but don't see stock"
**Solution**: Products and stock are separate. After creating a product, you must assign it to a warehouse via "Stock Levels → Assign Product to Warehouse"

### ❓ "Location shows city/state instead of specific location"
**Normal behavior**: When no specific warehouse location is assigned, it displays the warehouse's city and state as a fallback. To fix:
1. Go to warehouse detail page
2. Add locations (Zone A, Shelf 1, etc.)
3. Reassign product to specific location

### ❓ "Alerts not showing even though stock is 0"
**Check**:
1. Ensure you ran the database migration script
2. Product must have a reorder point set (> 0)
3. Stock must be assigned to a warehouse
4. Refresh alerts page

### ❓ "Analytics showing wrong numbers"
**Check**:
1. Ensure products have cost prices set
2. Stock must be assigned to warehouses
3. Database views may need refresh (run migration)

---

## Quick Reference

| Action | Path |
|--------|------|
| Create Product | Inventory → Products → + Add Product |
| Check Stock | Inventory → Stock Levels |
| Add/Update Stock | Stock Levels → Assign Product to Warehouse |
| View Alerts | Inventory → Alerts |
| See Reports | Inventory → Analytics |
| Manage Warehouses | Inventory → Warehouses |
| Stock Movements | Inventory → Movements |
| Stock Adjustments | Inventory → Adjustments |

---

## Key Concepts

**Product**: The item definition (name, SKU, prices)
**Stock Level**: Physical quantity in a warehouse
**Warehouse**: Physical storage location
**Location**: Specific spot within warehouse (optional)
**Reorder Point**: Minimum quantity before alert triggers
**Movement**: Transfer of stock (in/out/between)
**Adjustment**: Manual correction of stock quantity
**Alert**: Notification when stock is low/out

---

## Database Migration Required

⚠️ **IMPORTANT**: For alerts to work, you must run the SQL migration:

```powershell
# Using pgAdmin or any PostgreSQL client
# Execute: scripts/inventory-module-enhancements.sql
# Against: erpDb database
```

This creates:
- Stock alerts table
- Automatic alert triggers
- Analytics views
- All necessary indexes
