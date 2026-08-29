# Task 22: End-to-End System QA, Module Completeness & Customer Journey Audit

## 1. AI Role & Mission
* **Role:** Lead QA Architect & Industrial Print Workflow Auditor
* **Mission:** Execute a comprehensive end-to-end quality assurance audit across both the Customer Service Storefront and the Admin ERP, verifying that all modules connect seamlessly without dead links, console errors, or unhandled edge cases across the entire print shop lifecycle.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing UI screens, dialogs, receipts, and order tracking statuses MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. End-to-End Test Matrix & Verification Flows

### Flow 1: Customer Storefront Journey (Order Customization & Checkout)
- [x] **Dynamic Catalog & Category Navigation:** Home page ➔ Select category ➔ Open product details with live DB data.
- [x] **3D Box Viewer & Live Customizer:** Adjust dimensions W×H×D, substrate, and coating ➔ 3D model updates in real time.
- [x] **Spine Thickness Calculator:** Evaluates spine thickness accurately based on paper grammage and page count.
- [x] **Artwork Upload & Preflight:** Upload PDF/image or Google Drive link ➔ Passes preflight validation.
- [x] **Multi-Currency & Cart Drawer:** Currency toggle (LAK, THB, USD) converts cart items and totals with correct exchange rate.
- [x] **Checkout & BCEL OnePay QR:** Displays dynamic payment QR code with exact amount and generates Order ID upon slip upload.

---

### Flow 2: Admin Order Reception & Prepress (Intake & Color Analysis)
- [x] **Order Reception (Step 1):** New order appears in order directory with status `PENDING_SLIP_CHECK`.
- [x] **Bank Slip Verification:** Lightbox zoom preview, approve 100% or 50% deposit ➔ Transitions to `PAID_PREPRESS`.
- [x] **Preflight Color Scanning:** Run preflight scan ➔ Extracts CMYK coverage percentages and populates quotation specs.
- [x] **Digital Proof Generation:** Upload proof artwork ➔ Sends interactive review link to customer.

---

### Flow 3: Proof Approval & Revision Loop (Verification & Sign-off)
- [x] **Customer Tracking Page:** Customer searches Order ID ➔ Displays timeline and zoomable proof file.
- [x] **Approve Proof Action:** Customer clicks Approve ➔ Status transitions to `FILE_CONFIRMED` / `READY_TO_PRINT` ➔ Admin shows green confirmation badge.
- [x] **Request Revision Action:** Customer enters revision notes ➔ Status transitions to `PROOF_REJECTED` ➔ Admin displays red alert card with customer notes.

---

### Flow 4: Production & Job Ticket (Press Run & Cutting)
- [x] **Configure Workflow Modal:** Select standard production template, assign technician from HR, confirm launch.
- [x] **Stock Deduction Trigger:** Deducts paper and ink quantities, locks raw material specs (In-Production Stock Guard).
- [x] **Industrial Job Ticket Print:** Prints A4 job ticket layout with barcode and paper cutting specifications.
- [x] **Technician Piece-Rate Recording:** Marking steps complete automatically records piece-rate incentive in HR.

---

### Flow 5: Delivery & Customer Invoice (Logistics & Settlement)
- [x] **Courier Selection & Tracking:** Select Anousith / HAL courier, specify destination branch, print barcode shipping label.
- [x] **Customer Invoice Multi-Export:** Generate official customer invoice (hiding internal shop costs) ➔ Export to PDF, PNG, JPG, or print.
- [x] **Order Completed & Settlement:** Settle remaining unpaid balance ➔ Transition status to `COMPLETED`.

---

## 3. Acceptance Criteria
- [x] Full lifecycle workflow from Customer Checkout ➔ Production ➔ Delivery ➔ Invoice executes seamlessly 100%.
- [x] Zero console runtime errors (`Uncaught TypeError`, `undefined`, `NaN LAK`) across all screens.
- [x] All modal dialogs open, save, and close cleanly without lingering backdrop overlays.
- [x] `npm run build` and `go test ./...` pass with 100% success.
