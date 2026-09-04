# Phase 7: Product Studio Wizard UI Refinement & Universal Modal

## 1. Role & Identity
You are a Senior Frontend UI/UX Engineer specializing in React 19, TailwindCSS, and form design systems for the Som Sing Phim Printing Admin ERP (`admin-system/frontend/`).

## 2. Objective
Eliminate redundant double-plus icons (`+ +`) across all wizard steps, replace literal `[x]` and `[—]` text in Step 4 with proper Lucide icons/toggles, refactor the Material Finder modal in Step 3 into the universal ERP modal standard, and guard printer fallback costs in Step 2.

---

## 3. Target Files to Modify
- `admin-system/frontend/src/features/catalog/components/steps/Step1GeneralInfo.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step2PrintEngine.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step3MaterialInventory.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step4PostPressFinishing.tsx`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** `customer-service/` files in this phase.
- **DO NOT TOUCH** `Step5DiscountsAndTabs.tsx` (handled in Phase 8).
- Strictly enforce the **Zero-Emoji Policy** (Lucide icons only).
- Maintain Lao (`lo`) primary UI localization.

---

## 5. Detailed Tasks & Implementation Instructions

### Task 7.1: Double-Plus (`+ +`) Button Label Elimination
- Remove literal `+` prefixes from button text where a Lucide `<Plus />` icon is already present:
  1. `Step2PrintEngine.tsx`: Line 558: change `<span>+ ເພີ່ມໂໝດການພິມໃໝ່</span>` to `<span>ເພີ່ມໂໝດການພິມໃໝ່</span>`.
  2. `Step3MaterialInventory.tsx`: Line 410: change `<span>+ ສ້າງກຸ່ມວັດສະດຸໃໝ່ເອງ</span>` to `<span>ສ້າງກຸ່ມວັດສະດຸໃໝ່ເອງ</span>`.
  3. `Step3MaterialInventory.tsx`: Line 643: remove `+` from `+ ເພີ່ມແຖວຕົວເລືອກວັດສະດຸໃນກຸ່ມນີ້`.
  4. `Step4PostPressFinishing.tsx`: Line 542: change `+ ເປີດໃຊ້ງານຫຼັງພິມ & ງານຕັດ` to `ເປີດໃຊ້ງານຫຼັງພິມ & ງານຕັດ`.
  5. `Step4PostPressFinishing.tsx`: Line 844: remove `+` from `+ ເພີ່ມແຖວຕົວເລືອກງານຫຼັງພິມໃນກຸ່ມນີ້`.
  6. `Step1GeneralInfo.tsx`: Line 469: change `+ ເພີ່ມຮູບອີກ` to `ເພີ່ມຮູບອີກ`.
  7. `Step1GeneralInfo.tsx`: Line 776: change `+ ເພີ່ມແທັກ` to `ເພີ່ມແທັກ`.

### Task 7.2: Step 4 Post-Press Option Markers (`[x]` and `[—]`) Replacement
- **File:** `admin-system/frontend/src/features/catalog/components/steps/Step4PostPressFinishing.tsx`
- **Problem:** Lines 489 & 509 contain literal strings `[x] ໃຊ້ງານຫຼັງພິມ...` and `[—] ບໍ່ມີງານຫຼັງພິມ...`.
- **Action:**
  - Option A: `<Scissors className="w-4 h-4 text-purple-600" />` + `ໃຊ້ງານຫຼັງພິມ & ງານຕັດ (Enable Post-Press & Cutting)` with an active badge pill (`ເປີດໃຊ້ງານ / Active`).
  - Option B: `<FileCheck className="w-4 h-4 text-emerald-600" />` + `ບໍ່ມີງານຫຼັງພິມ (No Post-Press / Raw Document)` with a pill (`ພິມແລ້ວສົ່ງມອບເລີຍ`).

### Task 7.3: Universal Material Finder Modal
- **File:** `admin-system/frontend/src/features/catalog/components/steps/Step3MaterialInventory.tsx`
- **Problem:** Currently uses custom emerald colors and custom card rows, inconsistent with the standard ERP modal format.
- **Action:**
  - Redesign into a Universal Modal matching `InboundFormModal` / `CategoryManagerModal`:
    - Clean backdrop `bg-slate-900/50 backdrop-blur-xs`.
    - Standard Header with Indigo/Sky icon badge (`Boxes` or `PackageSearch`), Title, Subtitle, and Lucide `X` button.
    - Standard Search input with clear button and standard category filter pills (`ALL`, `Paper`, `Sticker`, `Board`, `Ink`, `Other`).
    - Standard table/list with columns: SKU badge, Item Name, Category, Stock Level (with warning badge if low), Cost per Sheet (LAK), and Select action button.

### Task 7.4: Step 2 Machine Binding Fallback Guard
- **File:** `admin-system/frontend/src/features/catalog/components/steps/Step2PrintEngine.tsx`
- **Problem:** Hardcoded fallback values (1,250 and 280) from an unlinked Fuji printer can overwrite real machine costs if equipment list is slow to load or when editing an existing product.
- **Action:**
  - Guard `ensurePrintModeGroup` so it preserves existing `opt.extraCostRate` and `opt.machineId` when editing a product.

---

## 6. Verification & Acceptance Criteria
1. Zero buttons display double plus signs (`+ +`).
2. Step 4 displays clean Lucide icons and toggle badges with zero literal `[x]` or `[—]` text.
3. The Material Finder modal renders with the universal ERP modal layout, search filters, and stock badges.
4. Machine bindings in Step 2 retain correct costs per sheet during both creation and edit modes.
5. All TypeScript builds pass with 0 errors.
