# Phase 2: Redesign Edit Order & Pricing Specs Modal (Two-Column Layout & Financial Settlement)

## 1\. Role & Identity

You are an expert Frontend Engineer specializing in React, TypeScript, and Tailwind CSS for the Som Sing Phim Printing ERP system.

## 2\. Objective

Redesign the "Edit Order & Pricing Specs" modal (`ແກ້ໄຂຂໍ້ມູນອໍເດີ & ສະເປກລາຄາ`) to:

1. Remove the misplaced Base64 Artwork Link from Tab 1 (Customer Profile).  
2. Transform Tab 2 into a 2-Column Split Layout (Left: Job Items Table with attached artwork; Right: Product Template & 6 Cost Modules).  
3. Fix the profit formatting bug (`+-LAK 50,359.80`) and realistic cost calculation.  
4. Upgrade Tab 3 with a Dynamic % Deposit Input and a "Round to Clean Figures (LAK)" checkbox.

---

## 3\. Target Files to Modify

- `admin-system/frontend/src/features/orders/components/admin/EditOrderPricingModal.tsx` (or related modal component)  
- `admin-system/frontend/src/features/orders/components/admin/PreFlightVerificationCard.tsx`  
- Tab 1, 2, and 3 sub-components under `features/orders/components/`

---

## 4\. STRICT CONSTRAINTS (DO NOT TOUCH)

- **DO NOT MODIFY** the internal calculation algorithms or state hooks of the 6 Cost Modules (Paper, Ink, Machine, Finishing, Consumables, Overhead). Keep their calculation outputs intact.  
- **DO NOT TOUCH** customer contact fields or logistics provider dropdowns.  
- Preserve all existing form submission APIs and save callbacks.

---

## 5\. Detailed Tasks & Implementation Instructions

### Task 2.1: Clean up Tab 1 (Customer & Logistics)

- **Action:**  
  - Locate the `ลิ้งก์ไฟล์งาน (Artwork Link)` input field displaying the raw Base64 data string.  
  - **Remove it completely** from Tab 1\. File links belong exclusively to the Job Items in Tab 2\.

### Task 2.2: Rebuild Tab 2 with a 2-Column Split View

- **Action:** Replace the full-width horizontal tab layout with a two-column grid:  
  - **Left Column (35-40% width): Job Table / List**  
    - List each job in the order (e.g., Job 1 of 2, Job 2 of 2).  
    - For each job row, display:  
      - Active highlight state when selected.  
      - Job title (e.g. "งานพิมพ์เอกสาร ภาษาไทย").  
      - Quantity (e.g. 1 ชุด).  
      - Artwork preview thumbnail \+ filename \+ "View / Download" button.  
      - Compact specs badge (Size, Paper, Color mode).  
      - Individual job subtotal price.  
      - Button: `+ ເພີ່ມ Job ໃໝ່` (Add New Job).  
  - **Right Column (60-65% width): Costing Modules (Keep Original)**  
    - Displays the active job's Product Template and 6 Cost Modules.  
    - Keep the existing formula modules exactly as they are, but scoped strictly to the selected job from the left column.

### Task 2.3: Fix Profit String Formatting & Cost Bug

- **Problem:** Currently displays `+-LAK 50,359.80` with `-74%`.  
- **Action:**  
  - Create a safe formatter:  
      
    export const formatProfitBadge \= (profit: number, marginPercent: number) \=\> {  
      
      const isPositive \= profit \>= 0;  
      
      const absVal \= Math.abs(profit).toLocaleString('en-US', { minimumFractionDigits: 2 });  
      
      return {  
      
        text: \`${isPositive ? '+' : '-'} LAK ${absVal}\`,  
      
        percentText: \`${isPositive ? '+' : ''}${marginPercent.toFixed(0)}%\`,  
      
        colorClass: isPositive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'  
      
      };  
      
    };  
      
  - Ensure paper cost calculation does not multiply by parent sheet full ream costs when calculating per-unit order cost.

### Task 2.4: Dynamic Deposit % & Rounding Checkbox in Tab 3

- **Action:**  
  - In Tab 3 (Financial Settlement):  
    - Provide quick preset buttons: `[ 30% ]`, `[ 50% ]`, `[ 70% ]`, `[ 100% ]`.  
    - Provide a number input to type custom percentage.  
    - Provide a Checkbox: `[✓] ປັດເປັນຕົວເລກຖ້ວນ (ຫຼັກພັນກີບ)` (Round to nearest 1,000 LAK).  
    - When checked: `deposit = Math.round(((total * percent) / 100) / 1000) * 1000`.  
    - Allow the cashier to type and override the final `deposit_amount` directly in Kip.

---

## 6\. Verification & Acceptance Criteria

1. Tab 1 has no artwork input field.  
2. Tab 2 renders side-by-side: Job List on the left, Cost Modules on the right. Clicking a job switches the right panel's active data.  
3. Profit display shows either `+ LAK ...` or `- LAK ...` (never `+-LAK`).  
4. Toggling the rounding checkbox immediately rounds the deposit value to clean thousand Kip figures.

