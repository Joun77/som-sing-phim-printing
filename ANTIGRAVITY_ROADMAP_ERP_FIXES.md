# Antigravity Implementation Roadmap: Data Synchronization & Cost Engine Fixes
**Project:** Som Sing Phim - Admin ERP System (`somsingphim`)  
**Target Platform:** Antigravity IDE Agent Context  
**Author:** AI System Architecture Review  
**Date:** 2026-08-24  

---

## 1. Executive Summary & Root Cause Analysis

### Issue A: Table/Data Grid Stale State (Inbound, Inventory, Machinery)
* **Root Cause 1 (Cache Invalidation):** Mutations (Create / Update / Delete) executed in drawer/modal components do not trigger cache invalidation or refetch callbacks (`queryClient.invalidateQueries(...)` / mutate handlers).
* **Root Cause 2 (Field Name / Display Mapping Mismatch):** In the Inbound table, the column renders `item_name` / `brand` (`ໝຶກ Compute (Pigment)`) instead of concatenating the updated specific color name (`color_name` / `Compute Blue` / `ສີຟ້າ`).
* **Root Cause 3 (Optimistic UI & Table State):** Local state changes in child modal forms are not synced back to parent list component states across `InboundMaster`, `WarehouseInventory`, and `Machinery` views.

### Issue B: Paper Unit Cost Calculation Discrepancy
* **Observation:**
  * **Inbound Master Drawer:** Total Cost = `460,000 LAK`, Total Qty = `2,500 แผ่น` (5 packs × 500 sheets) $\rightarrow$ Unit Cost = `184 LAK/แผ่น` (Correct: $460,000 / 2500 = 184$).
  * **Warehouse Inventory Detail Screen:** Unit Cost shows `920 LAK/แผ่น` ($460,000 / 500 = 920$, divided by `sheets_per_pack` instead of `total_inbound_qty`).
* **Root Cause:** Inconsistent calculation logic across modules. The inventory/warehouse engine calculates unit cost as `total_cost / sheets_per_pack` or `(total_cost / pack_count) / 100`, resulting in a $5\times$ cost inflation.

---

## 2. Phased Development Roadmap

```
+-------------------------------------------------------------------------------+
| PHASE 1: Data Contract & Cost Calculation Normalization (Single Source Truth) |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 2: Mutation & Cache Invalidation Pipeline (React Query / Global State)  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 3: Table Column Formatters & Specific Detail Mappings                   |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 4: Cross-Module Cost Synchronization & Pricing Engine Guard Verification|
+-------------------------------------------------------------------------------+
```

---

## 3. Phase-by-Phase Plan & Direct File Focus

### Phase 1: Cost Engine & Unit Cost Normalization (Core Logic)
**Objective:** Standardize the mathematical formula for Unit Cost across Paper, Inks, and Consumables in both Go Backend and Frontend calculating utilities.

* **Formula Specification:**
  $$\text{Paper Unit Cost (LAK/Sheet)} = \frac{\text{Total Import Cost}}{\text{Total Sheet Count}} = \frac{\text{Total Import Cost}}{\text{Pack Count} \times \text{Sheets Per Pack}}$$
  $$\text{Ink Unit Cost (LAK/ml)} = \frac{\text{Total Import Cost}}{\text{Total Volume (ml)}} = \frac{\text{Total Import Cost}}{\text{Bottle Count} \times \text{Volume Per Bottle}}$$

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/utils/costCalculator.ts` (or `src/lib/calculations/cost.ts` / `src/utils/pricing.ts`)
     * Implement pure calculation functions: `calculatePaperUnitCost({ totalCost, packCount, sheetsPerPack, totalSheets })`.
  2. `somsingphim/src/pages/inventory/PaperDetail.tsx` (or `src/features/inventory/components/PaperDetailCard.tsx`)
     * Fix Unit Cost Metric display from `totalCost / sheetsPerPack` to `totalCost / onHandStock` or direct `unit_cost_lak`.
  3. `backend/internal/services/inventory_service.go` (or `backend/internal/domain/inventory/cost.go`)
     * Ensure database persistence schema calculates and saves `unit_cost_lak` correctly upon receiving inbound stock batches.

---

### Phase 2: Mutation & Cache Invalidation Pipeline (UI Auto-Update)
**Objective:** Fix table synchronization so that updating ink name/color, stock details, or machinery parameters immediately reflects in all data grids without manual page reloads.

* **Action Items:**
  * Bind standard Query Keys: `['inbound-records']`, `['inventory-items']`, `['machinery-list']`.
  * Ensure every `useMutation` onSuccess callback triggers `queryClient.invalidateQueries({ queryKey: [...] })`.
  * If using custom modal/drawer controllers, pass an `onUpdated?: () => void` callback that refreshes the parent dataset.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/pages/inbound/InboundMaster.tsx` (and `src/features/inbound/InboundTable.tsx`)
     * Wire up query invalidation / state sync upon closing edit drawers.
  2. `somsingphim/src/features/inbound/components/InboundDetailDrawer.tsx` / `EditInboundModal.tsx`
     * Ensure `handleSave` triggers mutation hook and triggers parent refresh.
  3. `somsingphim/src/pages/inventory/WarehousePage.tsx` / `InventoryList.tsx`
     * Connect stock mutation invalidations.
  4. `somsingphim/src/pages/machinery/MachineryPage.tsx` / `MachineTable.tsx`
     * Implement proper refetch on machine specification update.
  5. `somsingphim/src/hooks/useInbound.ts` & `somsingphim/src/hooks/useInventory.ts`
     * Wrap API calls with standard cache invalidation logic.

