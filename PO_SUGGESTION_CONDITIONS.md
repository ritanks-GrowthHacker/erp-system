# PO Suggestion Generation - Complete Explanation

## Kaise Kaam Karta Hai (How It Works)

PO (Purchase Order) suggestions **AUTOMATICALLY** generate hoti hain jab ye sab conditions meet hoti hain:

---

## ✅ REQUIRED CONDITIONS (Ye Sab Zaruri Hai)

### 1️⃣ **REORDER RULE Exist Karna Chahiye**
- Product ke liye ek **Reorder Rule** banana padega
- Location: `/erp/inventory/procurement` → "Reorder Rules" tab
- Rule me ye set karna padta hai:
  - **Reorder Point**: Jab stock is level se niche jaye tab PO suggest ho
  - **Reorder Quantity**: Kitni quantity order karni hai
  - **Warehouse**: Konsi warehouse ke liye (optional)
  - **Is Active**: Rule active hona chahiye (✅ checked)

**Example:**
```
Product: iPhone 15
Reorder Point: 50 units
Reorder Quantity: 100 units
Status: Active ✅
```

### 2️⃣ **Current Stock Reorder Point Se NICHE Hona Chahiye**
- Available stock ≤ Reorder Point honi chahiye
- Formula: `SUM(quantity_on_hand - quantity_reserved)`
- Agar stock 50 units se zyada hai aur reorder point 50 hai, **NO SUGGESTION**
- Agar stock 50 ya us se kam hai, **SUGGESTION BANEGA** ✅

**Example:**
```
Reorder Point = 50
Current Stock = 45 ❌ (Below reorder point)
→ PO SUGGESTION GENERATED ✅

Current Stock = 55 ✅ (Above reorder point)
→ NO SUGGESTION ❌
```

### 3️⃣ **Sales History Data Exist Karna Chahiye (IMPORTANT!)**
- **sales_history** table me data hona chahiye
- Ye data tab insert hota hai jab:
  - Sales order **"Delivered"** mark karo
  - Order delivery hone par automatic sales_history me entry jati hai
- **Last 30 days** ki sales history se average daily consumption calculate hota hai

**Yahi Issue Hai Tumhare Case Me!** 🔴
- Tumne order deliver kiya hai BUT sales_history me entry nahi gayi hogi
- Possible reasons:
  1. SQL script (`complete-sales-module.sql`) run nahi kiya
  2. Order delivery ke time error aayi hogi
  3. Sales history table exist nahi karta

---

## 📊 PRIORITY CALCULATION

Suggestions ko priority di jati hai based on **days of stock remaining**:

```sql
CRITICAL  → Stock 3 days ya kam (🔴 Red Alert)
HIGH      → Stock 4-7 days (🟠 Orange)
NORMAL    → Stock 8-14 days (🟡 Yellow)
LOW       → Stock 15+ days (🟢 Green)
```

**Calculation:**
```
Average Daily Consumption = Total Sales (Last 30 Days) / 30
Days Remaining = Current Stock / Average Daily Consumption

Example:
Last 30 days me 300 units becha
Average Daily = 300 / 30 = 10 units/day
Current Stock = 45 units
Days Remaining = 45 / 10 = 4.5 days
Priority = HIGH 🟠
```

---

## 🚨 TROUBLESHOOTING - Tumhare Case Me

### Problem: PO Suggestions = 0

**Step 1: Check Reorder Rules**
```sql
SELECT * FROM reorder_rules WHERE is_active = true;
```
- Agar koi rule nahi hai → **Create reorder rule first**
- Agar rule hai → Next step

**Step 2: Check Current Stock**
```sql
SELECT 
  p.name,
  SUM(sl.quantity_on_hand - sl.quantity_reserved) as available_stock,
  rr.reorder_point
FROM products p
LEFT JOIN stock_levels sl ON sl.product_id = p.id
LEFT JOIN reorder_rules rr ON rr.product_id = p.id
WHERE rr.is_active = true
GROUP BY p.id, p.name, rr.reorder_point;
```
- Agar available_stock > reorder_point → Stock sufficient hai, no suggestion
- Agar available_stock ≤ reorder_point → Next step

