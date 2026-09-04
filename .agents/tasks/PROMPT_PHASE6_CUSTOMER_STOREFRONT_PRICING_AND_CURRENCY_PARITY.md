# Phase 6: Customer Storefront Currency & Pricing Parity

## 1. Role & Identity
You are a Senior Frontend Engineer specializing in React 18, pricing calculation engines, and multi-currency formatting for the Som Sing Phim Printing Customer Storefront (`customer-service/`).

## 2. Objective
Fix the critical pricing discrepancy where the customer storefront multiplies already-native LAK prices by 630.5 (causing 15,000 LAK to display as ₭ 9.5M, and 100 LAK to display as ₭ 63.0K), and fix the option price delta calculation bug in `ProductPage.tsx`.

---

## 3. Target Files to Modify
- `customer-service/src/components/BestSellers.tsx`
- `customer-service/src/pages/CategoryPage.tsx`
- `customer-service/src/pages/ProductPage.tsx`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** `admin-system/` files in this phase.
- **DO NOT TOUCH** authentication, checkout token handling, or payment slip upload APIs.
- **DO NOT TOUCH** backend Go files.
- Strictly enforce the **Zero-Emoji Policy** (Lucide icons only).
- Keep all LAK currency formatted as whole numbers (no decimal points).

---

## 5. Detailed Tasks & Implementation Instructions

### Task 6.1: BestSellers Starting Price Parity
- **File:** `customer-service/src/components/BestSellers.tsx`
- **Problem:**
  - `items.map` takes `p.basePrice` (which is stored in database as LAK, e.g. 15,000 LAK or 100 LAK) and applies `convertTo(p.basePrice)` or an ad-hoc heuristic `rawBase >= 500`.
  - Calling `convertTo(15000)` multiplies 15,000 by 630.5 = 9,457,500 LAK (rendered as `₭ 9.5M`).
  - For items with `basePrice < 500` (e.g. Copy Document at 100 LAK), it calls `convertTo(100)` = 63,050 LAK (rendered as `₭ 63.0K`).
- **Action:**
  - Standardize `p.basePrice` as native **LAK**.
  - When active currency is `'LAK'` (or undefined):
    - `price = rawBase`
    - Display with `formatMoneyCompact(price, 'LAK')`
  - When user explicitly selects another currency (e.g. `'THB'`):
    - Convert from LAK to THB: `price = rawBase / (rates.THB || 630.5)`
    - Display with `formatMoneyCompact(price, currency)`

### Task 6.2: CategoryPage Starting Price Parity
- **File:** `customer-service/src/pages/CategoryPage.tsx`
- **Problem:** Same flawed `convertTo(p.basePrice)` and `rawBase >= 500` logic as BestSellers.
- **Action:**
  - Apply the exact same native LAK handling as Task 6.1:
    - If `currency === 'LAK' || !currency`: `price = p.basePrice || 0`
    - Else: `price = (p.basePrice || 0) / (rates.THB || 630.5)`

### Task 6.3: ProductPage Option Delta Calculation Fix
- **File:** `customer-service/src/pages/ProductPage.tsx`
- **Problem:**
  - In `computeSingleArtworkFinancials` (around lines 808–816 and 1555–1564):
    ```ts
    const baseFloor = product.basePrice || 0;
    const effectiveUnit = Math.max(unitAdd, baseFloor);
    ```
  - When a user chooses an option with an additional fee (e.g. +2,000 Kip), `unitAdd` is 2,000. `Math.max(2000, 15000)` returns 15,000! The option add-on price is completely swallowed.
- **Action:**
  - Correct the formula:
    ```ts
    const baseFloor = product.basePrice || 0;
    const rawUnitWithAddons = baseFloor + unitAdd;
    const effectiveUnit = Math.max(rawUnitWithAddons, baseFloor);
    ```
  - Ensure this applies consistently in `computeSingleArtworkFinancials`, the live calculation `useMemo`, and the cart insertion handler.

---

## 6. Verification & Acceptance Criteria
1. On Customer Storefront homepage, "ສະຕິກເກີ PP ກັນນ້ຳ" shows starting price **₭ 15.0K** (or 15,000 LAK), matching Admin ERP.
2. "Copy Document" shows starting price **₭ 100** (100 LAK), matching Admin ERP.
3. On `ProductPage.tsx`, selecting an option with `+2,000 LAK` increases the unit price from 15,000 to 17,000 LAK (not stuck at 15,000).
4. All TypeScript checks pass with 0 errors.
