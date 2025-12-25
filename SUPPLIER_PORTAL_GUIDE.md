# Supplier Portal Implementation Guide

## Overview
The supplier portal is now complete with OTP-based authentication, profile management, and quotation submission functionality. Suppliers can log in using their email, receive an OTP, update their profile information, and submit quotations either via file upload (PDF/Word/Image) or manual entry.

## What Has Been Implemented

### 1. Database Schema Updates
- **File**: `scripts/supplier-portal-schema.sql`
- **Changes**:
  - Added 4 new columns to `suppliers` table:
    - `profile_image` (TEXT) - Profile picture URL or base64
    - `otp` (VARCHAR(10)) - One-time password for login
    - `otp_expires_at` (TIMESTAMPTZ) - OTP expiration timestamp
    - `last_login_at` (TIMESTAMPTZ) - Last login tracking
  
  - Created new `supplier_quotation_submissions` table with:
    - Auto-generated submission numbers (SQ000001, SQ000002...)
    - Support for both file uploads and manual entry
    - Status workflow: submitted → under_review → accepted/rejected
    - Links to RFQs and Purchase Orders
    - Comprehensive quotation details (amount, validity, delivery, payment terms)

### 2. API Endpoints

#### Authentication APIs
- **POST /api/supplier-portal/auth/send-otp**
  - Generates 6-digit OTP with 10-minute expiration
  - Sends branded HTML email with OTP
  - Returns supplierId for verification step

- **POST /api/supplier-portal/auth/verify-otp**
  - Validates OTP and expiration
  - Issues JWT token with 24-hour validity
  - Updates last login timestamp
  - Returns supplier profile data

#### Profile Management API
- **GET /api/supplier-portal/profile**
  - Returns complete supplier profile with contacts
  - Requires JWT authentication

- **PUT /api/supplier-portal/profile**
  - Updates supplier profile fields:
    - phone, address, city, state, country, postalCode
    - website, profileImage
  - Requires JWT authentication

#### Quotation Submission API
- **GET /api/supplier-portal/quotations**
  - Returns all quotation submissions for logged-in supplier
  - Ordered by submission date (newest first)

- **POST /api/supplier-portal/quotations**
  - Accepts two quotation types:
    - `file_upload`: PDF/Word/Image (base64 encoded)
    - `manual_entry`: Product list with quantities, prices, taxes
  - Auto-generates submission numbers
  - Links to RFQs/POs (optional)

### 3. Frontend Pages

#### Login Page (`/supplier-portal`)
- Two-step authentication flow:
  1. Enter email → Receive OTP
  2. Enter OTP → Login successful
- Gradient purple/blue theme
- Resend OTP functionality
- Token stored in localStorage

#### Dashboard (`/supplier-portal/dashboard`)
- Overview statistics:
  - Total quotations
  - Pending quotations
  - Accepted quotations
  - Rejected quotations
- Quick action buttons:
  - Submit Quotation
  - Update Profile
  - Help & Support
- Recent quotations table with status badges
- Profile header with image/initials

#### Profile Page (`/supplier-portal/profile`)
- View/Edit mode toggle
- Profile image upload with preview
- Editable fields:
  - Phone, Website
  - Address, City, State, Country, Postal Code
- Last login timestamp display
- Image validation (max 5MB, images only)

#### Submit Quotation Page (`/supplier-portal/submit-quotation`)
- Quotation type selection:
  - **File Upload**: Upload PDF, Word, or Image (max 10MB)
  - **Manual Entry**: Enter line items with product details
- Additional details form:
  - Total amount (auto-calculated for manual entry)
  - Validity days
  - Delivery lead time
  - Payment terms
  - Notes
  - Terms and conditions
- Dynamic item management (add/remove items)
- Real-time total calculation for manual entry

## Installation Steps

### Step 1: Execute Database Migration
```powershell
# Navigate to project directory
cd c:\Users\lenovo\Desktop\erp-system

# Execute the migration SQL
# Option 1: Using psql command line
$env:PGPASSWORD = "your_password"
psql -U postgres -d erp_system -f scripts/supplier-portal-schema.sql

# Option 2: Using pgAdmin
# Open pgAdmin → Connect to database → Tools → Query Tool
# Open and execute scripts/supplier-portal-schema.sql
```

### Step 2: Verify Migration
```sql
-- Check if columns were added to suppliers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
AND column_name IN ('profile_image', 'otp', 'otp_expires_at', 'last_login_at');

-- Check if new table was created
SELECT COUNT(*) FROM supplier_quotation_submissions;

-- Verify trigger is working
SELECT tgname FROM pg_trigger WHERE tgrelid = 'supplier_quotation_submissions'::regclass;
```

### Step 3: Configure Environment Variables
Ensure your `.env.local` has:
```env
JWT_SECRET=your-secure-jwt-secret-key
DATABASE_URL=your-database-connection-string

# Email configuration (if using custom email service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
```

### Step 4: Restart Development Server
```powershell
npm run dev
```

## Testing the Portal

### 1. Test OTP Authentication
1. Navigate to `http://localhost:3000/supplier-portal`
2. Enter a supplier email from your database
3. Check email inbox for OTP
4. Enter OTP to login
5. Verify redirect to dashboard

### 2. Test Profile Management
1. From dashboard, click "Profile" or "Update Profile"
2. Click "Edit Profile" button
3. Upload a profile image
4. Update contact information
5. Click "Save Changes"
6. Verify data persists

### 3. Test Quotation Submission

