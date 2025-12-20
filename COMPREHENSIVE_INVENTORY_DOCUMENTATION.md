# 📦 COMPREHENSIVE INVENTORY MANAGEMENT SYSTEM DOCUMENTATION

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [UI Pages](#ui-pages)
6. [Installation & Setup](#installation--setup)
7. [Usage Guide](#usage-guide)
8. [Business Workflows](#business-workflows)

---

## System Overview

This is a complete Enterprise Resource Planning (ERP) Inventory Management System that provides real-time stock tracking, automated procurement, demand forecasting, quality control, cost management, and advanced analytics.

### Key Capabilities
- ✅ **Real-time Stock Tracking** across multiple warehouses and locations
- ✅ **Automated Procurement** with reorder rules and PO suggestions
- ✅ **Demand Forecasting** using historical sales data
- ✅ **Quality Control** with inspection workflows
- ✅ **Cost Management** (FIFO/LIFO/Weighted Average)
- ✅ **Advanced Analytics** (ABC Analysis, Stock Aging, Turnover)
- ✅ **Serial/Lot Tracking** for traceability
- ✅ **Expiry Management** with automated alerts
- ✅ **Product Recall Management**

---

## Core Features

### 1. Stock Tracking & Visibility

**Purpose**: Maintain real-time visibility of all stock levels across multiple locations.

**How it Works**:
- Tracks `quantity_on_hand` and `quantity_reserved` per product per warehouse
- Supports warehouse locations (zones, aisles, racks, shelves, bins)
- Real-time updates on every stock movement
- Multi-warehouse support with location hierarchy

**Tables**:
- `stock_levels` - Current stock quantities
- `warehouses` - Warehouse master data
- `warehouse_locations` - Storage location hierarchy
- `products` - Product master data

**APIs**:
- `GET /api/erp/inventory/stock-levels` - Fetch all stock levels
- `GET /api/erp/inventory/warehouses` - Fetch all warehouses
- `GET /api/erp/inventory/products` - Fetch all products

**UI Pages**:
- `/erp/inventory/stock-levels` - View current stock across all warehouses
- `/erp/inventory/warehouses` - Manage warehouses and locations
- `/erp/inventory/products` - Manage product catalog

---

### 2. Procurement Integration & Automation

**Purpose**: Automatically trigger purchase orders when stock falls below reorder points.

**How it Works**:
1. **Reorder Rules** define minimum stock levels and reorder quantities per product
2. **Automated Function** `generate_purchase_order_suggestions()` runs daily
3. Checks current stock against reorder points
4. Calculates average daily consumption from sales history
5. Estimates days until stockout
6. Generates Purchase Order Suggestions with priority levels

**Tables**:
- `reorder_rules` - Min/max stock levels and reorder quantities
- `purchase_order_suggestions` - Auto-generated PO suggestions
- `sales_history` - Aggregated sales data for consumption calculation

**APIs**:
- `GET/POST/PUT/DELETE /api/erp/inventory/procurement/reorder-rules` - Manage reorder rules
- `GET/POST/PUT /api/erp/inventory/procurement/po-suggestions` - View and manage PO suggestions

**UI Pages**:
- `/erp/inventory/procurement` - View PO suggestions and reorder rules

**Business Workflow**:
```
1. Configure reorder rules for products
2. System monitors stock levels daily
3. When stock ≤ reorder point → Generate suggestion
4. Review suggestions → Approve/Reject
5. Approved suggestions → Create Purchase Order (in purchasing module)
```

---

### 3. Sales & Demand Management

**Purpose**: Prevent overselling and optimize stock levels based on demand patterns.

**How it Works**:
- `quantity_reserved` is updated when sales orders are created
- Available quantity = `quantity_on_hand - quantity_reserved`
- Demand forecasts predict future sales using historical data
- Multiple forecasting methods: Moving Average, Exponential Smoothing, Linear Regression

**Tables**:
- `demand_forecasts` - Predicted demand for future periods
- `sales_history` - Historical sales aggregated by period

**APIs**:
- `GET/POST/PUT /api/erp/inventory/forecasting/demand-forecasts` - Manage forecasts

**Forecast Methods**:
- **Moving Average**: Average of last N periods
- **Exponential Smoothing**: Weighted average giving more importance to recent data
- **Linear Regression**: Trend-based prediction
- **Seasonal**: Accounts for seasonal patterns

---

### 4. Warehouse Operations

**Purpose**: Support receiving, storage, picking, and internal transfers.

**How it Works**:
- **Stock Movements** record all inventory transactions
- Movement types: `receipt`, `delivery`, `internal_transfer`, `adjustment`, `return`, `scrap`
- Each movement has lines (items moved)
- Status workflow: `draft → confirmed → processing → completed`

**Tables**:
- `stock_movements` - Movement headers
- `stock_movement_lines` - Items in each movement
- `stock_adjustments` - Physical count adjustments
- `stock_adjustment_lines` - Adjustment details

**APIs**:
- `GET/POST /api/erp/inventory/movements` - Manage stock movements
- `GET/POST /api/erp/inventory/adjustments` - Manage stock adjustments

**UI Pages**:
- `/erp/inventory/movements` - View and create stock movements
- `/erp/inventory/adjustments` - Record physical count adjustments

---

### 5. Cost Management (FIFO/LIFO/Weighted Average)

**Purpose**: Track inventory valuation and calculate accurate Cost of Goods Sold (COGS).

**How it Works**:

#### FIFO (First-In, First-Out)
- Consumes oldest inventory first
- Each receipt creates a "valuation layer" with quantity and cost
- When selling, consumes from oldest layers first

#### LIFO (Last-In, First-Out)
- Consumes newest inventory first
- Useful for inflation scenarios

#### Weighted Average
- Calculates average cost across all layers
- `Weighted Avg Cost = Total Value / Total Quantity`

**Tables**:
- `inventory_valuation_layers` - Cost layers for each receipt
- `cogs_transactions` - COGS recorded for each sale/consumption

**APIs**:
- `GET /api/erp/inventory/costing/valuation` - View valuation layers
- `POST /api/erp/inventory/costing/valuation` - Add new receipt layer
- `PUT /api/erp/inventory/costing/valuation` - Consume inventory (FIFO/LIFO)

**Example FIFO Consumption**:
```
Layers:
1. 100 units @ $10 (oldest)
2. 200 units @ $12
3. 150 units @ $15 (newest)

Sell 250 units:
- Consume 100 units @ $10 = $1,000
- Consume 150 units @ $12 = $1,800
- COGS = $2,800
- Average Unit Cost = $11.20
```

---

### 6. Forecasting & Planning

**Purpose**: Predict future demand to optimize inventory levels and prevent stockouts.

**How it Works**:
1. **Data Collection**: Sales history aggregated by period (daily/weekly/monthly)
2. **Forecast Generation**: Apply statistical methods to predict future demand
3. **Accuracy Tracking**: Compare forecasted vs actual quantities
4. **Confidence Levels**: Indicate prediction reliability (0-100%)

**Tables**:
- `demand_forecasts` - Future demand predictions
- `sales_history` - Historical sales data

**APIs**:
- `GET/POST/PUT /api/erp/inventory/forecasting/demand-forecasts`

**Forecasting Workflow**:
```
1. Collect 12 months of sales history
2. Choose forecasting method
3. Generate forecasts for next 3-6 months
4. Monitor forecast accuracy
5. Adjust inventory policies based on forecasts
```

---

### 7. Quality Control

**Purpose**: Ensure product quality through systematic inspections.

**How it Works**:
- **Inspection Types**: `incoming`, `in_process`, `outgoing`, `periodic`
- **Quality Criteria**: Defined per product or category
- **Inspection Process**: Record measurements against criteria
- **Pass/Fail Logic**: Automatic status based on acceptable ranges
- **Corrective Actions**: Document defects and resolutions

**Tables**:
- `quality_inspections` - Inspection records
- `quality_control_criteria` - Quality standards
- `quality_inspection_results` - Detailed measurements

**APIs**:
- `GET/POST/PUT /api/erp/inventory/quality/inspections` - Manage inspections

**Inspection Workflow**:
```
1. Receive goods → Create incoming inspection
2. Inspector tests against QC criteria
3. Record measurements and results
4. System determines pass/fail status
5. Accept good units, reject defective units
6. Document corrective actions
```

---

### 8. Reporting & Analytics

**Purpose**: Provide insights into inventory performance and optimize operations.

**Available Reports**:

#### Overview Report
- Total products, warehouses, quantity, value
- Low stock products count

#### Turnover Analysis
- `Turnover Ratio = COGS / Average Inventory`
- `Days in Inventory = 365 / Turnover Ratio`
- Identifies fast vs slow-moving products

#### ABC Classification
- **A Items**: 20% of products generating 80% of revenue (high value)
- **B Items**: 30% of products generating 15% of revenue (medium value)
- **C Items**: 50% of products generating 5% of revenue (low value)

#### Stock Aging
- Quantity breakdown by age: 0-30, 31-60, 61-90, 91-180, 180+ days
- Identifies obsolete or slow-moving stock

#### Valuation Report
- Current inventory value using FIFO/LIFO/Weighted Average
- Total quantity and value per product per warehouse

#### COGS Analysis
- Cost of goods sold by product, transaction type, period
- Profitability analysis

#### Expiry Alerts
- Products nearing expiry
- Alert levels: info (90+ days), warning (30-90 days), critical (<30 days)

#### Quality Report
- Inspection pass/fail rates
- Rejection rate analysis
- Quality trends

**APIs**:
- `GET /api/erp/inventory/analytics/advanced?type={reportType}`
- `POST /api/erp/inventory/analytics/advanced` (Run batch calculations)

**UI Pages**:
- `/erp/inventory/analytics/advanced` - Advanced analytics dashboard

---

## Database Schema

### Core Tables

#### products
```sql
- id (UUID, PK)
- erp_organization_id (UUID, FK)
- product_category_id (UUID, FK)
- name, sku, barcode
- product_type (storable, consumable, service)
- tracking_type (none, serial, lot)
- cost_price, sale_price
- reorder_point, reorder_quantity
- lead_time_days
```

#### warehouses
```sql
- id (UUID, PK)
- erp_organization_id (UUID, FK)
- name, code, address, city, state, country
- manager_user_id (UUID)
- is_active
```

#### stock_levels
```sql
- id (UUID, PK)
- product_id (UUID, FK)
- warehouse_id (UUID, FK)
- location_id (UUID, FK)
- quantity_on_hand
- quantity_reserved
- last_counted_at
```

#### serial_lot_numbers
```sql
- id (UUID, PK)
- product_id, warehouse_id, location_id
- tracking_number, tracking_type
- quantity
- manufacture_date, expiry_date
- status (available, reserved, sold, damaged, expired)
```

### New Tables (Advanced Features)

#### reorder_rules
```sql
- product_id, warehouse_id
- reorder_point, reorder_quantity, max_quantity
- lead_time_days, priority
- is_active
```

#### purchase_order_suggestions
```sql
- product_id, warehouse_id, supplier_id
- suggested_quantity, current_stock
- average_daily_consumption
- days_of_stock_remaining
- estimated_stockout_date
- priority, status (pending, approved, rejected, ordered)
```

#### demand_forecasts
```sql
- product_id, warehouse_id
- forecast_date, forecast_period
- forecasted_quantity, actual_quantity
- forecast_method, confidence_level
```

#### inventory_valuation_layers
```sql
- product_id, warehouse_id
- receipt_date, receipt_reference
- quantity_received, quantity_remaining
- unit_cost, total_cost
- valuation_method (FIFO, LIFO, WEIGHTED_AVG)
- is_consumed
```

#### cogs_transactions
```sql
- product_id, warehouse_id
- transaction_type, transaction_date
- quantity, unit_cost, total_cost
- valuation_method
```

#### quality_inspections
```sql
- inspection_type, reference_id
- product_id, warehouse_id, lot_serial_id
- quantity_inspected, quantity_accepted, quantity_rejected
- inspection_status, defect_details, corrective_action
```

#### stock_aging_snapshots
```sql
- product_id, warehouse_id, snapshot_date
- quantity_0_30_days, quantity_31_60_days, etc.
- value_0_30_days, value_31_60_days, etc.
```

#### expiry_alerts
```sql
- product_id, serial_lot_id, warehouse_id
- expiry_date, quantity
- days_to_expiry, alert_level
- is_resolved, resolution_action
```

---

## API Endpoints

### Procurement
```
GET    /api/erp/inventory/procurement/reorder-rules
POST   /api/erp/inventory/procurement/reorder-rules
PUT    /api/erp/inventory/procurement/reorder-rules
DELETE /api/erp/inventory/procurement/reorder-rules

GET    /api/erp/inventory/procurement/po-suggestions?status=pending
POST   /api/erp/inventory/procurement/po-suggestions (Generate)
PUT    /api/erp/inventory/procurement/po-suggestions (Update status)
```

### Forecasting
```
GET    /api/erp/inventory/forecasting/demand-forecasts?productId=xxx&period=monthly
POST   /api/erp/inventory/forecasting/demand-forecasts
PUT    /api/erp/inventory/forecasting/demand-forecasts (Update actual)
```

### Quality Control
```
GET    /api/erp/inventory/quality/inspections?status=pending&type=incoming
POST   /api/erp/inventory/quality/inspections
PUT    /api/erp/inventory/quality/inspections (Update results)
```

### Cost Management
```
GET    /api/erp/inventory/costing/valuation?productId=xxx&warehouseId=yyy
POST   /api/erp/inventory/costing/valuation (Add receipt layer)
PUT    /api/erp/inventory/costing/valuation (Consume inventory)
```

### Analytics
```
GET    /api/erp/inventory/analytics/advanced?type=overview
GET    /api/erp/inventory/analytics/advanced?type=turnover
GET    /api/erp/inventory/analytics/advanced?type=abc_analysis
GET    /api/erp/inventory/analytics/advanced?type=stock_aging
GET    /api/erp/inventory/analytics/advanced?type=valuation
GET    /api/erp/inventory/analytics/advanced?type=cogs
GET    /api/erp/inventory/analytics/advanced?type=expiry
GET    /api/erp/inventory/analytics/advanced?type=quality

POST   /api/erp/inventory/analytics/advanced (Batch operations)
```

---

## UI Pages

### Existing Pages
- `/erp/inventory` - Dashboard with stats and navigation
- `/erp/inventory/products` - Product catalog management
- `/erp/inventory/stock-levels` - Current stock levels
- `/erp/inventory/warehouses` - Warehouse management
- `/erp/inventory/categories` - Product categories
- `/erp/inventory/movements` - Stock movements
- `/erp/inventory/adjustments` - Stock adjustments
- `/erp/inventory/alerts` - Low stock alerts
- `/erp/inventory/analytics` - Basic analytics

### New Pages
- `/erp/inventory/procurement` - Reorder rules and PO suggestions
- `/erp/inventory/analytics/advanced` - Advanced analytics and reporting

---

## Installation & Setup

### 1. Run Database Migration

Open **pgAdmin** and execute the SQL script:

```bash
scripts/comprehensive-inventory-enhancements.sql
```

This will create all new tables, functions, and triggers.

### 2. Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'reorder_rules',
  'purchase_order_suggestions',
  'demand_forecasts',
  'sales_history',
  'inventory_valuation_layers',
  'cogs_transactions',
  'quality_inspections',
  'quality_control_criteria',
  'quality_inspection_results',
  'inventory_turnover_metrics',
  'stock_aging_snapshots',
  'expiry_alerts',
  'product_recalls'
);
```

Should return 13 tables.

### 3. Test Automated Functions

```sql
-- Test purchase order suggestions generation
SELECT generate_purchase_order_suggestions();

-- Test ABC classification calculation
SELECT calculate_abc_classification('your-org-id-here');

-- Test expiry alerts update
SELECT update_expiry_alerts();
```

### 4. Setup Scheduled Jobs (Optional)

For automated daily/weekly operations, use **pg_cron** or external scheduler:

```sql
-- Install pg_cron extension
CREATE EXTENSION pg_cron;

-- Schedule daily PO suggestions
SELECT cron.schedule('generate-po-suggestions', '0 8 * * *', 
  $$SELECT generate_purchase_order_suggestions()$$);

-- Schedule weekly ABC classification
SELECT cron.schedule('calculate-abc', '0 2 * * 0', 
  $$SELECT calculate_abc_classification(org_id)$$);

-- Schedule daily expiry alerts
SELECT cron.schedule('update-expiry', '0 6 * * *', 
  $$SELECT update_expiry_alerts()$$);
```

---

## Usage Guide

### Setup Procurement Automation

1. **Create Reorder Rules**:
   ```
   - Navigate to /erp/inventory/procurement
   - Click "Reorder Rules" tab
   - Set reorder point and quantity for each product
   - Define lead time days
   - Set priority (low, normal, high, critical)
   ```

2. **Generate PO Suggestions**:
   ```
   - Click "Generate Suggestions" button
   - System analyzes current stock vs reorder points
   - Calculates consumption rates and stockout dates
   - Creates suggestions with priorities
   ```

3. **Review and Approve**:
   ```
   - View suggestions in priority order
   - Review quantities and stockout dates
   - Approve → Creates purchase order
   - Reject → Dismisses suggestion
   ```

### Use Cost Management (FIFO/LIFO)

1. **Record Inventory Receipt**:
   ```javascript
   POST /api/erp/inventory/costing/valuation
   {
     "productId": "xxx",
     "warehouseId": "yyy",
     "quantityReceived": 100,
     "unitCost": 10.50,
     "receiptReference": "GRN-001",
     "valuationMethod": "FIFO"
   }
   ```

2. **Consume Inventory (on Sale)**:
   ```javascript
   PUT /api/erp/inventory/costing/valuation
   {
     "productId": "xxx",
     "warehouseId": "yyy",
     "quantityToConsume": 50,
     "valuationMethod": "FIFO",
     "transactionType": "sale",
     "referenceId": "SO-001"
   }
   ```

3. **View Valuation**:
   ```
   GET /api/erp/inventory/costing/valuation?productId=xxx
   Returns: layers, total value, weighted average cost
   ```

### Create Quality Inspection

1. **Setup QC Criteria** (one-time):
   ```sql
   INSERT INTO quality_control_criteria (
     erp_organization_id,
     product_id,
     criterion_name,
     criterion_type,
     specification,
     acceptable_range_min,
     acceptable_range_max
   ) VALUES (
     'org-id',
     'product-id',
     'Weight',
     'measurement',
     'Product weight must be between 95-105g',
     95.0,
     105.0
   );
   ```

2. **Create Inspection**:
   ```javascript
   POST /api/erp/inventory/quality/inspections
   {
     "inspectionType": "incoming",
     "productId": "xxx",
     "warehouseId": "yyy",
     "quantityInspected": 100,
     "inspectionStatus": "pending"
   }
   ```

3. **Record Results**:
   ```javascript
   PUT /api/erp/inventory/quality/inspections
   {
     "id": "inspection-id",
     "quantityAccepted": 95,
     "quantityRejected": 5,
     "inspectionStatus": "partial",
     "defectDetails": "5 units below weight spec"
   }
   ```

### Generate Advanced Reports

```javascript
// Overview
GET /api/erp/inventory/analytics/advanced?type=overview

// ABC Classification
GET /api/erp/inventory/analytics/advanced?type=abc_analysis

// Stock Aging
GET /api/erp/inventory/analytics/advanced?type=stock_aging

// Valuation
GET /api/erp/inventory/analytics/advanced?type=valuation

// COGS Analysis
GET /api/erp/inventory/analytics/advanced?type=cogs
```

---

## Business Workflows

### Complete Purchase-to-Stock Workflow

```
1. Reorder Rule Triggers
   ↓
2. PO Suggestion Generated
   ↓
3. Approve Suggestion
   ↓
4. Create Purchase Order (Purchasing Module)
   ↓
5. Receive Goods + Quality Inspection
   ↓
6. Accept Good Units → Update Stock
   ↓
7. Create Valuation Layer (FIFO/LIFO)
   ↓
8. Stock Available for Sale
```

### Complete Sale-to-COGS Workflow

```
1. Sales Order Created
   ↓
2. Reserve Stock (quantity_reserved++)
   ↓
3. Pick Items from Warehouse
   ↓
4. Outgoing Quality Inspection (optional)
   ↓
5. Ship Goods
   ↓
6. Consume Inventory (FIFO/LIFO)
   ↓
7. Calculate COGS
   ↓
8. Update Financial Records
```

### Stock Adjustment Workflow

```
1. Physical Count Performed
   ↓
2. Create Stock Adjustment
   ↓
3. Record Counted vs System Quantities
   ↓
4. Approve Adjustment
   ↓
5. Update Stock Levels
   ↓
6. Generate Adjustment Report
```

---

## Summary

This comprehensive inventory management system provides:

✅ **Complete Stock Visibility** - Real-time tracking across all locations  
✅ **Automated Procurement** - No more stockouts with intelligent reordering  
✅ **Accurate Costing** - FIFO/LIFO/Weighted Average valuation  
✅ **Quality Assurance** - Systematic inspection workflows  
✅ **Demand Forecasting** - Data-driven planning  
✅ **Advanced Analytics** - ABC analysis, turnover, aging reports  
✅ **Traceability** - Serial/lot tracking and recall management  
✅ **Expiry Management** - Automated alerts for perishable goods  

All features are production-ready with complete API endpoints and UI pages. The system is designed to scale with your business and provide actionable insights for inventory optimization.

---

**Documentation Version**: 1.0  
**Last Updated**: December 20, 2025  
**Contact**: Support Team
