# Manufacturing Routing - Complete Guide

## What is Routing?

**Routing** (also called Production Routing or Manufacturing Routing) is a **step-by-step sequence of operations** that defines HOW a product should be manufactured.

Think of it like a recipe with detailed instructions:
- **BOM (Bill of Materials)** tells you WHAT ingredients you need
- **Routing** tells you HOW to make it (the steps/operations)

---

## Real-World Example

### Product: Wooden Table

**BOM (What you need):**
- 4 wooden legs
- 1 table top
- 16 screws
- Wood glue
- Varnish

**Routing (How to make it):**
1. **Operation 1 - Cutting** (Work Center: Wood Shop)
   - Cut wood pieces to size
   - Duration: 30 minutes
   
2. **Operation 2 - Sanding** (Work Center: Finishing Area)
   - Sand all surfaces smooth
   - Duration: 45 minutes
   
3. **Operation 3 - Assembly** (Work Center: Assembly Line)
   - Attach legs to table top
   - Duration: 60 minutes
   
4. **Operation 4 - Finishing** (Work Center: Paint Shop)
   - Apply varnish and let dry
   - Duration: 120 minutes

---

## Routing Components

### 1. Routing Header
- **Routing Code**: Unique identifier (e.g., ROUT-001)
- **Name**: Descriptive name (e.g., "Table Manufacturing Process")
- **Product**: Which product this routing is for
- **Status**: Active/Inactive

### 2. Routing Operations (Steps)
Each operation includes:
- **Operation Number**: Sequence (10, 20, 30, 40...)
- **Operation Name**: What to do (Cutting, Assembly, etc.)
- **Work Center**: Where it happens (which machine/station)
- **Duration**: How long it takes (in minutes/hours)
- **Setup Time**: Time to prepare equipment
- **Teardown Time**: Time to clean up after
- **Cost per Hour**: Labor/machine cost
- **Notes**: Special instructions

### 3. Work Centers
Physical locations or equipment where operations happen:
- Assembly Line
- CNC Machine
- Paint Booth
- Quality Inspection Station
- Packaging Area

---

## How Routing is Used

### When Creating Manufacturing Order (MO):
1. **Select Product** → System shows available BOMs
2. **Select BOM** → Defines WHAT materials needed
3. **Select Routing** → Defines HOW to make it

### During Production:
- Workers follow routing steps in order
- Each operation tracked:
  - Start time
  - End time
  - Worker assigned
  - Quality checks at each step
- System calculates:
  - Total production time
  - Labor costs
  - Machine usage costs

---

## Why No Routings in Dropdown?

### Possible Reasons:

1. **No Routings Created Yet**
   - Go to Manufacturing → Routing
   - Click "Create Routing"
   - Add routing operations

2. **Routing Not Linked to Product**
   - Routing must be for the same product as the selected BOM
   - Example: If making "Table", need routing specifically for "Table"

3. **Routing Status is Inactive**
   - Only Active routings show in dropdown
   - Check routing status and activate it

---

## How to Create a Routing

### Step 1: Go to Manufacturing → Routing

### Step 2: Click "Create Routing"

### Step 3: Fill Basic Info
- **Routing Code**: ROUT-TABLE-001
- **Name**: Standard Table Production
- **Product**: Select "Wooden Table"
- **Status**: Active

### Step 4: Add Operations (Steps)

**Operation 1:**
- Sequence: 10
- Name: Cut Wood
- Work Center: Wood Cutting Shop
- Duration: 30 min
- Setup Time: 10 min

**Operation 2:**
- Sequence: 20
- Name: Sand Surfaces
- Work Center: Sanding Station
- Duration: 45 min
- Setup Time: 5 min

**Operation 3:**
- Sequence: 30
- Name: Assemble Components
- Work Center: Assembly Line
- Duration: 60 min
- Setup Time: 15 min

**Operation 4:**
- Sequence: 40
- Name: Apply Finish
- Work Center: Finishing Booth
- Duration: 120 min
- Setup Time: 20 min

### Step 5: Save

Now when you create a Manufacturing Order for "Wooden Table", this routing will appear in the dropdown!

---

