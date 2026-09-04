# Phase 6: Product Studio UI Alignment, Machine/Material Costing & Storefront Pricing Parity

## 1. Role & Identity
You are a Senior Full-Stack Engineer and UX Designer specializing in the Som Sing Phim Printing ERP (React 19, TailwindCSS, TanStack Query) and Customer Service Storefront (React 18, Vite, PWA).

## 2. Objective
Resolve critical pricing discrepancies between the Admin Product Studio and Customer Storefront, fix cost-per-sheet bindings for printing machinery and warehouse materials, redesign the Selling Price Simulator into Light Mode ("ໂໝດແຈ້ງ"), make the Material Finder modal universal, eliminate double-plus button labels, and clean up post-press option markers.

---

## 3. Target Files to Modify
- `customer-service/src/components/BestSellers.tsx`
- `customer-service/src/pages/CategoryPage.tsx`
- `customer-service/src/pages/ProductPage.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step1GeneralInfo.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step2PrintEngine.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step3MaterialInventory.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step4PostPressFinishing.tsx`
- `admin-system/frontend/src/features/catalog/components/steps/Step5DiscountsAndTabs.tsx`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** authentication, JWT handling, or user permission middlewares.
- **DO NOT TOUCH** core PostgreSQL database migrations or table schemas unless adding non-breaking columns.
- **DO NOT TOUCH** core backend pricing formulas in `backend/internal/service/pricing_service.go`.
- Strictly enforce the **Zero-Emoji Policy** (Lucide icons only).
- Enforce Lao (`lo`) primary UI localization with English fallback.
- Ensure all LAK currency amounts are rounded to whole numbers (no decimal places).

---

## 5. Detailed Tasks & Implementation Instructions

### Task 6.1: Storefront Starting Price & Currency Calculation Parity
- **Problem:**
  - `BestSellers.tsx` and `CategoryPage.tsx` assumed `basePrice` is in THB and called `convertTo(p.basePrice)`, multiplying already-native LAK amounts by 630.5 (e.g. 15,000 LAK became 9.5M LAK, 100 LAK became 63.0K LAK).
  - An ad-hoc check `rawBase >= 500` failed for low-cost items like copy paper (100 LAK).
  - In `ProductPage.tsx` (`computeSingleArtworkFinancials`), `effectiveUnit` was computed as `Math.max(unitAdd, baseFloor)` instead of `Math.max((product.basePrice || 0) + unitAdd, baseFloor)`, swallowing option price additions.
- **Action:**
  - Treat all product prices from backend DB as native **LAK**.
  - In `BestSellers.tsx` and `CategoryPage.tsx`:
    - Display price in LAK when currency is LAK: `formatMoney(p.basePrice, 'LAK')`.
    - If user switches to THB/USD/CNY, convert from LAK to target currency (`p.basePrice / rates.THB` for THB).
  - In `ProductPage.tsx`:
    - Fix formula: `const effectiveUnit = Math.max((product.basePrice || 0) + unitAdd, baseFloor)`.

### Task 6.2: Printer Machine & Material Cost per Sheet Validation (Step 2 & Step 3)
- **Problem:**
  - In `Step2PrintEngine.tsx`, fallback hardcoded costs (1250 and 280) from an unlinked printer can overwrite real machine costs if equipment list is slow to load.
  - In `Step3MaterialInventory.tsx`, default material fallback was hardcoded to `extraCostRate: 200`, and multi-layer items duplicate material groups without clear type labels.
- **Action:**
  - Guard printer bindings against overwriting valid saved options when `dynamicPrinters` is still hydrating.
  - Verify that `extraCostRate` correctly receives `mach.totalColorCost` and `mach.totalBwCost` at the selected `baselineCoveragePercent`.
  - In Step 3, clearly label material groups (e.g. "Cover Stock" vs "Inner Stock") and ensure `cost_per_consumption_unit` is accurately derived from sheet consumption, not purchase packs.

### Task 6.3: Universal Material Finder Modal (Step 3)
- **Problem:**
  - Current Material Finder modal uses custom green styling (`bg-emerald-50/600`), inconsistent with standard ERP modals.
