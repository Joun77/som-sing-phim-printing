# Task 18: Local Financial & Logistics Ecosystem Integration

## 1. AI Role & Mission
* **Role:** Senior Fintech & Logistics Integration Architect (Lao Market Specialist)
* **Mission:** Build and automate integrations with Lao domestic financial systems (BCEL OnePay, LDB, Universal Slip Verification) and domestic logistics couriers (Anousith Express, HAL Logistics, Mixay Express) between the Customer Service Storefront, Admin ERP, and Go Backend.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing labels, form fields, courier names, and payment status badges MUST strictly remain in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Automated BCEL OnePay & Universal Slip Verification Pipeline
* **Workflow:**
  1. Customer checks out on Storefront ➔ Generates Dynamic QR Code with exact Order ID and amount.
  2. Customer uploads bank transfer slip ➔ System dispatches request to `/v1/checkout/verify-slip`:
     - Reads QR data / payload from slip image (SlipOK / Bank Transfer Ref).
     - Checks `trans_ref` for duplicate submission (Anti-Fraud protection).
     - Verifies that transferred amount matches `total_amount_lak` or `deposit_amount` (±0 LAK tolerance).
     - Logs audit record into `bank_transaction_logs` table (Migration 013).
  3. If verification succeeds ➔ Automatically update order status to `PAID_PREPRESS` (`ຊຳລະແລ້ວ / ພ້ອມກວດໄຟລ໌`) without manual admin intervention.

---

### Phase B — Lao Province & District Address Selector
* **Problem:** Free-text address inputs cause misspelled provinces/districts, leading to shipping delays.
* **Execution Steps:**
  1. Fetch standardized provinces and districts from `lao_provinces` and `lao_districts` tables (Migration 018).
  2. In `customer-service/src/pages/CheckoutPage.tsx` and Admin `EditOrderModal.tsx`:
     - Implement Cascading Dropdowns: Select Province (ແຂວງ) ➔ Filter District (ເມືອງ) ➔ Enter Village/Details (ບ້ານ).
     - Support selecting local courier delivery hubs/branches (e.g. ສາຂາດົງໂດກ, ສາຂາປາກເຊ).

---

### Phase C — Courier Dispatch Automation & Barcode Shipping Label
* **Workflow:**
  1. When production completes ➔ Proceed to Step 3 (Delivery):
     - Admin selects courier (`anousith_express`, `hal_logistics`, `mixay_express`) from `couriers` table (Migration 017).
     - Generates internal tracking code (e.g. `ANS-VTE-2026-00123`) with QR Code and Code128 Barcode.
  2. Enhance `ShippingLabelTemplate.tsx`:
     - Render standard shipping label (100×150mm sticker or A4 4-up format).
     - Display: Courier logo, recipient name & phone, destination province/district/branch, COD amount (if applicable), and tracking QR code.

---

## 3. Target Files by Layer

### Level 1: Frontend Admin ERP (`admin-system/frontend/`)
* **[MODIFY]** `src/features/orders/components/reception/PaymentSlipCard.tsx` — Render automated slip verification results & audit reference
* **[MODIFY]** `src/features/orders/components/OrderDeliveryPage.tsx` — Dispatch & Anousith/HAL courier branch selection
* **[MODIFY]** `src/features/orders/components/documents/ShippingLabelTemplate.tsx` — Barcode & courier branding layout
* **[MODIFY]** `src/components/common/CourierManagementModal.tsx` — Manage courier profiles, fees, and delivery timeframes

### Level 2: Customer Service Storefront (`customer-service/`)
* **[MODIFY]** `src/pages/CheckoutPage.tsx` — Cascading Lao province/district selector & BCEL OnePay Dynamic QR
* **[MODIFY]** `src/api/client.ts` — API client for `verifySlipPayment` & `fetchCouriers`
* **[MODIFY]** `src/pages/TrackingPage.tsx` — Display courier badge, logo, and tracking code

### Level 3: Go Backend Layer (`backend/` & `admin-system/backend/`)
* **[MODIFY]** `backend/internal/service/order_service.go` — Webhook slip verification & audit logging
* **[MODIFY]** `admin-system/backend/settings/couriers.go` — Courier & payment method master handlers
* **[VERIFY]** `backend/migrations/013_slip_verification.sql` & `017_couriers_and_payment_methods.sql`

---

## 4. Universal Guardrails
1. **FRAUD PREVENTION:** Never allow duplicate transaction reference (`trans_ref`) submissions.
2. **CURRENCY PRECISION:** All LAK transfer verifications must match exact integer amounts.
3. **LOGISTICS FAILSAFE:** If courier API integration is unreachable, fallback cleanly to manual tracking code entry.
4. **NO TEXT EMOJIS:** Use Lucide icons exclusively.

---

## 5. Acceptance Criteria
- [ ] Uploading a valid slip in Customer Service automatically verifies the transaction and updates status to `PAID_PREPRESS`.
- [ ] Bank transaction audit logs are recorded in `bank_transaction_logs`.
- [ ] Checkout page provides accurate cascading Lao province and district dropdowns.
- [ ] Shipping label prints with clean barcode, courier branding, and destination branch details.
- [ ] `npm run build` and `go test ./...` pass with 100% success.
