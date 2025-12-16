# ERP System - Inventory Management

A comprehensive ERP system with a focus on inventory management, built on Next.js with PostgreSQL.

## 🏗️ Architecture

### Database Structure
- **Main Database** (`inventory_management_main`): Handles authentication, organizations, departments, and user management
- **ERP Database** (`inventory_management_erp`): Standalone ERP system with inventory, purchasing, sales, and manufacturing modules

### Authentication Flow
1. Users authenticate via the main app
2. After login, users are checked for ERP access
3. ERP access is granted based on organization and department assignment
4. Role-based permissions control feature access

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ installed and running
- pgAdmin (optional, for database management)

## 🚀 Setup Instructions

### 1. Install Dependencies

```powershell
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
MAIN_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/inventory_management_main
ERP_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/inventory_management_erp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=development
```

### 3. Database Migration

Run the migration script to create both databases:

```powershell
npm run db:migrate
```

This script will:
- Create the main database (`inventory_management_main`)
- Create the ERP database (`inventory_management_erp`)
- Run all schema migrations
- Set up indexes and constraints

**Manual Migration (Alternative)**:
If you prefer to run migrations manually in pgAdmin:
1. Open pgAdmin and connect to your PostgreSQL server
2. Create two databases: `inventory_management_main` and `inventory_management_erp`
3. Run `app/db/mainDb.sql` in the main database
4. Run `app/db/erpDb.sql` in the ERP database

### 4. Start Development Server

```powershell
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
inventory-management/
├── app/
│   ├── db/
│   │   ├── mainDb.sql          # Main database schema
│   │   └── erpDb.sql            # ERP database schema
│   ├── api/
│   │   └── erp/
│   │       ├── inventory/       # Inventory management APIs
│   │       ├── purchasing/      # Purchase order APIs
│   │       ├── sales/           # Sales order APIs
│   │       └── auth/            # ERP authentication APIs
│   ├── erp/                     # ERP UI pages
│   └── globals.css
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── core.ts          # Core ERP tables
│   │   │   ├── inventory.ts     # Inventory tables
│   │   │   └── purchasing-sales.ts
│   │   └── index.ts
│   └── auth/
│       └── index.ts             # Authentication utilities
├── scripts/
│   └── migrate-erp-db.ps1       # Database migration script
└── drizzle.config.ts
```

## 🔑 User Roles & Permissions

### Role Hierarchy
1. **Admin** - Full access to all ERP modules
2. **Manager** - Can manage inventory, create orders, approve transactions
3. **User** - Can view and create basic transactions
4. **Viewer** - Read-only access

### Module Permissions
- **Inventory Management**: View/Create/Edit/Delete products, stock levels, warehouses
- **Purchasing**: Manage purchase orders and supplier relationships
- **Sales**: Manage sales orders and customer relationships
- **Manufacturing**: Manage BOMs and production orders (if enabled)

## 🎯 Core Features

### Inventory Management
- ✅ Multi-warehouse support
- ✅ Product categories and variants
- ✅ Serial number and lot tracking
- ✅ Stock movements and adjustments
- ✅ Reorder point alerts
- ✅ Warehouse location management

### Purchasing
- ✅ Purchase order management
- ✅ Supplier management
- ✅ Multi-currency support
- ✅ Purchase order approval workflow

### Sales
- ✅ Sales order management
- ✅ Customer management
- ✅ Quotations and invoicing
- ✅ Delivery management

### Manufacturing (Basic)
- ✅ Bill of Materials (BOM)
- ✅ Manufacturing orders
- ✅ Production planning

## 🔄 Onboarding Flow

1. **Organization Onboarding**
   - Organization registers in main app
   - Admin enables ERP for organization
   - Organization entry created in `erp_organizations`

2. **Department Setup**
   - Admin creates departments
   - Configures department ERP permissions
   - Department entry created in `erp_departments`

3. **User Invitation**
   - Manager invites users to department
   - User receives invitation email
   - User completes registration in main app

4. **ERP Access**
   - User logs in via main app
   - System checks `erp_user_access` table
   - If assigned to Inventory Department, user sees ERP module
   - Role-based UI and API access granted

## 🔌 API Routes

### Authentication
- `POST /api/erp/auth/check-access` - Check if user has ERP access

### Inventory
- `GET /api/erp/inventory/products` - List products
- `POST /api/erp/inventory/products` - Create product
- `GET /api/erp/inventory/products/[id]` - Get product details
- `PUT /api/erp/inventory/products/[id]` - Update product
- `DELETE /api/erp/inventory/products/[id]` - Delete product

### Stock Management
- `GET /api/erp/inventory/stock-levels` - View stock levels
- `POST /api/erp/inventory/stock-movements` - Create stock movement
- `POST /api/erp/inventory/stock-adjustments` - Adjust stock

### Purchasing
- `GET /api/erp/purchasing/orders` - List purchase orders
- `POST /api/erp/purchasing/orders` - Create purchase order
- `PUT /api/erp/purchasing/orders/[id]` - Update purchase order

### Sales
- `GET /api/erp/sales/orders` - List sales orders
- `POST /api/erp/sales/orders` - Create sales order
- `PUT /api/erp/sales/orders/[id]` - Update sales order

## 🗄️ Database Relationships

### Main DB → ERP DB References
- `erp_organizations.main_org_id` → `organizations.id`
- `erp_departments.main_department_id` → `departments.id`
- `erp_user_access.main_user_id` → `users.id`

These references are stored as UUIDs but queries happen at the application level (not database foreign keys across databases).

## 📊 Key Database Tables

### Core Tables
- `erp_organizations` - Organization settings
- `erp_departments` - Department permissions
- `erp_user_access` - User roles and permissions

### Inventory Tables
- `warehouses` - Warehouse locations
- `products` - Product master data
- `stock_levels` - Current stock quantities
- `stock_movements` - Inventory transactions
- `serial_lot_numbers` - Tracking numbers

### Transaction Tables
- `purchase_orders` - Purchase orders
- `sales_orders` - Sales orders
- `manufacturing_orders` - Production orders

## 🛠️ Development Commands

```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run db:migrate   # Run database migration
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

## 🔐 Security Considerations

1. **Authentication**: JWT-based authentication from main app
2. **Authorization**: Role-based access control (RBAC)
3. **Data Isolation**: Organization-level data separation
4. **Audit Logging**: All actions logged in `erp_activity_logs`

## 🚧 Next Steps

1. Run `npm install` to install dependencies
2. Set up `.env.local` with your database credentials
3. Run `npm run db:migrate` to create databases
4. Start the development server with `npm run dev`
5. Begin implementing UI components for inventory management

## 📝 Notes

- The ERP database is completely standalone from the main app database
- Authentication happens via the main app's user table
- Users must be invited and assigned to departments with ERP access
- The system supports multi-tenancy at the organization level
- All monetary values support multi-currency
