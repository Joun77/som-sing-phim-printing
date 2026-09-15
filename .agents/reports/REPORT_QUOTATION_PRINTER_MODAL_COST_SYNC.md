# Report: Quotation Printer Fleet Search Modal Cost Synchronization

## 1. Summary of Bug & Root Cause
In the Quotation Modal ("ຄົ້ນຫາ & ເລືອກເຄື່ອງພິມ (Live Fleet Search)" - `PrinterSelectorModal.tsx`):
1. **Depreciation Hijack (`machineCostCalculator.ts` line 532):**
   - In `machineCostCalculator.ts`, `persistentTotalCost` was checking `eq.calculatedCostPerPage`.
   - However, `eq.calculatedCostPerPage` stores **only the machine asset depreciation rate** (e.g. 18,000,000 / 500,000 = **36.00 LAK** for Epson; 35,000,000 / 1,000,000 = **35.00 LAK** for Fuji Xerox). It was never meant to be the total print cost per page.
   - Because `eq.calculatedCostPerPage` was populated, `finalCostPerPage` evaluated to `36 LAK` and `35 LAK`, bypassing the calculation of wear parts (19.79 LAK / 18.37 LAK) and linked ink costs (26.36 LAK / 25.16 LAK).
2. **Ink Sources Inconsistency in Modal (`PrinterSelectorModal.tsx`):**
   - The modal only fetched `/api/inbound`, omitting warehouse materials from `/api/inventory/items`.
3. **Display Disconnect:**
   - The Equipment table displayed total cost `82.15 LAK` and `78.53 LAK` with the breakdown `(ເຄື່ອງ ... + ໝຶກ ...)`, while the Printer Selector Modal displayed `36 LAK` and `35 LAK` without breakdown.

---

## 2. Changes Implemented

### 1. `machineCostCalculator.ts`
- Removed `eq.calculatedCostPerPage` and `eq.costPerPage` from `persistentTotalCost`.
- Now, only explicit total cost overrides (`totalPrintCostPerPage`) override the formula.
- In normal operations, `finalCostPerPage` accurately computes:
  $$\text{Final Cost Per Page} = \text{Net Machine Cost (Depreciation + Wear Parts)} + \text{Linked Ink Rate}$$
  - **Epson EcoTank L15150:** $\text{Machine } 55.79 + \text{Ink } 26.36 = \mathbf{82.15\text{ LAK/page}}$
  - **Fuji Xerox AltaLink C8055:** $\text{Machine } 53.37 + \text{Toner } 25.16 = \mathbf{78.53\text{ LAK/page}}$

### 2. `PrinterSelectorModal.tsx`
- **Dual Ink Fetching:** Fetches both `/api/inbound` and `/api/inventory/items` simultaneously via `Promise.all`, mirroring `EquipmentTable.tsx`.
- **Cost Calculation & Breakdown Display:** Updated the card render to show the full combined cost:
  - Total Cost: `82.15 LAK / ໜ້າ` (Epson) and `78.53 LAK / ໜ້າ` (Xerox).
  - Breakdown: `(ເຄື່ອງ LAK 55.79 + ໝຶກ LAK 26.36)` for Epson; `(ເຄື່ອງ LAK 53.37 + ໝຶກ LAK 25.16)` for Xerox.
- 100% matched with `EquipmentTable.tsx`.

---

## 3. Verification Results
- **TypeScript Check:** `npx tsc --noEmit` exited with code 0 (no errors).
- **Unit Tests:** `npm test` passed all 37 tests.
- **Backend Tests:** `go test ./...` passed all packages.
