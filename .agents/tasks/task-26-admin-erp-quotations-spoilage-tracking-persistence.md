# Task 26: Admin ERP Quotations, Spoilage & Tracking Database Persistence (Phase 2)

## 1. Execution Directives & AI Configuration
* **AI Role:** Senior Full-Stack ERP Engineer
* **Anti-Gravity Model Tier:** `gemini-3.7`
* **Thinking Budget / Effort Level:** `Medium` *(Refactoring frontend state mutations to REST API endpoints and eliminating local-only state traps)*
* **Token Optimization Strategy:** Target state transition functions in `AppContext.tsx` and specific feature components; do not rewrite unrelated UI styling.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing modals, action buttons, table rows, and alert banners MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Objective & Detailed Scope
Eliminate all unpersisted `localStorage` state traps in the Admin ERP. Connect Quotation updates and conversions, Spoilage/Scrap reporting, and Logistics Tracking directly to their respective Go backend endpoints in PostgreSQL, and purge all hardcoded `http://localhost:8080` strings across the codebase.

---

## 3. Phase-by-Phase Implementation Plan

### Phase A — Quotation Lifecycle & Conversion to Order (`updateQuotation` & `convertQuotationToOrder`)
* **Problem:** In `AppContext.tsx`, `updateQuotation` and `convertQuotationToOrder` only mutate React local state and `localStorage ('ss_print_quotations_v6')`. They never update or insert records into the database.
* **Execution Steps:**
  1. Refactor `updateQuotation(quotationId, updatedFields)` in `AppContext.tsx`:
     - Send `PUT /api/v1/quotations/${quotationId}` with updated specs and pricing.
  2. Refactor `convertQuotationToOrder(quotationId)` in `AppContext.tsx`:
     - Send `POST /api/v1/orders` with items, customer details, and `sourceQuotationId`.
     - Send `POST /api/v1/quotations/${quotationId}/approve` to update quotation status in DB to `ACCEPTED` / `CONVERTED`.
     - Invalidate React Query / refresh orders and quotations list.

---

### Phase B — Spoilage & Scrap Production Logging (`addSpoilageLog`)
* **Problem:** `addSpoilageLog` in `AppContext.tsx` only updates local state. Backend endpoint `POST /api/v1/production/spoilage` exists in `spoilage/` but is never invoked.
* **Execution Steps:**
  1. Refactor `addSpoilageLog(logData)` in `AppContext.tsx`:
     - Send `POST /api/v1/production/spoilage` (or `/api/spoilage`) with:
       `order_id`, `material_id`, `machine_id`, `quantity`, `cause`, `cost_lak`, `reported_by`.
     - On success: Update local state and trigger toast: `ບັນທຶກລາຍງານງານເສຍສຳເລັດ`.
  2. Update `DashboardOverview.tsx` and `SpoilageTimelineChart.tsx` to read data from `GET /api/v1/analytics/spoilage-profit`.

---

### Phase C — Logistics Tracking Information API Alignment (`updateTrackingInfo`)
* **Problem:** `updateTrackingInfo` sends `fetch('http://localhost:8080/api/orders/${orderId}/tracking')` which does not exist on the backend and fails silently.
* **Execution Steps:**
  1. In `AppContext.tsx` and `OrderDeliveryPage.tsx`:
     - Update API call to use `PATCH /api/v1/orders/${orderId}` or `PUT /api/orders/${orderId}` with:
       `{ "internal_tracking_code": trackingCode, "courier_name": courierName, "status": "SHIPPED" }`.
  2. Ensure the order status advances to `SHIPPED` and triggers the SSE status broadcast to the customer tracking page.

---

### Phase D — Global Hardcoded URL Purge (`http://localhost:8080`)
* **Problem:** Multiple files contain hardcoded `http://localhost:8080` strings that break in production or staging environments.
* **Execution Steps:**
  1. Scan and replace all instances of `http://localhost:8080` with relative API paths (e.g. `/api/...` or `/api/v1/...`) or `import.meta.env.VITE_API_BASE_URL`:
     - `src/store/AppContext.tsx`
     - `src/features/hr/components/EmployeeManagement.tsx`
     - `src/features/finance/components/BankManagementModal.tsx`
     - `src/features/orders/components/CustomerOrders.tsx`
     - `src/features/customers/components/CustomerManagement.tsx`

---

## 4. Target Files by Layer

### Layer 1: Admin ERP State & Core Logic
* **[MODIFY]** `admin-system/frontend/src/store/AppContext.tsx` — Quotation, Spoilage, Tracking persistence & URL cleanup
* **[MODIFY]** `admin-system/frontend/src/features/orders/components/SubmitQuotationModal.tsx` — Connect save/update quotation API
* **[MODIFY]** `admin-system/frontend/src/features/orders/components/OrderDeliveryPage.tsx` — Connect courier dispatch PATCH endpoint
* **[MODIFY]** `admin-system/frontend/src/features/dashboard/components/SpoilageTimelineChart.tsx` — Connect backend analytics

### Layer 2: Go Backend Handlers
* **[MODIFY]** `admin-system/backend/orders/quotations.go` — Validate quotation conversion & update handler
* **[MODIFY]** `admin-system/backend/spoilage/` — Validate `HandleCreateSpoilageLog` PostgreSQL transaction

---

## 5. Universal Guardrails
1. **NO EMOJIS:** Use Lucide icons exclusively in all notification toasts and badges.
2. **LAO PRIMARY UI:** All alert messages (`ບັນທຶກໃບສະເໜີລາຄາສຳເລັດ`, `ແປງເປັນອໍເດີຜະລິດແລ້ວ`) must be standard Lao.
3. **FAILSAFE LOGGING:** All API network errors must show clear user-facing Lao error toasts rather than failing silently.

---

## 6. Acceptance Criteria
- [ ] Updating a quotation saves changes to PostgreSQL table `quotations`.
- [ ] Converting a quotation generates an active order in `orders` and sets quotation status to `ACCEPTED`.
- [ ] Logging a spoilage entry writes to PostgreSQL `spoilage_logs` and appears in Executive Dashboard.
- [ ] Dispatching an order with a tracking code updates order status to `SHIPPED` in the database.
- [ ] Zero occurrences of hardcoded `http://localhost:8080` in `admin-system/frontend/src/`.
- [ ] `tsc --noEmit` and `npm run build` pass with 0 errors.
