# 🚀 Quick Start Guide - ERP System Setup

## Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

This will install all required packages including:
- Next.js, React
- Drizzle ORM, PostgreSQL client
- Authentication libraries (bcryptjs, jsonwebtoken)
- Form handling (react-hook-form, zod)
- State management (zustand)
- UI dependencies

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```powershell
Copy-Item .env.local.example .env.local
```

2. Edit `.env.local` and update with your PostgreSQL credentials:
```env
MAIN_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_management_main
ERP_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_management_erp
JWT_SECRET=generate-a-random-secret-key-here
```

**Important**: Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

## Step 3: Run Database Migration

Execute the PowerShell migration script:

```powershell
npm run db:migrate
```

OR manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migrate-erp-db.ps1
```

You'll be prompted for:
- PostgreSQL host (default: localhost)
- PostgreSQL port (default: 5432)
- Username (default: postgres)
- Password

The script will:
- ✅ Create `inventory_management_main` database
- ✅ Create `inventory_management_erp` database
- ✅ Run all schema migrations
- ✅ Set up tables, indexes, and constraints

## Step 4: Verify Database Setup

Open pgAdmin and verify both databases exist with all tables:

**Main Database Tables** (inventory_management_main):
- users
- organizations
- departments
- user_department
- invitations
- projects
- tickets
- etc.

**ERP Database Tables** (inventory_management_erp):
- erp_organizations
- erp_departments
- erp_user_access
- warehouses
- products
- stock_levels
- purchase_orders
- sales_orders
- etc.

## Step 5: Start Development Server

```powershell
npm run dev
```

The application will be available at: http://localhost:3000

## 📋 Initial Setup Tasks

### 1. Create Test Organization (in Main DB)

You'll need to manually insert test data or use your existing main app to:
- Create an organization
- Create departments
- Create users

### 2. Enable ERP for Organization (in ERP DB)

```sql
-- Run in inventory_management_erp database
INSERT INTO erp_organizations (main_org_id, erp_enabled, currency_code, timezone)
VALUES ('YOUR-ORGANIZATION-UUID-FROM-MAIN-DB', true, 'USD', 'UTC');
```

### 3. Link Department to ERP (in ERP DB)

```sql
-- Get the erp_organization_id from previous insert
INSERT INTO erp_departments (main_department_id, erp_organization_id, can_manage_inventory)
VALUES ('YOUR-DEPARTMENT-UUID-FROM-MAIN-DB', 'ERP-ORGANIZATION-UUID', true);
```

### 4. Grant User ERP Access (in ERP DB)

```sql
-- Grant a user access to ERP
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
  'ERP-ORGANIZATION-UUID',
  'ERP-DEPARTMENT-UUID',
  'admin',
  true,
  '{"inventory": {"view": true, "create": true, "edit": true, "delete": true}}'::jsonb
);
```

## 🎯 Testing the ERP System

### Access the ERP Dashboard

1. Navigate to: http://localhost:3000/erp
2. You should see the ERP dashboard with modules

### Test Inventory Module

1. Go to: http://localhost:3000/erp/inventory
2. Try adding a product via API:

```powershell
# Get JWT token first from your main app login
$token = "YOUR-JWT-TOKEN"

# Create a product
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "Test Product"
    sku = "TEST-001"
    productType = "storable"
    description = "A test product"
    costPrice = "10.00"
    salePrice = "15.00"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/erp/inventory/products" -Method POST -Headers $headers -Body $body
```

## 🔧 Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check credentials in `.env.local`
- Ensure databases were created successfully

### Migration Script Fails
- Check if `psql` command is available in PATH
- Try running SQL files manually in pgAdmin
- Check PostgreSQL logs for errors

### API Returns 401 Unauthorized
- Ensure you have a valid JWT token from main app
- Check token is included in Authorization header
- Verify user has ERP access in `erp_user_access` table

### API Returns 403 Forbidden
- Check user's role and permissions
- Verify department has required module permissions
- Check `erp_user_access.permissions` JSON

## 📚 Next Steps

1. **Set up authentication flow** - Integrate with your main app's login
2. **Create warehouses** - Use the API or add UI forms
3. **Add products** - Start building your product catalog
4. **Configure permissions** - Set up role-based access for users
5. **Build custom workflows** - Extend the system for your needs

## 🆘 Need Help?

- Check the `ERP_README.md` for detailed documentation
- Review API routes in `app/api/erp/`
- Examine database schema in `app/db/erpDb.sql`
- Review Drizzle schema files in `lib/db/schema/`

## 🎉 You're Ready!

Your ERP system is now set up and ready for development. Start by:
1. Creating your first warehouse
2. Adding products to inventory
3. Setting up purchase orders
4. Building custom reports

Happy coding! 🚀
