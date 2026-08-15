# Antigravity Task: Fix Pricing Engine Calculation & Synchronize Cost Breakdown

## 1. Problem Statement & Audit Objective
In `admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx` and `admin-system/backend/pricing/engine.go`:
1. **Cost Unit Mismatch in Breakdown**: 
   - Left-hand side Step 1 shows total paper cost: `LAK 19,000` (100 sheets @ 190 LAK/sheet).
   - Right-hand side summary card mixes **Per-Unit Costs** (Paper: LAK 190, Black Ink: LAK 125, Color Ink: LAK 125) with **Total Fixed Job Amounts** (Machine Depreciation: LAK 60,000, Maintenance: LAK 5,000), producing an inconsistent Direct Cost Subtotal (`LAK 65,440`).
2. **Untracked Depreciation & Maintenance Origin**:
   - Trace where `Depreciation: LAK 60,000` and `Maintenance: LAK 5,000` originate in the database/equipment profile and make it configurable via standard print-industry metrics (Per-page meter wear vs. Flat setup fee).

---

## 2. Source Code & Data Origin Audit
Inspect the following files to trace data origins:
* **Backend**:
  * `admin-system/backend/pricing/engine.go`: Look at `CalculateJobPricing()` / `CalculateCostBreakdown()` structs and formulas.
  * `admin-system/backend/inventory/assets.go` & `admin-system/backend/pricing/rates.go`: Equipment cost rates, depreciation fields, and maintenance buffers.
  * `admin-system/migrations/001_master_printer_ink_paper_quotation_spec.sql` & `003_add_equipment_specs_labor_modes.sql`: Schema columns for `depreciation_cost`, `maintenance_cost`, `cost_per_page`, etc.
* **Frontend**:
  * `admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx`: Summary drawer / Right sidebar pricing panel rendering logic and toggle state (`total` vs `per-unit`).
  * `admin-system/frontend/src/features/pricing/types.ts` & `admin-system/frontend/src/types/generated/pricing.ts`: Pricing breakdown types.

---

## 3. Required Engineering Fixes

### A. Backend Pricing Engine (`admin-system/backend/pricing/engine.go`)
1. Separate and standardize the return structure into two clear breakdown objects:
   - `total_breakdown`: Total costs for the entire run ($N$ sheets).
   - `unit_breakdown`: Normalized costs per single unit/sheet ($Total / N$).
2. Equipment Depreciation & Maintenance Formula:
   - **Meter-based Depreciation**: `(Equipment Purchase Price / Target Lifetime Impressions) * Total Pages Printed`
   - **Maintenance Buffer**: `Maintenance Buffer Rate per Impression * Total Pages Printed`
   - **Fixed Setup Cost**: Flat setup fee (if applicable) added once to `total_breakdown` and divided by $N$ in `unit_breakdown`.

```go
type CostBreakdownItem struct {
    PaperCost        float64 `json:"paper_cost"`
    BlackInkCost     float64 `json:"black_ink_cost"`
    ColorInkCost     float64 `json:"color_ink_cost"`
    DepreciationCost float64 `json:"depreciation_cost"`
    MaintenanceCost  float64 `json:"maintenance_cost"`
    SetupCost        float64 `json:"setup_cost"`
    FinishingCost    float64 `json:"finishing_cost"`
    DirectSubtotal   float64 `json:"direct_subtotal"`
    OverheadCost     float64 `json:"overhead_cost"`
    TotalCost        float64 `json:"total_cost"`
}

type PricingEngineResponse struct {
    TotalBreakdown CostBreakdownItem `json:"total_breakdown"`
    UnitBreakdown  CostBreakdownItem `json:"unit_breakdown"`
    ProfitMargin   float64           `json:"profit_margin"`
    FinalPrice     float64           `json:"final_price"`
}
```

### B. Frontend UI State Sync (`admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx`)
1. Implement synchronous toggling between `ລວມທັງໝົດ (Total Job)` and `ຕໍ່ 1 ໃບ (Per Unit)`:
   - When **Total Job** is active:
     - Paper: $190 	imes 100 = 19,000	ext{ LAK}$
     - Black Ink: $125 	imes 100 = 12,500	ext{ LAK}$
     - Color Ink: $125 	imes 100 = 12,500	ext{ LAK}$
     - Depreciation & Maintenance: Sum of job wear.
   - When **Per Unit** is active:
     - Display `UnitBreakdown` where every row is divided by $N$ (Total Sheets).
2. Ensure Left Step Summary cards match the exact values displayed in the Right Summary drawer.

---

## 4. Verification & Testing Checklist
- [ ] Run backend unit tests: `go test ./backend/pricing/...`
- [ ] Create a test job with $N = 100$ sheets, verify Paper Cost is $19,000	ext{ LAK}$ in Total mode and $190	ext{ LAK}$ in Unit mode.
- [ ] Verify that Equipment Depreciation & Maintenance values correctly scale with page count instead of injecting an unscaled fixed lump sum.
- [ ] Confirm that Subtotal, Overhead (15%), and Final Price dynamically recompute correctly when adjusting profit margin slider.