---

### Phase 3: Table Column Display & Composite Field Formatter
**Objective:** Correct table cell rendering logic so updated color names (e.g., `Compute Blue / ສີຟ້າ`) and specifications appear in the main grid instead of generic parent product names.

* **Action Items:**
  * For Ink rows: Render formatted title as `${brand} - ${color_name} (${color_group})` if `color_name` is present.
  * For Paper rows: Render `${name} - ${grammage_gsm}gsm (${paper_format})`.
  * Ensure table cell data accessors match updated model properties returned by backend API.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/features/inbound/components/InboundTableColumns.tsx` (or column definitions in `InboundMaster.tsx`)
     * Update accessor / cell renderer for `ຊື່ / ຮຸ່ນ` column.
  2. `somsingphim/src/features/inventory/components/InventoryTableColumns.tsx`
     * Ensure ink and paper specification labels render composite names.
  3. `somsingphim/src/types/inbound.ts` & `somsingphim/src/types/inventory.ts`
     * Verify TypeScript interfaces match backend JSON payload fields (`color_name`, `color_group`, `unit_cost_lak`, `total_sheets`).

---

### Phase 4: Cross-Module Verification & Pricing Engine Integrity
**Objective:** Verify end-to-end data integrity across Inbound $\rightarrow$ Warehouse $\rightarrow$ Print Cost / Quotation Engine.

* **Action Items:**
  * Verify that updated unit costs in Warehouse immediately propagate to quotation calculations.
  * Perform boundary verification test cases (Ink refills, Compatible inks vs OEM baselines, Paper sheet trimming).
  * Run UI validation across all screen resolutions and ensure Lao font (`Noto Sans Lao`) rendering stability.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/features/pricing/services/pricingEngine.ts` (or `src/services/costEngine.ts`)
  2. `backend/internal/handlers/inbound_handler.go` & `backend/internal/handlers/inventory_handler.go`
  3. `somsingphim/src/tests/cost_calculator.test.ts` (Unit test for paper & ink cost formulas)

---

## 4. Antigravity Prompt Execution Checklist

When passing this task to the Antigravity assistant, execute in order:

- [ ] **Step 1:** Run grep search in `somsingphim/src` for `920` or unit cost calculation formulas to confirm all occurrences.
- [ ] **Step 2:** Refactor `costCalculator.ts` / calculation utilities to establish the canonical unit cost formulas.
- [ ] **Step 3:** Update `PaperDetail.tsx` and `InboundDetailDrawer.tsx` to use the unified calculation helper.
- [ ] **Step 4:** Inspect `InboundMaster.tsx`, `MachineryPage.tsx`, and `WarehousePage.tsx` for query refetch / state invalidation logic and apply `queryClient.invalidateQueries`.
- [ ] **Step 5:** Update column definition accessors in table components to render composite names (`brand + color`).
- [ ] **Step 6:** Run TypeScript compiler (`tsc --noEmit`) and Vite build to confirm zero type errors.

---
