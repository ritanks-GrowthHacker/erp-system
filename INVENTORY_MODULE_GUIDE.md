# 📦 Inventory Management Module - Complete Guide

## Table of Contents
1. [Module Overview](#module-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [UI Components](#ui-components)
5. [Features & Capabilities](#features--capabilities)
6. [User Workflows](#user-workflows)
7. [Setup Instructions](#setup-instructions)
8. [Advanced Features](#advanced-features)

---

## Module Overview

The Inventory Management module is the **brain of your warehouse** - a comprehensive system for tracking products, stock levels, warehouse locations, and all inventory movements across your organization.

### What It Does

✅ **Product Management** - Catalog all your products with detailed information  
✅ **Multi-Warehouse Support** - Manage inventory across multiple locations  
✅ **Real-time Stock Tracking** - Know exactly what you have, where it is  
✅ **Serial/Lot Tracking** - Track individual items or batches  
✅ **Stock Movements** - Record all inventory transfers and changes  
✅ **Stock Adjustments** - Correct discrepancies with full audit trail  
✅ **Automated Alerts** - Get notified when stock is low  
✅ **Analytics & Reporting** - Insights into inventory value, turnover, and more  

### Key Benefits

🎯 **Never Run Out** - Automatic reorder point alerts  
💰 **Reduce Costs** - Optimize stock levels, minimize holding costs  
🔍 **Full Traceability** - Know the history of every item  
📊 **Data-Driven Decisions** - Real-time analytics and reports  
⚡ **Increase Efficiency** - Automated workflows save time  

---

## Database Schema

### Core Tables

#### 1. **products**
Stores all product information.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  erp_organization_id UUID NOT NULL,
  product_category_id UUID,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(100),
  description TEXT,
  product_type VARCHAR(50), -- 'storable', 'consumable', 'service'
  tracking_type VARCHAR(50), -- 'none', 'serial', 'lot'
  cost_price DECIMAL(15,2),
  sale_price DECIMAL(15,2),
  reorder_point DECIMAL(15,2),
  reorder_quantity DECIMAL(15,2),
  lead_time_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Fields:**
- `sku` - Unique identifier (Stock Keeping Unit)
- `product_type` - Storable items are tracked in inventory
- `tracking_type` - Enable serial/lot number tracking
- `reorder_point` - Trigger for low stock alerts
- `reorder_quantity` - Suggested order quantity

#### 2. **warehouses**
Physical or virtual storage locations.

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY,
  erp_organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  manager_user_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

#### 3. **warehouse_locations**
Specific locations within warehouses (zones, aisles, racks, shelves).

```sql
CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY,
  warehouse_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  location_type VARCHAR(50), -- 'zone', 'aisle', 'rack', 'shelf', 'bin'
  parent_location_id UUID,
  capacity DECIMAL(15,2),
  current_utilization DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true
);
```

#### 4. **stock_levels**
Real-time stock quantities by product and location.

```sql
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  location_id UUID,
  quantity_on_hand DECIMAL(15,2),
  quantity_reserved DECIMAL(15,2),
  quantity_available DECIMAL(15,2) GENERATED ALWAYS AS 
    (quantity_on_hand - quantity_reserved) STORED,
  last_counted_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(product_id, warehouse_id, location_id)
);
```

**Key Concepts:**
- `quantity_on_hand` - Physical stock available
- `quantity_reserved` - Allocated to orders but not yet shipped
- `quantity_available` - Can be sold/used (auto-calculated)

#### 5. **stock_movements**
Header table for inventory movements.

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  movement_type VARCHAR(50), -- 'receipt', 'delivery', 'internal_transfer', etc.
  source_warehouse_id UUID,
  destination_warehouse_id UUID,
  status VARCHAR(50), -- 'draft', 'confirmed', 'completed', 'cancelled'
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  created_by UUID,
  notes TEXT
);
```

#### 6. **stock_movement_lines**
Detail lines for each product in a movement.

```sql
CREATE TABLE stock_movement_lines (
  id UUID PRIMARY KEY,
  stock_movement_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity_ordered DECIMAL(15,2),
  quantity_processed DECIMAL(15,2),
  unit_cost DECIMAL(15,2)
);
```

#### 7. **stock_adjustments**
Corrections to stock levels (cycle counts, damages, etc.).

```sql
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY,
  warehouse_id UUID NOT NULL,
  adjustment_type VARCHAR(50), -- 'cycle_count', 'damage', 'found', etc.
  status VARCHAR(50),
  created_by UUID,
  approved_by UUID,
  notes TEXT
);
```

#### 8. **stock_adjustment_lines**
```sql
CREATE TABLE stock_adjustment_lines (
  id UUID PRIMARY KEY,
  stock_adjustment_id UUID NOT NULL,
  product_id UUID NOT NULL,
  counted_quantity DECIMAL(15,2),
  system_quantity DECIMAL(15,2),
  difference_quantity DECIMAL(15,2) GENERATED ALWAYS AS 
    (counted_quantity - system_quantity) STORED,
  reason TEXT
);
```

### Enhanced Tables (New)

#### 9. **product_categories**
Organize products into hierarchical categories.

#### 10. **product_images**
Multiple images per product.

#### 11. **product_suppliers**
Link products to suppliers with pricing info.

#### 12. **stock_alerts**
Automated alerts for low stock, expiry, etc.

#### 13. **serial_lot_numbers**
Track individual serial numbers or lot batches.

#### 14. **inventory_valuation_snapshots**
Historical inventory value for reporting.

#### 15. **barcode_scan_log**
Audit trail of all barcode scans.

---

## API Endpoints

### Products API

#### `GET /api/erp/inventory/products`
Get list of products with filtering and pagination.

**Query Parameters:**
- `search` - Search by product name
- `categoryId` - Filter by category
- `isActive` - Filter active/inactive
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Laptop Dell XPS 15",
      "sku": "LAP-DELL-XPS15",
      "costPrice": "1200.00",
      "salePrice": "1599.00",
      "category": { "name": "Electronics" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### `POST /api/erp/inventory/products`
Create a new product.

**Request Body:**
```json
{
  "name": "Laptop Dell XPS 15",
  "sku": "LAP-DELL-XPS15",
  "productType": "storable",
  "trackingType": "serial",
  "productCategoryId": "uuid",
  "costPrice": 1200.00,
  "salePrice": 1599.00,
  "reorderPoint": 10,
  "reorderQuantity": 50,
  "leadTimeDays": 7
}
```

#### `GET /api/erp/inventory/products/[id]`
Get single product details.

#### `PUT /api/erp/inventory/products/[id]`
Update product information.

#### `DELETE /api/erp/inventory/products/[id]`
Delete a product (admin only).

### Categories API

#### `GET /api/erp/inventory/categories`
List all product categories.

#### `POST /api/erp/inventory/categories`
Create new category.

#### `PUT /api/erp/inventory/categories/[id]`
Update category.

#### `DELETE /api/erp/inventory/categories/[id]`
Delete category.

### Warehouses API

#### `GET /api/erp/inventory/warehouses`
List all warehouses with locations.

#### `POST /api/erp/inventory/warehouses`
Create new warehouse.

#### `PUT /api/erp/inventory/warehouses/[id]`
Update warehouse details.

### Stock Levels API

#### `GET /api/erp/inventory/stock-levels`
Get current stock levels across warehouses.

**Query Parameters:**
- `warehouseId` - Filter by warehouse
- `productId` - Filter by product
- `lowStock` - Show only low stock items

### Stock Movements API

#### `GET /api/erp/inventory/movements`
List stock movements.

**Query Parameters:**
- `movementType` - receipt, delivery, internal_transfer, etc.
- `status` - draft, confirmed, completed
- `warehouseId` - Filter by warehouse
- `fromDate`, `toDate` - Date range

#### `POST /api/erp/inventory/movements`
Create new stock movement.

**Request Body:**
```json
{
  "movementType": "internal_transfer",
  "sourceWarehouseId": "uuid",
  "destinationWarehouseId": "uuid",
  "scheduledDate": "2025-12-10T10:00:00Z",
  "notes": "Transfer to fulfill order",
  "lines": [
    {
      "productId": "uuid",
      "quantityOrdered": 50,
      "unitCost": 100.00
    }
  ]
}
```

#### `PUT /api/erp/inventory/movements/[id]`
Update movement status or details.

**Request Body:**
```json
{
  "status": "completed",
  "completedDate": "2025-12-10T15:30:00Z",
  "quantityProcessed": [
    { "lineId": "uuid", "quantity": 50 }
  ]
}
```

### Stock Adjustments API

#### `GET /api/erp/inventory/adjustments`
List stock adjustments.

#### `POST /api/erp/inventory/adjustments`
Create new adjustment.

**Request Body:**
```json
{
  "warehouseId": "uuid",
  "adjustmentType": "cycle_count",
  "notes": "Monthly inventory count",
  "lines": [
    {
      "productId": "uuid",
      "countedQuantity": 95,
      "systemQuantity": 100,
      "reason": "5 units damaged"
    }
  ]
}
```

#### `POST /api/erp/inventory/adjustments/[id]/confirm`
Confirm and apply adjustment to stock levels.

### Analytics API

#### `GET /api/erp/inventory/analytics`
Comprehensive inventory analytics.

**Query Parameters:**
- `warehouseId` - Filter by warehouse

**Response:**
```json
{
  "summary": {
    "total_products": 500,
    "total_quantity": 15000,
    "total_value": 450000.00,
    "out_of_stock_count": 5,
    "low_stock_count": 23,
    "in_stock_count": 472
  },
  "reorderSuggestions": [...],
  "topValueProducts": [...],
  "stockByCategory": [...]
}
```

### Alerts API

#### `GET /api/erp/inventory/alerts`
Get stock alerts.

**Query Parameters:**
- `isResolved` - true/false
- `alertType` - low_stock, out_of_stock, expiry_warning
- `alertLevel` - info, warning, critical

#### `POST /api/erp/inventory/alerts/[id]/resolve`
Mark alert as resolved.

---

## UI Components

### 1. Inventory Dashboard (`/erp/inventory`)

**Features:**
- Summary cards (total products, inventory value, low stock, out of stock)
- Quick action buttons
- Reorder suggestions table
- Top value products
- Stock by category

**Use Case:** Daily overview for inventory managers

### 2. Products Page (`/erp/inventory/products`)

**Features:**
- Product list with search and filters
- Create/edit product form
- Product details view
- Stock levels per warehouse
- Quick actions (edit, delete, view stock)

**Use Case:** Product catalog management

### 3. Categories Page (`/erp/inventory/categories`)

**Features:**
- Hierarchical category view
- Create/edit categories
- Category-based organization
- Product count per category

**Use Case:** Organize products into logical groups

### 4. Stock Movements Page (`/erp/inventory/movements`)

**Features:**
- List of all movements with filters
- Movement type indicators
- Status tracking
- Create new movements
- View movement details

**Movement Types:**
- 📥 Receipt - Incoming stock
- 📤 Delivery - Outgoing stock
- 🔄 Internal Transfer - Between warehouses
- ↩️ Return - Customer/supplier returns
- 🗑️ Scrap - Damaged/expired items

**Use Case:** Track all inventory movements

### 5. Stock Adjustments Page (`/erp/inventory/adjustments`)

**Features:**
- List of adjustments
- Create cycle counts
- Confirm adjustments
- View variance reports
- Reason tracking

**Adjustment Types:**
- 🔢 Cycle Count - Regular inventory counts
- 📝 Write Off - Remove from books
- 💔 Damage - Damaged goods
- 🔍 Found - Discovered items
- ✏️ Correction - Fix errors

**Use Case:** Correct inventory discrepancies

---

## Features & Capabilities

### 1. Product Management

**Basic Product Info:**
- Name, SKU, Barcode
- Description
- Product type (storable, consumable, service)
- Category assignment
- Multiple images

**Pricing:**
- Cost price (what you pay)
- Sale price (what you charge)
- Multi-currency support (future)

**Inventory Control:**
- Reorder point (minimum stock level)
- Reorder quantity (how much to order)
- Lead time (days to receive)

**Tracking Options:**
- None - Basic quantity tracking
- Serial Numbers - Track individual items
- Lot Numbers - Track batches with expiry dates

### 2. Multi-Warehouse Management

**Warehouse Setup:**
- Multiple warehouses per organization
- Physical address and contact info
- Assign warehouse managers
- Active/inactive status

**Location Hierarchy:**
```
Warehouse
  └─ Zone (e.g., "Zone A")
      └─ Aisle (e.g., "Aisle 1")
          └─ Rack (e.g., "Rack 5")
              └─ Shelf (e.g., "Shelf 3")
                  └─ Bin (e.g., "Bin 12")
```

**Benefits:**
- Organize large warehouses efficiently
- Faster picking and putaway
- Track capacity utilization

### 3. Stock Tracking

**Real-Time Levels:**
- Quantity on hand (physical stock)
- Quantity reserved (allocated to orders)
- Quantity available (can be sold)

**Multi-Location:**
- See stock across all warehouses
- Transfer between locations
- Consolidate or distribute stock

**Serial/Lot Tracking:**
- Track individual units (laptops, phones)
- Track batches (food, medicine with expiry)
- Full traceability (who bought which serial number)

### 4. Stock Movements

**Automated Updates:**
When movement is completed, stock levels update automatically.

**Movement Types:**

**Receipt:**
- Incoming stock from suppliers
- Increases destination warehouse stock

**Delivery:**
- Outgoing stock to customers
- Decreases source warehouse stock

**Internal Transfer:**
- Move stock between warehouses
- Decreases source, increases destination

**Return:**
- Customer or supplier returns
- Increases warehouse stock

**Scrap:**
- Remove damaged/expired items
- Decreases stock

**Workflow:**
1. Create movement (Draft)
2. Confirm movement (Confirmed)
3. Process movement (Processing)
4. Complete movement (Completed) → Stock updated

### 5. Stock Adjustments

**When to Use:**
- Physical count doesn't match system
- Found extra items
- Discovered damage
- Correct data entry errors

**Process:**
1. Create adjustment with counted quantities
2. System shows variance (counted vs system)
3. Add reason for each variance
4. Manager confirms adjustment
5. Stock levels updated automatically

**Audit Trail:**
- Who created the adjustment
- Who approved it
- Before and after quantities
- Reason for each change

### 6. Automated Alerts

**Alert Types:**

**Low Stock:**
- Triggered when `quantity_available <= reorder_point`
- Alert level: Warning
- Action: Create purchase order

**Out of Stock:**
- Triggered when `quantity_available = 0`
- Alert level: Critical
- Action: Urgent reorder or notify sales

**Expiry Warning:**
- Triggered when lot approaching expiry date
- Alert level: Warning
- Action: Discount or remove from stock

**Overstock:**
- Triggered when stock significantly above normal
- Alert level: Info
- Action: Reduce orders or run promotion

**Alert Management:**
- View unresolved alerts
- Filter by type and level
- Mark as resolved when action taken

### 7. Analytics & Reporting

**Inventory Summary:**
- Total products, quantity, value
- Stock status breakdown
- By warehouse, by category

**Reorder Suggestions:**
- Products below reorder point
- Suggested order quantity
- Preferred supplier info
- Lead time consideration

**Top Value Products:**
- Products with highest inventory value
- Focus on protecting high-value items
- ABC analysis support

**Stock by Category:**
- Inventory value by category
- Product count by category
- Identify trends

**Inventory Valuation:**
- Historical snapshots
- Track value over time
- Financial reporting support

---

## User Workflows

### Workflow 1: Adding a New Product

**Actor:** Inventory Manager / User

**Steps:**
1. Navigate to `/erp/inventory/products`
2. Click "Add Product" button
3. Fill in product details:
   - Name: "MacBook Pro 16-inch"
   - SKU: "MBP-16-2024"
   - Category: Electronics
   - Product Type: Storable
   - Tracking: Serial
   - Cost: $2,400
   - Sale Price: $3,199
   - Reorder Point: 5
   - Reorder Qty: 20
   - Lead Time: 7 days
4. Click "Create Product"
5. Product appears in list

**Result:** Product ready to receive stock

### Workflow 2: Receiving Stock from Supplier

**Actor:** Warehouse Staff

**Steps:**
1. Navigate to `/erp/inventory/movements`
2. Click "New Movement"
3. Select movement type: "Receipt"
4. Select destination warehouse
5. Add products and quantities:
   - MacBook Pro 16-inch: 25 units
   - Unit cost: $2,400
6. Add note: "PO #1234 - Apple supplier"
7. Save as Draft
8. When goods arrive:
   - Open movement
   - Scan or count items
   - Change status to "Completed"
9. Stock levels automatically updated

**Result:** 25 MacBooks added to warehouse stock

### Workflow 3: Internal Stock Transfer

**Actor:** Warehouse Manager

**Scenario:** Need to move 10 MacBooks from Main Warehouse to Retail Store

**Steps:**
1. Go to `/erp/inventory/movements`
2. Create new movement: "Internal Transfer"
3. Source: Main Warehouse
4. Destination: Retail Store
5. Add product: MacBook Pro 16-inch, Qty: 10
6. Schedule date: Tomorrow 10 AM
7. Confirm movement
8. Warehouse staff picks items
9. Mark as completed when delivered

**Result:**
- Main Warehouse: -10 MacBooks
- Retail Store: +10 MacBooks

### Workflow 4: Cycle Count (Stock Adjustment)

**Actor:** Inventory Manager

**Scenario:** Monthly inventory count reveals discrepancy

**Steps:**
1. Navigate to `/erp/inventory/adjustments`
2. Click "New Adjustment"
3. Select warehouse
4. Adjustment type: "Cycle Count"
5. Add products with counts:
   - MacBook Pro: System shows 15, counted 14
   - iPhone 15: System shows 50, counted 52
6. Add reasons:
   - MacBook: "1 unit found damaged"
   - iPhone: "2 units found in return area"
7. Save adjustment
8. Manager reviews and confirms
9. Stock levels updated

**Result:**
- MacBook: Reduced by 1
- iPhone: Increased by 2
- Full audit trail recorded

### Workflow 5: Handling Low Stock Alert

**Actor:** Purchasing Manager

**Scenario:** Alert notification for low stock

**Steps:**
1. Receive alert: "MacBook Pro stock below reorder point"
2. Navigate to `/erp/inventory`
3. View reorder suggestions
4. See suggestion:
   - Current stock: 4
   - Reorder point: 5
   - Suggested order: 20 units
   - Preferred supplier: Apple Direct
5. Click "Create Purchase Order" (future feature)
6. Mark alert as resolved

**Result:** Purchase order created to restock

---

## Setup Instructions

### Step 1: Run Database Scripts

1. **Run main ERP database script:**
   ```bash
   # In PG Admin, execute:
   app/db/erpDb.sql
   ```

2. **Run inventory enhancements:**
   ```bash
   # In PG Admin, execute:
   scripts/inventory-module-enhancements.sql
   ```

3. **Verify tables created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%product%' OR table_name LIKE '%stock%';
   ```

### Step 2: Configure Environment

Ensure your `.env.local` has:
```env
# Main Database
DATABASE_URL=postgresql://user:password@localhost:5432/maindb

# ERP Database
ERP_DATABASE_URL=postgresql://user:password@localhost:5432/erpdb
```

### Step 3: Create Initial Data

1. **Create an ERP Organization:**
   (Link your main organization to ERP)

2. **Create a Warehouse:**
   ```sql
   INSERT INTO warehouses (erp_organization_id, name, code, city, country)
   VALUES ('your-org-id', 'Main Warehouse', 'WH-001', 'New York', 'USA');
   ```

3. **Create Product Categories:**
   ```sql
   INSERT INTO product_categories (erp_organization_id, name, code)
   VALUES 
     ('your-org-id', 'Electronics', 'ELEC'),
     ('your-org-id', 'Clothing', 'CLOTH'),
     ('your-org-id', 'Food & Beverage', 'FOOD');
   ```

4. **Create Units of Measure:**
   ```sql
   INSERT INTO units_of_measure (erp_organization_id, name, code, uom_type)
   VALUES 
     ('your-org-id', 'Unit', 'UNT', 'unit'),
     ('your-org-id', 'Kilogram', 'KG', 'weight'),
     ('your-org-id', 'Liter', 'L', 'volume');
   ```

### Step 4: Access the Module

1. Login to your ERP system
2. Navigate to `/erp/inventory`
3. Explore the dashboard
4. Start adding products

---

## Advanced Features

### 1. Barcode Scanning

**Setup:**
- Use mobile device or USB scanner
- Scan during receipt, picking, counting
- Logs all scans for audit

**Benefits:**
- Faster data entry
- Reduce errors
- Track who scanned what

### 2. Serial Number Tracking

**Use Cases:**
- Electronics (laptops, phones)
- Appliances (warranty tracking)
- High-value items

**Features:**
- Each unit has unique serial number
- Track which customer bought which unit
- Warranty and support tracking

### 3. Lot/Batch Tracking

**Use Cases:**
- Food products (expiry dates)
- Pharmaceuticals (batch recalls)
- Cosmetics (shelf life)

**Features:**
- Group items by manufacture date
- Set expiry dates
- Alert before expiry
- Recall specific lots if needed

### 4. Multi-Currency Support

**Features:**
- Store costs in different currencies
- Automatic conversion
- Exchange rate tracking

**Use Case:** Import products from multiple countries

### 5. Product Variants

**Examples:**
- T-Shirt: Size S, M, L, XL × Color Red, Blue, Green
- Phone: Storage 128GB, 256GB, 512GB × Color Black, White

**Features:**
- One base product, multiple variants
- Each variant has own SKU
- Track stock per variant
- Simplify product management

### 6. Product Kits/Bundles

**Example:**
- "Computer Bundle" = 1 Desktop + 1 Monitor + 1 Keyboard + 1 Mouse

**Features:**
- Define kit components
- Sell as one item
- Automatically deduct component stock
- Special kit pricing

### 7. Inventory Valuation Methods

**FIFO (First In, First Out):**
- Oldest stock sold first
- Good for perishables

**LIFO (Last In, First Out):**
- Newest stock sold first
- Tax benefits in some regions

**Weighted Average:**
- Average cost of all units
- Simple and fair

**Standard Cost:**
- Fixed cost regardless of actual
- Manufacturing environments

### 8. Stock Reservations

**Automatic Reservation:**
- When sales order confirmed
- Stock reserved for that order
- Can't be sold to someone else
- Released if order cancelled

**Manual Reservation:**
- Reserve for VIP customers
- Special events
- Promotional campaigns

### 9. Demand Forecasting (AI)

**Current:**
- Basic reorder suggestions

**Future AI Features:**
- Predict demand based on:
  - Historical sales data
  - Seasonality patterns
  - Market trends
  - External factors (weather, events)
- Optimize reorder points automatically
- Reduce stockouts and overstock

### 10. Integration with Other Modules

**Purchasing:**
- Auto-create PO when low stock
- Receive stock from PO

**Sales:**
- Check stock before confirming order
- Reserve stock for customer
- Auto-deduct on delivery

**Manufacturing:**
- Consume raw materials
- Produce finished goods
- Track work-in-progress

**Accounting:**
- Inventory valuation
- COGS calculation
- Asset tracking

---

## Best Practices

### 1. Product Setup
✅ Use clear, consistent SKU naming  
✅ Add detailed descriptions  
✅ Set realistic reorder points  
✅ Upload product images  
✅ Categorize products properly  

### 2. Warehouse Management
✅ Use location codes that make sense  
✅ Organize by product type or velocity  
✅ Keep fast-moving items near shipping  
✅ Regular cycle counts  

### 3. Stock Accuracy
✅ Count stock regularly  
✅ Use barcode scanners  
✅ Investigate variances immediately  
✅ Train staff on procedures  

### 4. Alerts & Notifications
✅ Review alerts daily  
✅ Act on critical alerts immediately  
✅ Adjust reorder points based on trends  
✅ Don't ignore warning signs  

### 5. Reporting
✅ Review inventory value monthly  
✅ Identify slow-moving items  
✅ Monitor stockout frequency  
✅ Track inventory turnover  

---

## Troubleshooting

### Issue: Stock levels not updating after movement

**Solution:**
- Check movement status is "Completed"
- Verify triggers are enabled
- Check database logs for errors

### Issue: Alerts not generating

**Solution:**
- Verify trigger `trg_check_stock_levels` exists
- Check product has `reorder_point` set
- Ensure product is active

### Issue: Cannot delete product

**Solution:**
- Product may have stock levels (foreign key constraint)
- Adjust stock to zero first
- Or mark as inactive instead of deleting

### Issue: Discrepancy in stock count

**Solution:**
- Create stock adjustment
- Document reason for variance
- Get manager approval
- Confirm to update stock

---

## Support & Resources

**Documentation:**
- Main README: `README.md`
- Setup Guide: `SETUP_GUIDE.md`
- Business Overview: `ERP_BUSINESS_HANDOUT.md`

**API Testing:**
Use Postman or similar to test endpoints:
```bash
GET http://localhost:3000/api/erp/inventory/products
Authorization: Bearer YOUR_TOKEN
```

**Database Access:**
PG Admin or psql command line

**Logs:**
Check console for API errors and debugging info

---

## Future Enhancements

### Phase 1 (Next 3 months)
- [ ] Barcode generation
- [ ] Print labels
- [ ] Import products from CSV/Excel
- [ ] Advanced search and filters
- [ ] Bulk operations

### Phase 2 (Next 6 months)
- [ ] Mobile app for warehouse staff
- [ ] AI-powered demand forecasting
- [ ] Automated reorder PO creation
- [ ] Integration with accounting
- [ ] Multi-currency full support

### Phase 3 (Next 12 months)
- [ ] IoT sensor integration
- [ ] RFID tracking
- [ ] Drone inventory counts
- [ ] Blockchain traceability
- [ ] Advanced analytics dashboard

---

## Conclusion

The Inventory Management module is fully functional and ready for production use. It provides:

✅ Complete product catalog management  
✅ Multi-warehouse stock tracking  
✅ Automated stock movements  
✅ Adjustment capabilities with audit  
✅ Real-time alerts  
✅ Comprehensive analytics  

**You can now:**
1. Run the SQL scripts to set up the database
2. Access the UI at `/erp/inventory`
3. Start adding products and warehouses
4. Begin tracking your inventory

For questions or issues, refer to the troubleshooting section or check the main documentation.

---

**Module Version:** 1.0  
**Last Updated:** December 7, 2025  
**Status:** Production Ready ✅
