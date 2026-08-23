# Antigravity Implementation Roadmap: Machinery Cost Engine & Pricing Integration
**Project:** Som Sing Phim - Admin ERP System (`somsingphim`) & Customer Engine  
**Target Platform:** Antigravity IDE Agent Context  
**Author:** AI System Architecture Review  
**Date:** 2026-08-24  

---

## 1. Executive Summary & Verification Findings

### Current Status
* **Machinery Model Specification:** The printer/cutter schema contains foundational fields: `Purchase Price (LAK)`, `Expected Life Pages`, and `Maintenance Rate %`.
* **The Gap:** The UI specification saves machine details, but the **Total Print Job Cost Formula** in the Pricing Engine currently calculates only Material Cost (Paper Sheet Cost + Ink ml/Coverage Cost), omitting the **Machine Overhead (Depreciation + Maintenance)**.
* **Impact:** Quotations and retail prices underestimate real shop production costs, leading to unrecovered machine wear-and-tear and replacement fund deficits.

---

## 2. Canonical Formula & Architecture Standards

For any given print job order selecting Machine $M$:

$$\text{Depreciation Cost per Sheet} = \frac{\text{Purchase Price (LAK)}}{\text{Expected Life Pages}}$$

$$\text{Maintenance Reserve per Sheet} = \text{Depreciation Cost per Sheet} \times \left(\frac{\text{Maintenance Rate \%}}{100}\right)$$

$$\text{Machine Cost per Sheet} = \text{Depreciation Cost per Sheet} + \text{Maintenance Reserve per Sheet}$$

$$\text{Total Print Job Base Cost} = \text{Paper Cost} + \text{Ink Cost} + (\text{Machine Cost per Sheet} \times \text{Total Job Sheets}) + \text{Labor/Finishing}$$

---

## 3. Phased Implementation Plan

```
+-----------------------------------------------------------------------------------+
| PHASE 1: Machinery Data Model & Validation Normalization                          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 2: Machinery Cost Service & Utility Integration                             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 3: Pricing Engine & Job Order Cost Aggregation Pipeline                     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 4: UI Breakdown & Margin Analytics Verification                             |
+-----------------------------------------------------------------------------------+
```

---

## 4. Phase-by-Phase Execution & Direct File Focus

### Phase 1: Machinery Data Model & Form Normalization
**Objective:** Ensure all printer/cutter forms validate and persist numeric values for `expected_life_pages`, `maintenance_rate_percent`, and `purchase_price_lak`.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/types/machinery.ts` (or `src/types/printer.ts`)
     * Add/verify explicit fields:
       ```typescript
       export interface MachineSpec {
         id: string;
         asset_id: string;
         brand: string;
         model: string;
         purchase_price_lak: number;
         expected_life_pages: number;
         maintenance_rate_percent: number;
         color_scheme: string[];
         // Pre-calculated or helper-derived:
         depreciation_per_sheet_lak?: number;
         maintenance_per_sheet_lak?: number;
         machine_cost_per_sheet_lak?: number;
       }
       ```
  2. `somsingphim/src/features/machinery/components/MachineFormModal.tsx` (or `EditMachineDrawer.tsx`)
     * Ensure validation forbids `expected_life_pages <= 0` (prevent division-by-zero).
  3. `backend/internal/domain/machinery/model.go`
     * Ensure GORM/Postgres entity mappings store clean `decimal` or `int64` for machine financial parameters.

---

### Phase 2: Machinery Cost Utility & Backend Engine
**Objective:** Create pure calculation utilities in frontend and Go backend to evaluate machine unit costs consistently.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/utils/machineCostCalculator.ts` (Create or update)
     ```typescript
     export function calculateMachineUnitCost(spec: {
       purchase_price_lak: number;
       expected_life_pages: number;
       maintenance_rate_percent: number;
     }) {
       if (!spec.expected_life_pages || spec.expected_life_pages <= 0) return { depreciation: 0, maintenance: 0, totalMachineCost: 0 };
       const depreciation = spec.purchase_price_lak / spec.expected_life_pages;
       const maintenance = depreciation * (spec.maintenance_rate_percent / 100);
       return {
         depreciation: Math.round(depreciation * 100) / 100,
         maintenance: Math.round(maintenance * 100) / 100,
         totalMachineCost: Math.round((depreciation + maintenance) * 100) / 100,
       };
     }
     ```
  2. `backend/internal/services/cost_service.go`
     * Implement `CalculateMachineOverhead(machineID string, totalSheets int)` returning exact LAK breakdown.

---

### Phase 3: Pricing Engine & Job Order Aggregation
**Objective:** Link the active selected machine in quotation / order creation into the final cost calculation breakdown.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/features/pricing/services/pricingEngine.ts` (or `src/services/quotationEngine.ts`)
     * Update `calculateJobCost(...)` to take `machineId` or `machineSpec`:
       ```typescript
       // Integration in job cost formula
       const paperCost = calculatePaperCost(paperSpec, totalSheets);
       const inkCost = calculateInkCost(inkSpecs, coveragePercentage, totalSheets);
       const machineCost = calculateMachineUnitCost(machineSpec).totalMachineCost * totalSheets;
       const totalProductionCost = paperCost + inkCost + machineCost + finishingCost;
       ```
  2. `somsingphim/src/pages/orders/JobOrderDetail.tsx` (or `src/features/quotations/QuotationDrawer.tsx`)
     * Bind selected printer to cost breakdown cards.

---

### Phase 4: UI Breakdown Display & Verification
**Objective:** Display real-time cost breakdown in Admin dashboard and order summaries without revealing internal operational markups to public customer interfaces.

* **Direct Files to Focus & Modify:**
  1. `somsingphim/src/features/machinery/components/MachineDetailCard.tsx`
     * Render a real-time badge: `ຕົ້ນທຶນເຄື່ອງຈັກ: XXX LAK/ແຜ່ນ (ຄ່າຫຼຸ້ຍຫ້ຽນ: YYY + ບຳລຸງຮັກສາ: ZZZ)`.
  2. `somsingphim/src/features/pricing/components/CostBreakdownSummary.tsx`
     * Add "Machine Wear & Maintenance" row to the job cost breakdown table.
  3. `somsingphim/src/tests/machinery_cost.test.ts`
     * Unit test boundary cases: $0$ maintenance rate, replacement baselines, large-volume sheet orders.

---

## 5. Antigravity Prompt Execution Checklist

- [ ] **Step 1:** Verify `types/machinery.ts` contains `purchase_price_lak`, `expected_life_pages`, and `maintenance_rate_percent`.
- [ ] **Step 2:** Add `src/utils/machineCostCalculator.ts` with division-by-zero safeguards.
- [ ] **Step 3:** Update `pricingEngine.ts` to include `Machine Cost per Sheet * Total Sheets` in base production cost calculations.
- [ ] **Step 4:** Display the machine unit cost breakdown in `MachineDetailCard.tsx` and quotation detail drawers.
- [ ] **Step 5:** Run `npm run test` or TypeScript check (`npx tsc --noEmit`) to verify zero build errors.
