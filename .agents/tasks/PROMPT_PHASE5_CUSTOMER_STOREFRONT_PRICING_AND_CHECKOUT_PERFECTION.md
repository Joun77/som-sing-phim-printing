# Phase 5: Customer Storefront Pricing, Floor Price Sync & UX/UI Mobile Perfection

## 1. Role & Identity
You are an expert Senior Frontend Engineer & UI/UX Designer specializing in React 18, TailwindCSS, and responsive PWA storefronts for the Som Sing Phim Printing ecosystem.

## 2. Objective
Solve the critical quotation discrepancy where:
1. The Quotation Breakdown table displays one subtotal while the bottom Grand Total bar displays a different, conflicting number (due to unsynchronized floor price logic).
2. Implement the Floor Price Protection Rule: `effectiveUnitPrice = Math.max(calculatedSpecsRate, baseStartingPrice)`.
   - If calculated cost is lower than base starting price -> apply the base starting price and add a clear floor adjustment line item.
   - If calculated cost is higher -> apply the higher calculated price.
3. Eliminate UI text clipping and clumsy mobile tables in `PriceBreakdownTable.tsx` by introducing responsive card layouts.
4. Clean up the Lao phone input helper text in `CheckoutPage.tsx` to prevent customer input confusion.
5. Add smooth auto-scroll to the configurator upon uploading files.

---

## 3. Target Files to Modify
- `customer-service/src/pages/ProductPage.tsx`
- `customer-service/src/components/PriceBreakdownTable.tsx`
- `customer-service/src/pages/CheckoutPage.tsx`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** core database authentication, user session tokens, or payment gateway APIs.
- **DO NOT TOUCH** the Go backend pricing calculation formulas in `backend/internal/`.
- **DO NOT TOUCH** `admin-system/` files unless specifically verifying cross-tab synchronization.
- Maintain full bilingual support (`lo` and `en`) with Lucide icons (no emojis).

---

## 5. Detailed Tasks & Implementation Instructions

### Task 5.1: Floor Price Logic & Breakdown Synchronization
- **Problem:** When `customBreakdownRows` are evaluated in `ProductPage.tsx`, the rows sum up to raw production cost (e.g. 4,729,103 LAK) while `grandTotalLAK` uses `basePrice` (9,457,500 LAK), confusing customers.
- **Action:**
  - Compute `calculatedComponentsRate` from the sum of all spec breakdown rows.
  - Apply the floor price comparison: `const effectiveUnitPrice = Math.max(calculatedComponentsRate, product.basePrice || 0)`.
  - If `product.basePrice > calculatedComponentsRate`, insert a transparent breakdown item `floor_price_adjustment` with label `ລາຄາເລີ່ມຕົ້ນຂັ້ນຕ່ຳ (Base Floor Price)` so the table sum matches `effectiveUnitPrice`.
  - Ensure `grandTotalLAK`, `PriceBreakdownTable`, and `addToCart` all use `effectiveUnitPrice`.

### Task 5.2: Mobile Responsive Card Stack in PriceBreakdownTable
- **Problem:** The 5-column table overflows and gets cramped on mobile viewports.
- **Action:**
  - On `sm:hidden`, render an elegant stacked card view with clear badges and unit/subtotal prices.
  - On `hidden sm:block`, maintain the full table.

### Task 5.3: Lao Phone Input Helper Text in CheckoutPage
- **Problem:** Helper text `ໃສ່ສະເພາະຕົວເລກເບີໂທຫຼັງ 20 (ເຊັ່ນ 55123456...)` is confusing when `+856 20` prefix is already displayed.
- **Action:**
  - Change to `ໃສ່ສະເພາະຕົວເລກ 8 ຫຼັກ (ເຊັ່ນ 55123456, 77889900, 99112233)`.

### Task 5.4: Smooth Auto-Scroll on File Upload
- **Action:**
  - After upload completes in `handleMultipleFilesUpload`, trigger a smooth scroll to the active configuration area.

---

## 6. Verification & Acceptance Criteria
1. When a product has a base price of 9,457,500 and calculated cost is 4,729,103, both the Breakdown Table and the Bottom Bar display 9,457,500 LAK.
2. If calculated cost exceeds base price, the higher calculated price is displayed consistently everywhere.
3. Mobile screens display clean stacked cards with zero horizontal overflow.
4. Phone input displays clear 8-digit instructions in both buyer and recipient sections.
5. All TypeScript checks pass with 0 errors.