**Step 3: Check Sales History (MOST IMPORTANT!) 🔴**
```sql
SELECT * FROM sales_history 
WHERE product_id = 'YOUR_PRODUCT_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Agar Empty Hai (Most Likely Issue):**
- Sales history table me data nahi hai
- Matlab: Order deliver karne par entry nahi gayi

**Solution:**
1. Run SQL script pehle:
   ```bash
   psql -d your_erp_db -f scripts/complete-sales-module.sql
   ```

2. Phir se order deliver karo:
   - Go to `/erp/sales/orders`
   - Koi order ko "Mark Delivered" karo
   - Check terminal/console me error hai kya

3. Verify sales history:
   ```sql
   SELECT * FROM sales_history ORDER BY created_at DESC LIMIT 5;
   ```

**Agar Ab Bhi Nahi Aaya:**
- Manually insert test data:
```sql
-- Example: Manual sales history insert
INSERT INTO sales_history (
  erp_organization_id,
  product_id,
  warehouse_id,
  period_start,
  period_end,
  quantity_sold,
  revenue,
  number_of_orders,
  average_order_quantity
) VALUES (
  'YOUR_ORG_ID',
  'YOUR_PRODUCT_ID',
  'YOUR_WAREHOUSE_ID',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  300,  -- Total sold in 30 days
  150000.00,
  10,   -- Number of orders
  30    -- Average per order
);
```

---

## 🔄 HOW TO GENERATE SUGGESTIONS

### Method 1: Via UI (Recommended)
1. Go to `/erp/inventory/procurement`
2. Click **"Generate Suggestions"** button
3. System will run `generate_purchase_order_suggestions()` function
4. Check "PO Suggestions" tab

### Method 2: Via SQL
```sql
SELECT generate_purchase_order_suggestions();

-- Then view suggestions
SELECT * FROM purchase_order_suggestions 
WHERE status = 'pending'
ORDER BY priority, days_of_stock_remaining;
```

---

## ✅ COMPLETE WORKFLOW FOR TESTING

### Step-by-Step Setup:

**1. Run SQL Migration (If Not Done)**
```bash
cd C:\Users\lenovo\Desktop\erp-system
psql -U postgres -d your_erp_database -f scripts\complete-sales-module.sql
```

**2. Create Reorder Rule**
- Go to `/erp/inventory/procurement`
- Click "Add Reorder Rule"
- Select Product: "iPhone 15"
- Reorder Point: 50
- Reorder Quantity: 100
- Active: ✅
- Save

**3. Check Current Stock**
- Go to `/erp/inventory/products`
- Check "Available Qty" column
- Agar > 50 hai, manually reduce karo via stock adjustment

**4. Create & Deliver Sales Order**
- Go to `/erp/sales/orders`
- Create new sales order
- Add product with quantity (e.g., 60 units)
- Save order
- Click "Mark Delivered"
- Check console for any errors

**5. Verify Sales History**
```sql
SELECT 
  sh.*,
  p.name as product_name
FROM sales_history sh
JOIN products p ON p.id = sh.product_id
ORDER BY sh.created_at DESC
LIMIT 5;
```

**6. Generate PO Suggestions**
- Go to `/erp/inventory/procurement`
- Click "Generate Suggestions"
- Should see suggestion with:
  - Product name
  - Current stock
  - Reorder point
  - Suggested quantity
  - Priority (CRITICAL/HIGH/NORMAL/LOW)
  - Days of stock remaining

---

## 📝 SUMMARY (TL;DR)

**PO Suggestion Generation Conditions:**

1. ✅ **Reorder rule must exist** (active + reorder point set)
2. ✅ **Current stock ≤ Reorder point**
3. ✅ **Sales history data must exist** (30-day consumption)
4. ✅ **Run generate_purchase_order_suggestions() function**

**Most Common Issue:**
- Sales history empty hai kyunki:
  - SQL script run nahi kiya
  - Order delivery fail ho gayi
  - sales_history table columns missing

**Fix:**
1. Run `complete-sales-module.sql`
2. Deliver koi order
3. Check sales_history table
4. Generate suggestions
5. Check `/erp/inventory/procurement`

---

## 🔍 DEBUG QUERIES

```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'generate_purchase_order_suggestions';

-- Check reorder rules
SELECT * FROM reorder_rules WHERE is_active = true;

-- Check stock levels
SELECT p.name, SUM(sl.quantity_on_hand) as stock
FROM products p
LEFT JOIN stock_levels sl ON sl.product_id = p.id
GROUP BY p.id, p.name;

-- Check sales history
SELECT COUNT(*) FROM sales_history;

-- Manually run function
SELECT generate_purchase_order_suggestions();

-- View generated suggestions
SELECT 
  pos.*,
  p.name as product_name,
  w.name as warehouse_name
FROM purchase_order_suggestions pos
JOIN products p ON p.id = pos.product_id
LEFT JOIN warehouses w ON w.id = pos.warehouse_id
ORDER BY pos.created_at DESC;
```

Samajh aa gaya? Koi doubt ho toh pooch le! 👍
