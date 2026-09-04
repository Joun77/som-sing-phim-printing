# Phase 8: Selling Price Simulator Redesign into Light Mode ("ໂໝດແຈ້ງ")

## 1. Role & Identity
You are an expert Senior UI/UX Designer and Frontend Engineer specializing in React 19, TailwindCSS, and commercial pricing interfaces for the Som Sing Phim Printing Admin ERP (`admin-system/frontend/`).

## 2. Objective
Redesign the Selling Price Simulator in Step 5 (`Step5DiscountsAndTabs.tsx`) from the dark slate theme (`bg-slate-900`) into a clean, modern Light Mode ("ໂໝດແຈ້ງ") that seamlessly blends with the rest of the Som Sing Phim ERP system, eliminating visual nesting clashes while keeping vibrant accent colors on price figures.

---

## 3. Target Files to Modify
- `admin-system/frontend/src/features/catalog/components/steps/Step5DiscountsAndTabs.tsx`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** other wizard step components (`Step1`, `Step2`, `Step3`, `Step4`).
- **DO NOT ALTER** the underlying profit margin formulas:
  - `marginFactor = Math.max(0.05, 1 - targetMarginPercent / 100)`
  - `suggestedSellingPrice = Math.round(totalBaseCost / marginFactor)`
  - `optionDeltaAddPrice = Math.round((optionCost - defaultCost) / marginFactor)`
- **DO NOT ALTER** the auto-sync to `basePrice` and option deltas.
- Strictly enforce the **Zero-Emoji Policy** (Lucide icons only).
- Maintain Lao (`lo`) primary UI localization.

---

## 5. Detailed Tasks & Implementation Instructions

### Task 8.1: Container & Header Light Mode Transformation
- **Problem:** Currently wrapped in `bg-slate-900 text-white rounded-3xl border-slate-800` which clashes with the clean white cards of the ERP.
- **Action:**
  - Outer container: `bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6`.
  - Header:
    - Title: `text-base font-black text-slate-900`
    - Subtitle: `text-xs text-slate-500`
    - Margin Badge: `px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold`
    - Margin Input box: `bg-slate-50 border border-slate-300 text-slate-900 font-black rounded-xl focus:border-emerald-500`

### Task 8.2: Dual Selling Price Cards Redesign (Color & Mono)
- **Color Selling Price Card (Primary):**
  - Background: `bg-gradient-to-br from-sky-50 to-indigo-50/60 border border-sky-200/90 rounded-2xl p-5 shadow-xs space-y-2`.
  - Header: `text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5`.
  - Price: `text-2xl sm:text-3xl font-mono font-black tracking-tight text-sky-950`.
  - Profit Pill: `px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md text-xs font-mono font-bold`.
  - Footer notes: `text-[11px] text-slate-600 font-mono pt-2 border-t border-sky-100 flex justify-between`.
- **Mono Selling Price Card (Alternative):**
  - Background: `bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2`.
  - Header: `text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5`.
  - Price: `text-2xl sm:text-3xl font-mono font-black tracking-tight text-slate-900`.
  - Profit Pill: `px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md text-xs font-mono font-bold`.
  - Footer notes: `text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200 flex justify-between`.

### Task 8.3: Cost Breakdown Table Light Mode Redesign
- **Problem:** Currently has a dark container with a light inner table, creating an awkward double border and dark padding.
- **Action:**
  - Table Container: `border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white`.
  - Table Header (`thead`): `bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs`.
  - Table Rows (`tbody`):
    - Background: `hover:bg-slate-50/50 transition`.
    - Component titles: `text-xs font-bold text-slate-900`.
    - Cost column: `font-mono text-slate-600 text-right`.
    - Selling price column: `font-mono font-bold text-sky-700 text-right`.
    - Quantity column: `font-mono text-slate-600 text-right`.
    - Subtotal column: `font-mono font-black text-slate-900 text-right`.
  - Summary Footer:
    - Container: `p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-b-2xl`.
    - Average selling rate: `font-mono font-black text-sm text-slate-900`.
    - Cumulative grand total: `font-mono font-black text-xl text-amber-600`.

---

## 6. Verification & Acceptance Criteria
1. The entire Selling Price Simulator renders in clean Light Mode ("ໂໝດແຈ້ງ") with 0 dark-mode clashing.
2. Prices and profit margins stand out vibrantly with sky, amber, and emerald accents on clean light cards.
3. The Cost Breakdown Table is clean, responsive, and clearly readable on all screens.
4. Auto-calculation and synchronization to `basePrice` works flawlessly without regressions.
5. All TypeScript checks pass with 0 errors.
