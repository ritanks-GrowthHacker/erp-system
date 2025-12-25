-- ERP Database Schema
-- This database works standalone but references users from the main database for authentication
-- Connection: Users authenticate via mainDb, then access ERP modules based on their organization/department

-- ============================================
-- CORE ERP TABLES
-- ============================================

-- Organizations table (references main db organizations)
CREATE TABLE erp_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_org_id UUID NOT NULL UNIQUE, -- References organizations(id) from mainDb
  erp_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  fiscal_year_start INTEGER DEFAULT 1, -- Month (1-12)
  currency_code VARCHAR(3) DEFAULT 'INR',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments (references main db departments)
CREATE TABLE erp_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_department_id UUID NOT NULL UNIQUE, -- References departments(id) from mainDb
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  can_manage_inventory BOOLEAN DEFAULT false,
  can_manage_purchases BOOLEAN DEFAULT false,
  can_manage_sales BOOLEAN DEFAULT false,
  can_manage_manufacturing BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User ERP Access (references users from mainDb)
CREATE TABLE erp_user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_user_id UUID NOT NULL, -- References users(id) from mainDb
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  erp_department_id UUID REFERENCES erp_departments(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}', -- Granular permissions
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(main_user_id, erp_organization_id)
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Warehouses
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_user_id UUID, -- References users(id) from mainDb
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, code)
);

-- Warehouse Locations/Bins
CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  location_type VARCHAR(50) CHECK (location_type IN ('zone', 'aisle', 'rack', 'shelf', 'bin')),
  parent_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  capacity DECIMAL(15,2),
  current_utilization DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(warehouse_id, code)
);

-- Product Categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  parent_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, code)
);

-- Units of Measure
CREATE TABLE units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  uom_type VARCHAR(50) CHECK (uom_type IN ('unit', 'weight', 'volume', 'length', 'area', 'time')),
  is_base_unit BOOLEAN DEFAULT false,
  conversion_factor DECIMAL(15,6) DEFAULT 1.0, -- Relative to base unit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, code)
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  product_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  description TEXT,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('storable', 'consumable', 'service')),
  tracking_type VARCHAR(50) DEFAULT 'none' CHECK (tracking_type IN ('none', 'serial', 'lot')),
  uom_id UUID REFERENCES units_of_measure(id),
  purchase_uom_id UUID REFERENCES units_of_measure(id),
  sale_uom_id UUID REFERENCES units_of_measure(id),
  cost_price DECIMAL(15,2) DEFAULT 0,
  sale_price DECIMAL(15,2) DEFAULT 0,
  weight DECIMAL(15,3),
  volume DECIMAL(15,3),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  reorder_point DECIMAL(15,2) DEFAULT 0,
  reorder_quantity DECIMAL(15,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID, -- References users(id) from mainDb
  updated_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, sku)
);

-- Product Variants (for products with variations like size, color)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  attributes JSONB DEFAULT '{}', -- e.g., {"size": "L", "color": "Red"}
  cost_price DECIMAL(15,2),
  sale_price DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, sku)
);

-- Stock Levels
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  quantity_on_hand DECIMAL(15,2) DEFAULT 0,
  quantity_reserved DECIMAL(15,2) DEFAULT 0,
  quantity_available DECIMAL(15,2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  last_counted_by UUID, -- References users(id) from mainDb
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id, location_id, product_variant_id)
);

-- Serial Numbers & Lot Tracking
CREATE TABLE serial_lot_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  tracking_number VARCHAR(255) NOT NULL,
  tracking_type VARCHAR(50) CHECK (tracking_type IN ('serial', 'lot')),
  quantity DECIMAL(15,2) DEFAULT 1, -- Always 1 for serial numbers
  manufacture_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, tracking_number)
);

-- ============================================
-- INVENTORY MOVEMENTS
-- ============================================

-- Stock Movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('receipt', 'delivery', 'internal_transfer', 'adjustment', 'return', 'scrap')),
  reference_type VARCHAR(50), -- e.g., 'purchase_order', 'sale_order', 'stock_adjustment'
  reference_id UUID, -- ID of the related document
  source_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  source_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  destination_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  destination_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'processing', 'completed', 'cancelled')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID NOT NULL, -- References users(id) from mainDb
  updated_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Movement Lines
CREATE TABLE stock_movement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_movement_id UUID NOT NULL REFERENCES stock_movements(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  serial_lot_id UUID REFERENCES serial_lot_numbers(id) ON DELETE SET NULL,
  quantity_ordered DECIMAL(15,2) NOT NULL,
  quantity_processed DECIMAL(15,2) DEFAULT 0,
  uom_id UUID REFERENCES units_of_measure(id),
  unit_cost DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Adjustments
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('cycle_count', 'write_off', 'damage', 'found', 'correction')),
  reference_number VARCHAR(100),
  adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL, -- References users(id) from mainDb
  approved_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Adjustment Lines
CREATE TABLE stock_adjustment_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_adjustment_id UUID NOT NULL REFERENCES stock_adjustments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  warehouse_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  counted_quantity DECIMAL(15,2) NOT NULL,
  system_quantity DECIMAL(15,2) NOT NULL,
  difference_quantity DECIMAL(15,2) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUPPLIERS & PURCHASING
