# Task 30: End-to-End Cross-System Integration QA & Zero-Regression Verification (Phases 1–3)

## 1. Execution Directives & AI Configuration
* **AI Role:** Principal QA & System Verification Engineer
* **Anti-Gravity Model Tier:** `gemini-3.1-pro` *(or `gemini-3.5`)*
* **Thinking Budget / Effort Level:** `Low` / `Medium` *(Verification, automated test runs, and regression checking across all modules)*
* **Token Optimization Strategy:** Run build commands (`npm run build`, `go test ./...`) and verify specific cross-system assertions.

> **CRITICAL LOCALIZATION REQUIREMENT:** All verified user-facing screens, error dialogs, print documents, and notifications MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Objective & Detailed Scope
Execute a comprehensive end-to-end integration audit across all three phases (Phase 1 CRM & Backend, Phase 2 Admin Persistence, Phase 3 Storefront Real-Time Sync), validating that zero features remain unpersisted or reliant on local-only fake stores.

---

## 3. End-to-End Verification Checklist across All 3 Phases

### Flow 1: Storefront Order ➔ CRM Auto-Registration (Phase 1)
- [ ] Place a new multi-item order on `customer-service` with a new phone number.
- [ ] Verify that PostgreSQL table `customers` receives a newly created row with phone, social channels, and address.
- [ ] Open Admin CRM (`CustomerManagement.tsx`): Verify that the new customer appears immediately in the directory.
- [ ] Delete a customer in Admin CRM: Verify that `DELETE /api/customers/:id` executes and removes the database row.

---

### Flow 2: Slip Anti-Fraud & Real-Time Digital Proof Loop (Phases 1 & 3)
- [ ] Upload payment slip on Storefront: Verify that duplicate `trans_ref` is blocked with anti-fraud error.
- [ ] Valid slip transitions status to `PAID_PREPRESS` in PostgreSQL.
- [ ] Admin uploads Digital Proof: Customer Tracking page updates to `WAITING_APPROVAL` in real time via SSE without manual refresh.
- [ ] Customer approves proof on `ProofReviewPage.tsx`: Order status transitions to `FILE_CONFIRMED` / `READY_TO_PRINT` in DB.

---

### Flow 3: Admin Quotation Conversion, Spoilage & Shop Floor Operations (Phase 2)
- [ ] Edit a quotation in Admin: Verify changes are saved to PostgreSQL table `quotations`.
- [ ] Convert quotation to order: Verify new order is inserted in `orders` and quotation status updates to `ACCEPTED`.
- [ ] Record a spoilage entry in Admin: Verify row is inserted in `spoilage_logs` and appears in Executive Dashboard.
- [ ] Mark production steps complete: Verify technician piece-rate incentives are inserted in `technician_earnings`.

---

### Flow 4: Logistics Dispatch & Shipping Label Print (Phase 2)
- [ ] Dispatch order in `OrderDeliveryPage.tsx`: Enter tracking code and select Anousith/HAL courier.
- [ ] Verify `delivery_dispatches` receives an entry and order status becomes `SHIPPED`.
- [ ] Print barcode shipping label: Layout prints cleanly with destination branch and courier logo.

---

### Flow 5: Code Quality & Localization Compliance
- [ ] **Zero Hardcoded URLs:** Zero occurrences of `http://localhost:8080` in frontend source files.
- [ ] **Zero Text Emojis:** Global regex search for emojis in `admin-system/frontend/src` and `customer-service/src` returns 0 matches.
- [ ] **Lao Language Standard:** All text, error toasts, and table headers render cleanly in Lao with Noto Sans Lao font.
- [ ] **Build Validation:**
  - `admin-system/frontend`: `npm run build` passes with 0 errors.
  - `customer-service`: `npm run build` passes with 0 errors.
  - Go Backend: `go test ./...` passes with 0 failures.

---

## 4. Acceptance Criteria
- [ ] All 5 verification flows execute with 100% pass rate.
- [ ] Server restarts preserve 100% of customer, order, quotation, and shop floor data.
- [ ] Zero unhandled JavaScript console exceptions or Go panic traces.