**File Upload Method:**
1. From dashboard, click "Submit Quotation"
2. Select "Upload File" option
3. Choose a PDF, Word, or Image file
4. Fill in additional details (amount, validity, etc.)
5. Click "Submit Quotation"
6. Verify submission appears in dashboard

**Manual Entry Method:**
1. From dashboard, click "Submit Quotation"
2. Select "Manual Entry" option
3. Add multiple line items
4. Fill in product name, quantity, unit price
5. Add tax rate and discount (optional)
6. Verify total calculation
7. Fill in additional details
8. Click "Submit Quotation"
9. Verify submission appears in dashboard

## Database Schema Details

### Suppliers Table (Enhanced)
```sql
ALTER TABLE suppliers ADD COLUMN profile_image TEXT;
ALTER TABLE suppliers ADD COLUMN otp VARCHAR(10);
ALTER TABLE suppliers ADD COLUMN otp_expires_at TIMESTAMPTZ;
ALTER TABLE suppliers ADD COLUMN last_login_at TIMESTAMPTZ;
```

### Supplier Quotation Submissions Table
```sql
CREATE TABLE supplier_quotation_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_number VARCHAR(20) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  rfq_id UUID REFERENCES request_for_quotations(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  
  -- Quotation type: file_upload or manual_entry
  quotation_type VARCHAR(20) NOT NULL,
  
  -- File upload fields
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INTEGER,
  
  -- Manual entry data (JSONB)
  manual_quotation_data JSONB,
  
  -- Common fields
  total_amount DECIMAL(15,2),
  validity_days INTEGER,
  delivery_lead_time INTEGER,
  payment_terms VARCHAR(255),
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- Status management
  status VARCHAR(50) DEFAULT 'submitted',
  submission_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## File Structure
```
app/
├── supplier-portal/
│   ├── page.tsx                    # Login page with OTP flow
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard with stats and recent quotations
│   ├── profile/
│   │   └── page.tsx                # Profile view/edit page
│   └── submit-quotation/
│       └── page.tsx                # Quotation submission form
│
├── api/
│   └── supplier-portal/
│       ├── auth/
│       │   ├── send-otp/
│       │   │   └── route.ts        # OTP generation and email
│       │   └── verify-otp/
│       │       └── route.ts        # OTP verification and JWT
│       ├── profile/
│       │   └── route.ts            # Profile GET/PUT endpoints
│       └── quotations/
│           └── route.ts            # Quotation submission endpoints
│
lib/
└── db/
    └── schema/
        └── purchasing-sales.ts     # Enhanced schema with portal tables
│
scripts/
└── supplier-portal-schema.sql      # Complete migration script
```

## Security Features

### 1. OTP Authentication
- 6-digit random OTP
- 10-minute expiration
- One-time use (cleared after verification)
- Email validation

### 2. JWT Token Security
- 24-hour token validity
- Supplier-specific claims
- Verified on every API request
- Stored securely in localStorage

### 3. File Upload Validation
- Size limits (5MB for images, 10MB for documents)
- Type validation (PDF, Word, Images only)
- Base64 encoding for secure storage

### 4. Input Validation
- Required field validation
- Number range validation
- Email format validation
- SQL injection prevention via parameterized queries

## Next Steps / Future Enhancements

### 1. Email Integration for PO
Update the Purchase Order email template to include:
```typescript
const portalLink = `https://your-domain.com/supplier-portal?email=${encodeURIComponent(supplier.email)}`;

// Add to email body:
`Click here to access your supplier portal: ${portalLink}`
```

### 2. Quotation Review Dashboard
Create an admin page to:
- View all submitted quotations
- Accept/reject quotations
- Add review notes
- Link quotations to POs automatically

### 3. Notification System
- Email notifications for quotation status changes
- In-portal notifications for suppliers
- Reminder emails for pending quotations

### 4. Document Management
- Download original uploaded files
- Generate PDF from manual entries
- Version history for quotations
- Document preview in browser

### 5. Analytics Dashboard
- Supplier performance metrics
- Average response time
- Acceptance rate
- Price comparison charts

### 6. Mobile Responsive Design
- Optimize layouts for mobile devices
- Touch-friendly file uploads
- Simplified mobile navigation

## Troubleshooting

### Issue: OTP not received
- Check email service configuration
- Verify SMTP settings in environment variables
- Check spam/junk folder
- Verify supplier email in database

### Issue: Invalid token error
- Check JWT_SECRET in environment
- Verify token expiration (24 hours)
- Clear localStorage and login again
- Check server console for JWT errors

### Issue: File upload fails
- Verify file size (max 10MB)
- Check file type (PDF/Word/Image only)
- Ensure base64 encoding is working
- Check browser console for errors

### Issue: Migration errors
- Check PostgreSQL version compatibility
- Verify database user has CREATE TABLE permissions
- Ensure referenced tables (suppliers, rfqs, purchase_orders) exist
- Check for existing columns/tables with same names

## Support

For issues or questions:
1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify database connection and schema
4. Review JWT token validity
5. Test email service configuration

## Conclusion

The supplier portal is now fully functional with:
- ✅ Secure OTP-based authentication
- ✅ Profile management with image upload
- ✅ Dual-mode quotation submission (file upload + manual entry)
- ✅ Dashboard with statistics and quotation tracking
- ✅ Complete database schema with triggers
- ✅ RESTful API endpoints
- ✅ Modern, responsive UI

Execute the migration script and start the development server to begin using the portal!