-- ============================================

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  tax_id VARCHAR(100),
  payment_terms INTEGER DEFAULT 30, -- Days
  currency_code VARCHAR(3) DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, code)
);

-- Supplier Contacts
CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  po_number VARCHAR(100) NOT NULL,
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  currency_code VARCHAR(3) DEFAULT 'INR',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by UUID NOT NULL, -- References users(id) from mainDb
  approved_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, po_number)
);

-- Purchase Order Lines
CREATE TABLE purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  description TEXT,
  quantity_ordered DECIMAL(15,2) NOT NULL,
  quantity_received DECIMAL(15,2) DEFAULT 0,
  uom_id UUID REFERENCES units_of_measure(id),
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
  expected_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS & SALES
-- ============================================

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  billing_address TEXT,
  shipping_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  tax_id VARCHAR(100),
  payment_terms INTEGER DEFAULT 30,
  currency_code VARCHAR(3) DEFAULT 'INR',
  credit_limit DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, code)
);

-- Customer Contacts
CREATE TABLE customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Orders
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  so_number VARCHAR(100) NOT NULL,
  so_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'delivered', 'cancelled')),
  currency_code VARCHAR(3) DEFAULT 'INR',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  shipping_address TEXT,
  notes TEXT,
  created_by UUID NOT NULL, -- References users(id) from mainDb
  approved_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, so_number)
);

-- Sales Order Lines
CREATE TABLE sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  description TEXT,
  quantity_ordered DECIMAL(15,2) NOT NULL,
  quantity_delivered DECIMAL(15,2) DEFAULT 0,
  uom_id UUID REFERENCES units_of_measure(id),
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MANUFACTURING (Basic)
-- ============================================

-- Bill of Materials
CREATE TABLE bom_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  bom_name VARCHAR(255) NOT NULL,
  bom_version VARCHAR(50) DEFAULT '1.0',
  quantity_produced DECIMAL(15,2) DEFAULT 1,
  uom_id UUID REFERENCES units_of_measure(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill of Materials Lines
CREATE TABLE bom_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_header_id UUID NOT NULL REFERENCES bom_headers(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  component_variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity_required DECIMAL(15,2) NOT NULL,
  uom_id UUID REFERENCES units_of_measure(id),
  scrap_percentage DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manufacturing Orders
CREATE TABLE manufacturing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  bom_header_id UUID NOT NULL REFERENCES bom_headers(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  mo_number VARCHAR(100) NOT NULL,
  quantity_to_produce DECIMAL(15,2) NOT NULL,
  quantity_produced DECIMAL(15,2) DEFAULT 0,
  scheduled_start_date DATE,
  scheduled_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  created_by UUID NOT NULL, -- References users(id) from mainDb
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(erp_organization_id, mo_number)
);

-- ============================================
-- AUDIT & ACTIVITY LOGS
-- ============================================

-- ERP Activity Logs
CREATE TABLE erp_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References users(id) from mainDb
  entity_type VARCHAR(100) NOT NULL, -- e.g., 'product', 'purchase_order'
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve'
  changes JSONB, -- Old and new values
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_erp_orgs_main_org ON erp_organizations(main_org_id);
CREATE INDEX idx_erp_depts_main_dept ON erp_departments(main_department_id);
CREATE INDEX idx_erp_user_access_user ON erp_user_access(main_user_id);
-- ============================================
-- SALES HISTORY & ANALYTICS
-- ============================================

-- Sales History for Forecasting - Aggregated sales data
CREATE TABLE sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_organization_id UUID NOT NULL REFERENCES erp_organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  quantity_sold DECIMAL(15,2) NOT NULL DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
  number_of_orders INTEGER DEFAULT 0,
  average_order_quantity DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_erp_user_access_org ON erp_user_access(erp_organization_id);
CREATE INDEX idx_warehouses_org ON warehouses(erp_organization_id);
CREATE INDEX idx_products_org ON products(erp_organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON stock_levels(warehouse_id);
CREATE INDEX idx_stock_movements_org ON stock_movements(erp_organization_id);
CREATE INDEX idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_purchase_orders_org ON purchase_orders(erp_organization_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_sales_orders_org ON sales_orders(erp_organization_id);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_activity_logs_org ON erp_activity_logs(erp_organization_id);
CREATE INDEX idx_activity_logs_user ON erp_activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON erp_activity_logs(entity_type, entity_id);
CREATE INDEX idx_sales_history_product ON sales_history(product_id);
CREATE INDEX idx_sales_history_period ON sales_history(period_start, period_end);

-- Note: Default units of measure should be created when an organization is onboarded
-- Example SQL to insert default UOMs for a new organization:
/*
INSERT INTO units_of_measure (erp_organization_id, name, code, uom_type, is_base_unit) VALUES
  ('<your-org-id>', 'Unit', 'UNIT', 'unit', true),
  ('<your-org-id>', 'Kilogram', 'KG', 'weight', true),
  ('<your-org-id>', 'Gram', 'G', 'weight', false),
  ('<your-org-id>', 'Liter', 'L', 'volume', true),
  ('<your-org-id>', 'Milliliter', 'ML', 'volume', false),
  ('<your-org-id>', 'Meter', 'M', 'length', true),
  ('<your-org-id>', 'Centimeter', 'CM', 'length', false);
*/