- **Action:**
  - Refactor `Material Finder` modal to match the universal admin modal design system:
    - Clean backdrop with `bg-slate-900/50 backdrop-blur-xs`.
    - Indigo/Sky icon header with title, subtitle, and Lucide `X` button.
    - Unified search input with search icon and quick category filter tabs (`All`, `Paper`, `Sticker`, `Board`, `Ink`, `Finishing`).
    - Standard data rows displaying: SKU badge, Item Name, Category, Stock Level (with warning badge if low), Cost per Sheet (LAK), and Select action button.

### Task 6.4: Double-Plus (`+ +`) Button Label Elimination
- **Problem:**
  - Buttons contain both a Lucide `<Plus />` icon and a literal `+` character in text, rendering as `[+] + ...`.
- **Action:**
  - Remove the literal `+` prefix from text across all wizard steps:
    - `Step2PrintEngine.tsx`: `<span>ເພີ່ມໂໝດການພິມໃໝ່</span>`
    - `Step3MaterialInventory.tsx`: `<span>ສ້າງກຸ່ມວັດສະດຸໃໝ່ເອງ</span>` and `ເພີ່ມແຖວຕົວເລືອກວັດສະດຸໃນກຸ່ມນີ້`
    - `Step4PostPressFinishing.tsx`: `ເພີ່ມແຖວຕົວເລືອກງານຫຼັງພິມໃນກຸ່ມນີ້` and `ເປີດໃຊ້ງານຫຼັງພິມ & ງານຕັດ`
    - `Step1GeneralInfo.tsx`: `<span>ເພີ່ມຮູບອີກ</span>` and `<span>ເພີ່ມແທັກ</span>`

### Task 6.5: Post-Press Option Markers (`[x]` and `[—]`) Replacement (Step 4)
- **Problem:**
  - `Step4PostPressFinishing.tsx` contains literal `[x]` and `[—]` text strings.
- **Action:**
  - Remove `[x]` and `[—]` characters.
  - For "Enable Post-Press & Cutting": Use `<Scissors className="w-4 h-4 text-purple-600" />` + label `ໃຊ້ງານຫຼັງພິມ & ງານຕັດ (Enable Post-Press & Cutting)` + toggle pill.
  - For "No Post-Press / Raw Document": Use `<FileCheck className="w-4 h-4 text-emerald-600" />` + label `ບໍ່ມີງານຫຼັງພິມ (No Post-Press / Raw Document)` + toggle pill.

### Task 6.6: Selling Price Simulator Redesign into Light Mode ("ໂໝດແຈ້ງ") (Step 5)
- **Problem:**
  - Step 5 Selling Price Simulator is wrapped in dark slate (`bg-slate-900`, `bg-slate-800`), conflicting with the light ERP theme and causing visual clutter.
- **Action:**
  - Convert entire simulator container to Light Mode:
    - Container: `bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6`.
    - Color Selling Price Card: `bg-gradient-to-br from-sky-50 to-indigo-50/60 border border-sky-200 rounded-2xl p-5 shadow-xs`.
      - Color price in `text-2xl sm:text-3xl font-mono font-black text-sky-950`.
      - Profit badge in `bg-emerald-100 text-emerald-800 font-bold text-xs`.
    - Mono Selling Price Card: `bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs`.
      - Mono price in `text-2xl sm:text-3xl font-mono font-black text-slate-900`.
      - Profit badge in `bg-slate-200 text-slate-700 font-bold text-xs`.
    - Breakdown Table: Light background `bg-white border border-slate-200 rounded-2xl`, header in `bg-slate-50 text-slate-700 font-bold`, clean rows, and high-contrast summary footer.

---

## 6. Verification & Acceptance Criteria
1. On Customer Storefront (`BestSellers.tsx`), "ສະຕິກເກີ PP ກັນນ້ຳ" shows `15,000 LAK` (or `15.0K`), NOT `9.5M LAK`.
2. "Copy Document" shows `100 LAK`, NOT `63.0K LAK`.
3. In `Step5DiscountsAndTabs.tsx`, the Selling Price Simulator is rendered in clean Light Mode with zero dark-mode clashing.
4. No button in the product studio displays double plus signs (`+ +`).
5. Step 4 displays clean Lucide icons and toggle badges with zero literal `[x]` or `[—]` text.
6. The Material Finder modal renders with the universal ERP modal layout and search filters.
7. All TypeScript builds pass with 0 errors.