## Routing vs BOM - Key Difference

| Aspect | BOM | Routing |
|--------|-----|---------|
| **Answers** | WHAT materials needed? | HOW to make it? |
| **Contains** | List of components | List of operations/steps |
| **Example** | 4 legs, 1 top, screws | Cut → Sand → Assemble → Finish |
| **Links To** | Products (components) | Work Centers (locations) |
| **Used For** | Material planning | Production planning |
| **Costs** | Material costs | Labor & machine costs |

---

## Benefits of Using Routing

1. **Standardization**
   - Everyone follows same process
   - Consistent quality

2. **Time Tracking**
   - Know how long each step takes
   - Identify bottlenecks

3. **Cost Calculation**
   - Labor costs per operation
   - Machine usage costs
   - Total manufacturing cost

4. **Capacity Planning**
   - Know which work centers are busy
   - Schedule production efficiently

5. **Quality Control**
   - Inspection points at each step
   - Track defects by operation

6. **Worker Assignment**
   - Assign specific workers to operations
   - Track productivity

---

## Example: Complete Manufacturing Flow

### 1. Planning Phase
- **Customer Order**: 10 Tables
- **MRP Check**: Do we have materials?
- **BOM**: Shows need 40 legs, 10 tops, etc.
- **Routing**: Shows 4 operations, total 255 minutes each

### 2. Material Procurement
- Create Purchase Orders for missing materials
- Receive materials to warehouse

### 3. Manufacturing Order Creation
- **MO Number**: MO-2025-001
- **Product**: Wooden Table
- **Quantity**: 10
- **BOM**: BOM-TABLE-V1 (materials needed)
- **Routing**: ROUT-TABLE-001 (process steps)
- **Scheduled Start**: Today
- **Expected Completion**: 3 days

### 4. Production Execution
Each table goes through routing:
- Operation 10: Cut → 30 min
- Operation 20: Sand → 45 min
- Operation 30: Assemble → 60 min
- Operation 40: Finish → 120 min
- **Total per table**: 255 minutes

### 5. Quality Checks
- After each operation
- Final inspection before completion

### 6. Completion
- Move finished goods to warehouse
- Update inventory
- Calculate actual vs planned:
  - Time taken
  - Materials used
  - Costs incurred

---

## Common Routing Patterns

### 1. Linear Routing (Most Common)
```
Step 1 → Step 2 → Step 3 → Step 4 → Done
```

### 2. Parallel Operations
```
        ┌→ Operation A ┐
Start → │              ├→ Assembly → Done
        └→ Operation B ┘
```

### 3. Alternative Routes
```
Standard Route: A → B → C → D
Rush Route: A → C → D (skip B)
```

---

## Troubleshooting: No Routings Showing

### Check 1: Are there any routings?
```
Navigate to: Manufacturing → Routing
- If empty, create your first routing
```

### Check 2: Routing for correct product?
```
- Routing product must match MO product
- If MO is for "Table", routing must also be for "Table"
```

### Check 3: Routing status?
```
- Check routing status = "Active"
- Inactive routings don't show in dropdown
```

### Check 4: Database query
```
SELECT * FROM routings 
WHERE erp_organization_id = 'your-org-id' 
AND status = 'active'
AND product_id = 'your-product-id';
```

---

## Quick Fix: Create Sample Routing

1. Go to **Manufacturing → Routing**
2. Click **"Create Routing"**
3. Enter:
   - Code: `ROUT-SAMPLE-001`
   - Name: `Standard Manufacturing Process`
   - Product: Select any product
   - Status: `Active`
4. Add at least one operation:
   - Sequence: `10`
   - Name: `Production`
   - Work Center: Select any (or leave blank)
   - Duration: `60` minutes
5. Click **Save**

Now this routing should appear in the dropdown when creating MO for that product!

---

## Summary

**Routing** = Manufacturing recipe (the steps)
- Defines HOW to make a product
- Lists operations in sequence
- Specifies work centers and durations
- Tracks labor and machine costs

Without a routing, the system doesn't know HOW to manufacture the product, even if it knows WHAT materials are needed (from BOM).

**Always create both BOM and Routing for each manufactured product!**
