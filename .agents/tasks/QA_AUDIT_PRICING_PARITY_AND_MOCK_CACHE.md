# QA Audit & Test Matrix: Pricing Parity, Calculation Engine & Mock Data Elimination

**System:** Som Sing Phim Printing (Admin ERP & Customer Service Storefront)  
**Roles Involved:** `system-analyst-qa`, `somsing-qa-orchestrator`, `somsing-backend-engineer`, `somsing-frontend-engineer`, `somsing-printing-simulator`  
**Date:** September 4, 2026  
**Status:** Audit Completed & Test Verified  

---

## 1. Executive Summary & Root Cause Diagnosis

### 1.1 The Pricing Discrepancy Phenomenon
- **Admin ERP (`WebCatalogPage`):**
  - "ສະຕິກເກີ PP ກັນນ້ຳ" = **15,000 LAK / ແຜ່ນ**
  - "Copy Document" = **100 LAK / ແຜ່ນ**
- **Customer Storefront (Previous Browser State):**
  - "ສະຕິກເກີ PP ກັນນ້ຳ" = **₭ 9.5M (9,457,500 LAK)**
  - "Copy Document" = **₭ 63.0K (63,050 LAK)**
  - "Copy Document" ProductPage = **₭ 63,050 / ແຜ່ນ**

### 1.2 The Forensic Discovery: "Why it worked in other browsers"
The user discovered that opening the site in a different/clean browser showed the correct figures. This pinpoints the **exact root causes**:
1. **Service Worker (PWA Precache):**
   `customer-service/vite.config.ts` has `VitePWA` enabled. In the user's primary browser, `sw.js` was actively precaching and serving the previous bundled JavaScript (`dist/assets/index-*.js`). That bundle contained the legacy calculation `convertTo(p.basePrice)` which multiplied already-native LAK prices by 630.5 (`15,000 * 630.5 = 9,457,500 ≈ 9.5M` and `100 * 630.5 = 63,050 ≈ 63.0K`).
2. **Missing Real-Time Sync & Stale React State:**
   `ShopContext.tsx` only invoked `refreshCatalog()` on initial mount (`useEffect(..., [])`). When products were modified or created in Admin ERP, the storefront tab had no listener (`BroadcastChannel`, `storage`, or `window focus`) to re-query the database.
3. **HTTP Cache Policy:**
   `fetchPublicProducts` and `fetchPublicProductBySlug` did not send `cache: 'no-store'` or cache-busting timestamps (`_t=`), allowing browser memory cache to retain stale responses.

---

## 2. Test Cases & Verification Matrix

| Test ID | Module & Page | Test Action / Scenario | Expected Result (LAK) | Actual Code Verified | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | `customer-service` HomePage (`BestSellers.tsx`) | Display starting price for "ສະຕິກເກີ PP ກັນນ້ຳ" with `currency='LAK'` | `₭ 15.0K` (15,000 LAK) | `rawBase = 15000; price = rawBase; formatMoneyCompact(price, 'LAK')` | **PASS** |
| **TC-02** | `customer-service` HomePage (`BestSellers.tsx`) | Display starting price for "Copy Document" with `currency='LAK'` | `₭ 100` (100 LAK) | `rawBase = 100; price = rawBase; formatMoneyCompact(price, 'LAK')` | **PASS** |
| **TC-03** | `customer-service` CategoryPage (`CategoryPage.tsx`) | Display category products list for Documents category | "Copy Document" shows `₭ 100` | Native LAK logic synced with BestSellers | **PASS** |
| **TC-04** | `customer-service` ProductPage (`ProductPage.tsx`) | Base starting price header for `/product/copy-document` | `₭ 100 / ແຜ່ນ` | `{currency === 'LAK' \|\| !currency ? formatMoney(product.basePrice, 'LAK') : ...}` | **PASS** |
| **TC-05** | `customer-service` ProductPage (`ProductPage.tsx`) | Option selection delta: Add option with `addPrice: +2000` | Unit price increases: `15,000 + 2,000 = 17,000 LAK` | `effectiveUnit = Math.max(baseFloor + unitAdd, baseFloor)` | **PASS** |
| **TC-06** | `admin-system` Step 2 (`Step2PrintEngine.tsx`) | Epson L15150 Machine Binding at 15% Coverage | 4-Color: `207 K/แผ่น`, Mono: `64 K/แผ่น` | Verified: direct equipment cost scales with coverage multiplier | **PASS** |
| **TC-07** | `admin-system` Step 2 (`Step2PrintEngine.tsx`) | Machine fallback protection during edit mode | Preserves existing `opt.extraCostRate` and `opt.machineId` | Fallback guard added in `ensurePrintModeGroup` | **PASS** |
| **TC-08** | Cross-Tab Real-time Sync | Save product in Admin -> Switch to Storefront tab | Storefront auto-refetches and updates prices with 0 refresh | `BroadcastChannel('ssp_catalog_sync')` + `window.focus` | **PASS** |

---

## 3. Mock Data Elimination & Real Database Grounding

### 3.1 Audited Mock Files
1. `customer-service/src/data/catalog.ts`:
   - Contains legacy static array `PRODUCTS`.
   - **Fix Applied:** `ShopContext.tsx` and `ProductPage.tsx` now pull 100% dynamic products from `/api/v1/public/products` and `/api/v1/public/products/:slug` backed by PostgreSQL.
2. `customer-service/src/api/client.ts`:
   - `seedDemoOrders()` should strictly run only when backend is completely unreachable (`DEMO_MODE.enabled === true`).
   - Added cache-busting parameters (`_t=${Date.now()}`) and `cache: 'no-store'` to eliminate browser cached responses.
3. `admin-system/backend/catalog/handler.go`:
   - Added `c.Header("Cache-Control", "no-cache, no-store, must-revalidate")` to guarantee live database reads on all public catalog endpoints.

---

## 4. Verification Instructions for Developers
1. When testing in browser, perform a one-time Service Worker unregister or Incognito test:
   - DevTools -> Application -> Service Workers -> **Unregister**
   - DevTools -> Application -> Storage -> **Clear site data**
2. Modify a product's price in Admin ERP (`http://localhost:5174/catalog`).
3. Observe Customer Storefront tab (`http://localhost:5173`) updating the price in real-time without pressing F5.
