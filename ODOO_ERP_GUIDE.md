# 🎯 Odoo-Like ERP System - Complete Guide

## 📖 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Modules](#modules)
5. [API Reference](#api-reference)
6. [UI Components](#ui-components)
7. [Usage Guide](#usage-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Overview

This is a comprehensive Odoo-like ERP system built with:
- **Frontend**: Next.js 14+ (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication
- **Architecture**: Standalone ERP database with main app integration

### Key Features
✅ **Inventory Management** - Products, stock levels, warehouses, serial/lot tracking
✅ **Purchasing** - Purchase orders, supplier management, receiving
✅ **Sales** - Sales orders, customer management, quotations, invoicing
✅ **Manufacturing** - Bill of materials, production orders
✅ **Multi-warehouse** - Support for multiple warehouses and locations
✅ **Role-based Access** - Admin, Manager, User, Viewer roles
✅ **Organization-level Isolation** - Multi-tenant architecture
✅ **Odoo-like UI** - Sidebar navigation, cards, tables, forms

---

## 🏛️ Architecture

### Database Structure

```
┌─────────────────────┐         ┌──────────────────────┐
│   Main Database     │         │    ERP Database      │
│                     │         │                      │
│  - users            │───┐     │  - erp_organizations │
│  - organizations    │   │     │  - erp_departments   │
│  - departments      │   └────>│  - erp_user_access   │
│  - invitations      │         │  - products          │
│  - projects         │         │  - warehouses        │
│  - tickets          │         │  - stock_levels      │
└─────────────────────┘         │  - purchase_orders   │
                                │  - sales_orders      │
                                │  - suppliers         │
                                │  - customers         │
                                └──────────────────────┘
```

### Data Flow

```
User Login (Main App)
        ↓
    JWT Token
        ↓
ERP Access Check → erp_user_access
        ↓
    ERP Modules (Inventory, Purchasing, Sales)
        ↓
Organization-level Data Isolation
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Step 1: Install Dependencies

```bash
npm install
```

**Installed Packages:**
- `next` - Framework
- `react`, `react-dom` - UI library
- `drizzle-orm`, `postgres` - Database ORM
- `bcryptjs`, `jsonwebtoken` - Authentication
- `zod`, `react-hook-form` - Form validation
- `zustand`, `@tanstack/react-query` - State management

### Step 2: Environment Setup

Create `.env` file:

```env
# Main Database (authentication)
MAIN_DATABASE_URL=postgres://postgres:root@localhost:5433/inventory_management_main

# ERP Database (standalone)
ERP_DATABASE_URL=postgres://postgres:root@localhost:5433/erp_sales

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-env
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=development
```

### Step 3: Database Setup

#### Option A: Automatic Migration
```bash
npm run db:migrate
```

#### Option B: Manual Setup in pgAdmin
1. Create database `inventory_management_main`
2. Run `app/db/mainDb.sql`
3. Create database `erp_sales` (or your ERP DB name)
4. Run `app/db/erpDb.sql`

### Step 4: Start Development

```bash
npm run dev
```

Access at: http://localhost:3000/erp

---

## 📦 Modules

### 1. Inventory Management

**Features:**
- Product catalog with categories
- Product variants (size, color, etc.)
- Multi-warehouse support
- Warehouse locations (zones, aisles, racks, bins)
- Stock level tracking
- Serial number tracking
- Lot number tracking
- Stock movements (receipts, deliveries, transfers)
- Stock adjustments
- Reorder point alerts

**Pages:**
- `/erp/inventory/products` - Product catalog
- `/erp/inventory/stock` - Stock levels
- `/erp/inventory/warehouses` - Warehouse management
- `/erp/inventory/movements` - Stock movements
- `/erp/inventory/adjustments` - Stock adjustments

### 2. Purchasing

**Features:**
- Purchase order creation
- Supplier management
- Multi-currency support
- PO approval workflow
- Receiving goods
- Payment terms tracking

**Pages:**
- `/erp/purchasing/orders` - Purchase orders
- `/erp/purchasing/suppliers` - Supplier management
- `/erp/purchasing/rfq` - Requests for quotation

### 3. Sales

**Features:**
- Sales order management
- Customer management
- Quotations
- Order confirmation
- Delivery management
- Invoice generation
- Payment tracking

**Pages:**
- `/erp/sales/orders` - Sales orders
- `/erp/sales/customers` - Customer management
- `/erp/sales/quotations` - Quotations
- `/erp/sales/invoices` - Invoices

### 4. Manufacturing (Basic)

**Features:**
- Bill of Materials (BOM)
- Manufacturing orders
- Component consumption
- Production tracking

**Pages:**
- `/erp/manufacturing/orders` - Manufacturing orders
- `/erp/manufacturing/bom` - Bill of materials

---

## 🔌 API Reference

### Authentication

All API requests require JWT token in header:
```
Authorization: Bearer <token>
```

### Inventory APIs

#### Products

**List Products**
```http
GET /api/erp/inventory/products
Query Params:
  - search: string (search by name)
  - categoryId: uuid
  - isActive: boolean
  - page: number
  - limit: number
```

**Create Product**
```http
POST /api/erp/inventory/products
Body: {
  name: string *required
  sku: string *required
  productType: 'storable' | 'consumable' | 'service' *required
  trackingType: 'none' | 'serial' | 'lot'
  productCategoryId: uuid
  costPrice: decimal
  salePrice: decimal
  reorderPoint: decimal
  reorderQuantity: decimal
  leadTimeDays: number
  description: string
  imageUrl: string
  notes: string
}
```

**Get Product**
```http
GET /api/erp/inventory/products/:id
```

**Update Product**
```http
PUT /api/erp/inventory/products/:id
Body: (same as create, all fields optional)
```

**Delete Product**
```http
DELETE /api/erp/inventory/products/:id
(Soft delete - sets isActive to false)
```

#### Stock Levels

**Get Stock Levels**
```http
GET /api/erp/inventory/stock-levels
Query Params:
  - warehouseId: uuid
  - productId: uuid
```

#### Warehouses

**List Warehouses**
```http
GET /api/erp/inventory/warehouses
```

**Create Warehouse**
```http
POST /api/erp/inventory/warehouses
Body: {
  name: string *required
  code: string *required
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  phone: string
  email: string
  managerUserId: uuid
}
```

### Purchasing APIs

#### Purchase Orders

**List Purchase Orders**
```http
GET /api/erp/purchasing/orders
Query Params:
  - status: string
  - supplierId: uuid
```

**Create Purchase Order**
```http
POST /api/erp/purchasing/orders
Body: {
  supplierId: uuid *required
  warehouseId: uuid *required
  expectedDeliveryDate: date
  notes: string
  lines: [
    {
      productId: uuid *required
      productVariantId: uuid
      description: string
      quantity: decimal *required
      unitPrice: decimal *required
      taxRate: decimal
      uomId: uuid
      expectedDeliveryDate: date
      notes: string
    }
  ] *required
}
```

#### Suppliers

**List Suppliers**
```http
GET /api/erp/purchasing/suppliers
Query Params:
  - search: string
  - isActive: boolean
```

**Create Supplier**
```http
POST /api/erp/purchasing/suppliers
Body: {
  name: string *required
  code: string (auto-generated if not provided)
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  taxId: string
  paymentTerms: number (days, default 30)
  currencyCode: string (default 'USD')
  notes: string
}
```

### Sales APIs

#### Sales Orders

**List Sales Orders**
```http
GET /api/erp/sales/orders
Query Params:
  - status: string
  - customerId: uuid
```

**Create Sales Order**
```http
POST /api/erp/sales/orders
Body: {
  customerId: uuid *required
  warehouseId: uuid *required
  expectedDeliveryDate: date
  shippingAddress: string
  notes: string
  lines: [
    {
      productId: uuid *required
      productVariantId: uuid
      description: string
      quantity: decimal *required
      unitPrice: decimal *required
      taxRate: decimal
      uomId: uuid
      notes: string
    }
  ] *required
}
```

#### Customers

**List Customers**
```http
GET /api/erp/sales/customers
Query Params:
  - search: string
  - isActive: boolean
```

**Create Customer**
```http
POST /api/erp/sales/customers
Body: {
  name: string *required
  code: string (auto-generated if not provided)
  email: string
  phone: string
  website: string
  billingAddress: string
  shippingAddress: string
  city: string
  state: string
  country: string
  postalCode: string
  taxId: string
  paymentTerms: number (days, default 30)
  currencyCode: string (default 'USD')
  creditLimit: decimal
  notes: string
}
```

---

## 🎨 UI Components

### Layout Components

**ErpLayout** (`app/erp/layout.tsx`)
- Sidebar navigation with module icons
- Submenu support
- User info display
- Header with notifications
- Responsive design

### Reusable Components

**Card** (`components/ui/card.tsx`)
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**Button** (`components/ui/button.tsx`)
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">Click Me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Ghost</Button>
```

**Form Inputs** (`components/ui/form.tsx`)
```tsx
import { Input, Select, Textarea } from '@/components/ui/form';

<Input label="Name" value={value} onChange={handler} error={error} />
<Select label="Type" options={options} value={value} onChange={handler} />
<Textarea label="Description" rows={4} value={value} onChange={handler} />
```

**Table** (`components/ui/table.tsx`)
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 📘 Usage Guide

### Initial Setup

#### 1. Create Organization in ERP

```sql
-- In ERP database
INSERT INTO erp_organizations (main_org_id, erp_enabled, currency_code, timezone)
VALUES ('YOUR-ORG-UUID-FROM-MAIN-DB', true, 'USD', 'UTC')
RETURNING id;
```

#### 2. Link Department

```sql
INSERT INTO erp_departments (
  main_department_id, 
  erp_organization_id, 
  can_manage_inventory, 
  can_manage_purchases,
  can_manage_sales
)
VALUES (
  'YOUR-DEPT-UUID-FROM-MAIN-DB',
  'ERP-ORG-UUID-FROM-STEP-1',
  true,
  true,
  true
);
```

#### 3. Grant User Access

```sql
INSERT INTO erp_user_access (
  main_user_id,
  erp_organization_id,
  erp_department_id,
  role,
  is_active,
  permissions
)
VALUES (
  'USER-UUID-FROM-MAIN-DB',
  'ERP-ORG-UUID',
  'ERP-DEPT-UUID',
  'admin',
  true,
  '{
    "inventory": {"view": true, "create": true, "edit": true, "delete": true},
    "purchasing": {"view": true, "create": true, "edit": true, "delete": true},
    "sales": {"view": true, "create": true, "edit": true, "delete": true}
  }'::jsonb
);
```

### Creating Your First Product

1. Navigate to `/erp/inventory/products`
2. Click "+ Create Product"
3. Fill in the form:
   - Product Name: "Laptop"
   - SKU: "LAP-001"
   - Product Type: "Storable Product"
   - Cost Price: 500
   - Sale Price: 800
   - Reorder Point: 10
4. Click "Create Product"

### Creating a Purchase Order

1. Navigate to `/erp/purchasing/orders`
2. Click "+ Create Purchase Order"
3. Select supplier
4. Select warehouse
5. Add product lines
6. Review totals
7. Save as draft or confirm

### Managing Stock

1. Go to `/erp/inventory/stock`
2. View current stock levels by warehouse
3. Create stock adjustments if needed
4. Track stock movements

---

## 🐛 Troubleshooting

### Common Issues

**1. "Unauthorized" Error**
- Ensure JWT token is valid
- Check token is in Authorization header
- Verify user has ERP access in `erp_user_access`

**2. "ERP access denied"**
- Check `erp_user_access` table
- Verify organization mapping in `erp_organizations`
- Ensure `isActive` is true

**3. "No permission to..."**
- Check user role (admin, manager, user, viewer)
- Verify permissions JSON in `erp_user_access`
- Check department permissions

**4. Database Connection Error**
- Verify `.env` has correct database URLs
- Ensure PostgreSQL is running
- Check database exists

**5. Import Errors**
- Run `npm install` to install all dependencies
- Check `package.json` has all required packages

### Debug Mode

Enable detailed error logging:
```typescript
// In API routes
console.log('Debug:', { user, permissions, data });
```

---

## 🎉 You're Ready!

Your Odoo-like ERP system is now fully set up with:

✅ Complete API endpoints for Inventory, Purchasing, and Sales
✅ Odoo-style UI with sidebar navigation
✅ Product management UI
✅ Purchase order management UI
✅ Sales order management UI
✅ Role-based access control
✅ Organization-level data isolation
✅ Comprehensive documentation

**Next Steps:**
1. Set up your organization and users
2. Create warehouses
3. Add products to catalog
4. Start creating orders
5. Customize workflows as needed

Happy ERP-ing! 🚀
