# Task 16: Cross-System Pricing & Cost Engine Synchronization

## 1. AI Role & Mission
* **Role:** Senior Print Pricing Engine & Financial Systems Architect
* **Mission:** Normalize and synchronize print job cost calculation formulas (Paper Unit Cost, Ink Coverage ml, Machine Depreciation + Maintenance Reserve, Finishing) across Admin ERP (`admin-system`), Customer Service Storefront (`customer-service`), and Go Backend (`backend/internal/service/`), while resolving table cache invalidation and stale state issues.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing labels, badges, and notification messages rendered in the UI MUST strictly remain in official **Lao language** (`lo` / ພາສາລາວ) using technical print shop terminology.

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Paper & Material Unit Cost Normalization
* **Problem:** In Warehouse Inventory Details, unit cost is divided only by `sheets_per_pack` instead of total received sheets (`pack_count * sheets_per_pack`), resulting in a 5x artificial cost inflation.
* **Canonical Formulas (Single Source of Truth):**
  $$	ext{Paper Unit Cost (LAK/Sheet)} = \frac{	ext{Total Import Cost}}{	ext{Pack Count} 	imes 	ext{Sheets Per Pack}} = \frac{	ext{Total Import Cost}}{	ext{Total Sheet Count}}$$
  $$	ext{Ink Unit Cost (LAK/ml)} = \frac{	ext{Bottle Purchase Price}}{	ext{Bottle Volume (ml)}}$$
* **Execution Steps:**
  1. Standardize shared calculation utilities across frontend and Go backend.
  2. Update `PaperDetailCard.tsx` and `InboundDetailDrawer.tsx` to use the unified formula.
  3. Ensure Lao UI displays: `ຕົ້ນທຶນສະເລ່ຍ: XXX ₭/ແຜ່ນ`.

---

### Phase B — Machine Overhead (Depreciation & Maintenance) Integration
* **Problem:** Customer Service fallback pricing (`utils/pricing.ts`) and some Admin quotation forms calculate only Paper and Ink, omitting Machine Depreciation and Maintenance Reserve.
* **Canonical Machine Overhead Formula:**
  $$	ext{Depreciation per Sheet} = \frac{	ext{Purchase Price (LAK)}}{	ext{Expected Life Pages}}$$
  $$	ext{Maintenance per Sheet} = 	ext{Depreciation per Sheet} 	imes \left(\frac{	ext{Maintenance Rate \%}}{100}\right)$$
  $$	ext{Machine Cost per Sheet} = 	ext{Depreciation per Sheet} + 	ext{Maintenance per Sheet}$$
  $$	ext{Total Base Cost} = 	ext{Paper Cost} + 	ext{Ink Cost} + (	ext{Machine Cost per Sheet} 	imes 	ext{Total Sheets}) + 	ext{Finishing/Labor}$$
* **Execution Steps:**
  1. Update `customer-service/src/utils/pricing.ts` and `api/client.ts` fallback logic to include Machine Overhead.
  2. Synchronize with Go Backend `backend/internal/service/pricing_service.go` and Admin `features/pricing/`.
  3. Render Lao badge in Admin: `ຄ່າຫຼຸ້ຍຫ້ຽນເຄື່ອງຈັກ: XXX LAK/ແຜ່ນ`.

---

### Phase C — Cache Invalidation & Query Pipeline Fix
* **Problem:** Mutations inside modals/drawers in Inbound, Inventory, or Machinery do not trigger automatic data grid re-renders.
* **Execution Steps:**
  1. Wire `queryClient.invalidateQueries` to all mutation hooks for query keys:
     - `['inbound-records']`
     - `['inventory-items']`, `['materials']`
     - `['machinery-list']`, `['equipment']`
     - `['quotations']`, `['orders']`
  2. Pass `onSuccess` / `onUpdated` callbacks from modals/drawers to trigger immediate parent component updates.

---

### Phase D — Multi-Currency & Exchange Rate Sync
* **Execution Steps:**
  1. In `customer-service/src/context/ShopContext.tsx`: Cache the latest `/rates` payload into `localStorage ('ssp_cached_rates')` to avoid hardcoded fallbacks during backend offline mode.
  2. Ensure LAK values round to whole integers (0 decimal places) and THB/USD round to 2 decimal places.

---

## 3. Target Files by Layer

### Level 1: Frontend Admin ERP (`admin-system/frontend/`)
* **[MODIFY]** `src/features/inbound/components/InboundDetailDrawer.tsx` — Fix unit cost calculation & query invalidation
* **[MODIFY]** `src/features/inventory/components/PaperDetailCard.tsx` — Fix total sheet divisor
* **[MODIFY]** `src/features/pricing/services/pricingEngine.ts` — Incorporate Machine Overhead in Base Cost
* **[MODIFY]** `src/features/equipment/components/MachineFormModal.tsx` — Safeguard against division by zero (`expected_life_pages > 0`)
* **[MODIFY]** `src/features/inbound/InboundMaster.tsx` & `src/features/inventory/InventoryManagement.tsx` — Attach query invalidation

### Level 2: Customer Service Storefront (`customer-service/`)
* **[MODIFY]** `src/utils/pricing.ts` — Update `computePrice` to include machine overhead & standard finishing rates
* **[MODIFY]** `src/api/client.ts` — Update `calculatePrice` fallback logic
* **[MODIFY]** `src/context/ShopContext.tsx` — Persist cached exchange rates to localStorage

### Level 3: Go Backend Layer (`backend/` & `admin-system/backend/`)
* **[MODIFY]** `backend/internal/service/pricing_service.go` — Validate Base Cost + Machine Depreciation calculation
* **[MODIFY]** `backend/internal/service/inventory_service.go` — Validate Moving Average Cost calculation
* **[VERIFY]** `backend/internal/service/pricing_service_test.go` — Run unit tests

---

## 4. Universal Guardrails
1. **NO EMOJIS:** Never use text emojis in UI or code; use `lucide-react` icons exclusively.
2. **LAO PRIMARY UI:** All client-facing text, alerts, badges, and modals must strictly be in proper Lao language.
3. **DECIMAL PRECISION:** LAK = 0 decimal places (integer), THB/USD = 2 decimal places.
4. **DIVISION-BY-ZERO SAFEGUARD:** Always check `> 0` before any mathematical division (`/ expected_life_pages`, `/ total_sheets`).

---

## 5. Acceptance Criteria
- [ ] Paper unit cost displays identically and accurately across Inbound and Inventory screens.
- [ ] Admin Quotation and Customer Service fallback pricing both include Machine Overhead in base cost calculations.
- [ ] Saving or editing Inbound, Inventory, or Machine modals immediately refreshes data grids without browser reload.
- [ ] Exchange rates are cached in Customer Service without price jumps during offline/demo mode.
- [ ] `tsc --noEmit` and `npm run build` pass with zero errors in both projects.
