# Task 17: End-to-End Digital Proof Review, Revision Loop & Multi-Item Order Reception

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Workflow & Order Pipeline Architect
* **Mission:** Connect and synchronize the Digital Proof Review & Revision Request lifecycle between Customer Service Tracking (`TrackingPage`, `ProofReviewPage`) and Admin Prepress Reception (`ArtworkPrepressCard`, `OrderReceptionPage`), align the 11-step Order State Machine, and support multi-item cart serialization into backend orders.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing labels, badges, status names, and notification dialogs rendered in the UI MUST strictly remain in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Real-Time Digital Proof Approval & Revision Synchronization
* **Workflow:**
  1. When Prepress uploads a proof file in Admin (`ArtworkPrepressCard.tsx`) ➔ Order transitions to `WAITING_APPROVAL` and `proof_url` is stored.
  2. Customer opens Tracking / Proof Review page:
     - **Click "Approve Proof" (ຢືນຢັນແບບພິມ):** Status transitions to `FILE_CONFIRMED` / `READY_TO_PRINT`, records `proof_approved_at` ➔ Admin displays green badge: `ລູກຄ້າຢືນຢັນແບບແລ້ວ` with button `[ສົ່ງຕໍ່ພິມຈິງ]`.
     - **Click "Request Revision" (ຂໍແກ້ໄຂແບບ):** Sends `revision_notes` ➔ Status transitions to `PROOF_REJECTED` / `PREPRESS_CHECK` ➔ Admin displays red alert banner: `ລູກຄ້າຂໍແກ້ໄຂແບບ: "[notes]"` with instant re-upload action.
* **Execution Steps:**
  - Update `ArtworkPrepressCard.tsx` to render the revision notice banner and re-upload trigger.
  - Connect endpoints `/v1/orders/:id/proof/approve` and `/v1/orders/:id/proof/reject`.

---

### Phase B — Order Status State Machine Alignment (11 Standard States)
* **Problem:** `normalizeRemoteOrder` in `customer-service/src/api/client.ts` excessively collapses multiple states into single buckets.
* **Standard 11 States:**
  1. `PENDING_SLIP_CHECK`: ລໍຖ້າກວດສອບສະລິບໂອນເງິນ
  2. `PAYMENT_APPROVED`: ຊຳລະເງິນຮຽບຮ້ອຍ
  3. `PREPRESS_CHECK`: ທີມງານກຣາຟິກກຳລັງກວດສອບໄຟລ໌ / ປັບແກ້
  4. `WAITING_APPROVAL`: ສົ່ງໄຟລ໌ Proof ໃຫ້ລູກຄ້າກວດສອບ
  5. `PROOF_REJECTED`: ລູກຄ້າຂໍແກ້ໄຂແບບ
  6. `FILE_CONFIRMED`: ລູກຄ້າຢືນຢັນແບບພິມແລ້ວ
  7. `READY_TO_PRINT`: ພ້ອມສັ່ງພິມລົງເຄື່ອງ
  8. `IN_PRODUCTION`: ກຳລັງດຳເນີນການພິມ (ຕັດສະຕັອກແລ້ວ)
  9. `POST_PRESS`: ຂັ້ນຕອນຫຼັງການພິມ (ເຄືອບ, ໄດຄັດ, ເຂົ້າເລ່ມ)
  10. `SHIPPED`: ສົ່ງມອບບໍລິສັດຂົນສົ່ງແລ້ວ (ພ້ອມເລກ Tracking)
  11. `DELIVERED` / `COMPLETED`: ຈັດສົ່ງສຳເລັດ

---

### Phase C — Multi-Item Cart Serialization & Reception
* **Problem:** The storefront cart supports multiple items (`CartItem[]`), but order submission sometimes flattens to a single item payload.
* **Execution Steps:**
  1. Update `CheckoutPage.tsx` payload to submit `items: OrderItemPayload[]`.
  2. In Admin `OrderDetailsPage.tsx` and `CustomerInvoiceTemplate.tsx`: Render itemized rows for all items with quantities, specs, unit prices, and grand total.

---

### Phase D — Quick Re-Order Hub & Preflight Warning Links
* **Execution Steps:**
  1. In `TrackingPage.tsx`: Ensure the `[ສັ່ງພິມຊ້ຳ (Re-order)]` button copies all original specs and artwork files into the customer Cart Drawer.
  2. Display preflight checklist status badges on cart items prior to checkout.

---

## 3. Target Files by Layer

### Level 1: Frontend Admin ERP (`admin-system/frontend/`)
* **[MODIFY]** `src/features/orders/components/reception/ArtworkPrepressCard.tsx` — Revision banner & proof upload trigger
* **[MODIFY]** `src/features/orders/components/OrderReceptionPage.tsx` — Display proof status & revision notes
* **[MODIFY]** `src/features/orders/components/OrderDetailsPage.tsx` — Support multi-item order rendering
* **[MODIFY]** `src/features/orders/components/documents/CustomerInvoiceTemplate.tsx` — Multi-item invoice table

### Level 2: Customer Service Storefront (`customer-service/`)
* **[MODIFY]** `src/pages/TrackingPage.tsx` — Real-time proof status & timeline rendering
* **[MODIFY]** `src/pages/ProofReviewPage.tsx` — Proof zoom & approve/reject handlers
* **[MODIFY]** `src/pages/CheckoutPage.tsx` — Multi-item cart payload submission
* **[MODIFY]** `src/api/client.ts` — Align `normalizeRemoteOrder` with 11 standard states

### Level 3: Go Backend Layer (`backend/` & `admin-system/backend/`)
* **[MODIFY]** `backend/internal/service/order_service.go` — Multi-item order creation & proof status transitions
* **[MODIFY]** `backend/internal/handler/order_handler.go` — Proof approve / reject endpoints
* **[VERIFY]** `backend/internal/service/order_service_test.go` — Run unit tests for order lifecycle

---

## 4. Universal Guardrails
1. **NO EMOJIS:** Use Lucide icons exclusively.
2. **LAO PRIMARY UI:** All client-facing text must be standard Lao technical printing terms.
3. **PROOF AUDIT LOG:** All Approve and Reject actions must record timestamps and author names in the order timeline.
4. **SAFE RE-ORDER:** Re-ordering must generate new cart items without mutating historical closed orders.

---

## 5. Acceptance Criteria
- [ ] Rejecting a proof on the Tracking page immediately displays a red revision alert banner in Admin.
- [ ] Uploading a new proof in Admin updates the customer Tracking view and re-activates Approve/Reject buttons.
- [ ] All 11 order lifecycle states display identically across Admin and Customer Service.
- [ ] Multi-item checkout renders all distinct items in the Admin details view and invoice.
- [ ] `tsc --noEmit` and `npm run build` pass with zero errors in both projects.
