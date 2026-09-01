# Task 33: Automated Inventory Stock Deduction on Production Trigger

## Mission & Context

Implement an automated, atomic inventory deduction engine in the Go backend. When a print order transitions to the `IN_PRODUCTION` status, the system must automatically calculate the required quantities of paper sheets, ink milliliters (C, M, Y, K), laminates, and finishing consumables, and deduct them from the inventory stock ledger using FIFO/Moving Average cost accounting.

---

## Target Layer & Affected Files

- **Backend Core**:  
  - `admin-system/backend/orders/handlers.go` (Status transition hook)  
  - `admin-system/backend/inventory/deduction.go` (new)  
  - `admin-system/backend/inventory/models.go`  
  - `admin-system/backend/db/db.go` (PostgreSQL transactions)  
- **Database Migrations**:  
  - `admin-system/migrations/026_inventory_deduction_ledger.sql` (new)  
- **Frontend Inventory & Orders**:  
  - `admin-system/frontend/src/features/inventory/InventoryManagement.tsx`  
  - `admin-system/frontend/src/features/orders/ProductionTrackingPage.tsx`

---

## Technical Specifications & Requirements

### 1\. Stock Deduction Calculation Formula

- **Paper Consumption**:  
  - `Required Sheets = (Order Quantity * Pages per Item / Imposition Factor) * (1 + Spoilage Rate % / 100)`  
  - Lookup paper material by SKU matching paper grade, grammage, and sheet dimension.  
- **Ink Consumption**:  
  - `Ink per Color (ml) = CMYK Coverage Rate (%) * 0.007 ml/sheet * Total Printed Sheets`  
  - Deduct from C, M, Y, and K bulk ink/toner inventories.  
- **Finishing & Post-Press Materials**:  
  - Lamination film (m² or rolls), binding coils, or glue based on job specifications.

### 2\. Atomic Database Transaction & State Machine Hook

- Create database table `stock_movements`:  
  - Fields: `id`, `material_id`, `order_id`, `movement_type` (`PRODUCTION_DEDUCTION`, `INBOUND`, `REVERSAL`, `MANUAL_ADJUST`), `quantity`, `unit_cost`, `created_at`, `created_by`.  
- In `UpdateOrderStatus` handler:  
  - If new status is `IN_PRODUCTION` and previous status is not `IN_PRODUCTION`:  
    - Begin `tx, err := db.BeginTx(...)`.  
    - Check material availability. If stock is insufficient, return structured warning `{ code: "INSUFFICIENT_STOCK", material: string, available: float, required: float }` or allow manager override flag `allow_negative_stock=true`.  
    - Deduct quantity from `materials` table (`quantity = quantity - $required`).  
    - Record entry in `stock_movements`.  
    - Update order status and set `stock_deducted = true`.  
    - `tx.Commit()`.

### 3\. Production Cancellation & Rollback Reversal

- If an order in `IN_PRODUCTION` is cancelled or rejected before actual press run:  
  - Provide an endpoint `POST /api/orders/:id/reverse-stock` to add deducted quantities back into `materials` and log movement as `REVERSAL`.

---

## Verification & Acceptance Criteria

- [ ] Moving an order of 1,000 booklets (A4, 130gsm Art Paper, 16 pages) to `IN_PRODUCTION` automatically decrements the exact sheet count \+ spoilage buffer from Art Paper 130gsm stock.  
- [ ] `stock_movements` table records an audit trail containing the order ID, deducted amounts, and timestamp.  
- [ ] If available stock is 0, moving to production alerts the operator and blocks the action unless overridden by a Manager/Admin.  
- [ ] Inventory Management table updates the current quantity in real-time via React Query cache invalidation.

