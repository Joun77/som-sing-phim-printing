# Task 28: Customer Service Direct Order Tracking & Real-Time SSE Live Synchronization (Phase 3)

## 1. Execution Directives & AI Configuration
* **AI Role:** Senior Frontend & Real-Time Communications Specialist
* **Anti-Gravity Model Tier:** `gemini-3.6`
* **Thinking Budget / Effort Level:** `Medium` *(API client refactoring, Server-Sent Events integration, and connection error handling)*
* **Token Optimization Strategy:** Concentrate edits on `customer-service/src/api/client.ts`, `TrackingPage.tsx`, and `ProofReviewPage.tsx`.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing tracking milestones, courier status labels, and proof review prompts MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Objective & Detailed Scope
Optimize customer-facing order tracking in `customer-service`. Replace the inefficient full-order list retrieval with a secure, targeted endpoint query (`GET /api/v1/orders/track/:tracking_code`), connect live Server-Sent Events (SSE) for instant real-time status changes, and remove confusing fake demo order fallbacks when the live backend is active.

---

## 3. Phase-by-Phase Implementation Plan

### Phase A — Targeted Direct Tracking Endpoint (`GET /api/v1/orders/track/:code`)
* **Problem:** In `customer-service/src/api/client.ts`, `trackOrder` calls `getOrders()` which downloads the entire database of orders and filters on the client. This leaks metadata and degrades performance.
* **Execution Steps:**
  1. Refactor `trackOrder(trackingCode)` in `customer-service/src/api/client.ts`:
     - Query directly: `GET /api/v1/orders/track/${encodeURIComponent(code)}`.
     - Backend already returns the `MaskForCustomer()` payload (internal operational costs stripped).
     - Handle `404 Not Found` with a clear Lao message: `ບໍ່ພົບຂໍ້ມູນອໍເດີຕາມລະຫັດນີ້`.

---

### Phase B — Real-Time SSE Stream Integration (`/api/v1/orders/stream`)
* **Problem:** When Admin uploads a proof or approves a slip, the customer must manually refresh their browser to see the updated status.
* **Execution Steps:**
  1. In `customer-service/src/pages/TrackingPage.tsx` and `ProofReviewPage.tsx`:
     - Initialize `EventSource` on mount:
       ```typescript
       const sseUrl = `${API_BASE}/v1/orders/stream?tracking=${encodeURIComponent(trackingCode)}`;
       const eventSource = new EventSource(sseUrl);
       eventSource.addEventListener('order_status_update', (e) => {
         const updatedOrder = JSON.parse(e.data);
         setOrder(updatedOrder);
       });
       ```
     - Auto-close `eventSource` on unmount to prevent connection leaks.
  2. Display a subtle live pulsing green indicator: `● ອັບເດດສະຖານະສົດ (Live Sync)`.

---

### Phase C — Demo Mode Clean-Up & Backend Status Transparency
* **Problem:** Storefront silently falls back to 5 hardcoded fake orders (`SSP-00001` - `SSP-00005`) without making it clear whether data is live or mock.
* **Execution Steps:**
  1. In `customer-service/src/components/BackendStatus.tsx` (or Header):
     - When connected to backend: Suppress demo banners completely.
     - When backend is offline: Display an explicit notification banner: `ລະບົບຢູ່ໃນໂໝດ Offline/Demo`.

---

## 4. Target Files by Layer

### Layer 1: Customer Service API Layer
* **[MODIFY]** `customer-service/src/api/client.ts` — Implement direct `trackOrder` endpoint & remove unconditional mock seeds

### Layer 2: Customer Service Pages & UI
* **[MODIFY]** `customer-service/src/pages/TrackingPage.tsx` — Add direct tracking query & SSE event listener
* **[MODIFY]** `customer-service/src/pages/ProofReviewPage.tsx` — Add live proof status update listener
* **[MODIFY]** `customer-service/src/components/BackendStatus.tsx` — Connection health indicator

---

## 5. Universal Guardrails
1. **LEAK PREVENTION:** Never expose internal manufacturing cost breakdowns (`unit_cost_lak`, `paper_cost`, `markup_margin`) in customer tracking payloads.
2. **NO TEXT EMOJIS:** Use Lucide icons exclusively.
3. **SSE CLEANUP:** Always close `EventSource` on component unmount (`return () => eventSource.close()`).

---

## 6. Acceptance Criteria
- [ ] Searching a tracking code triggers `GET /api/v1/orders/track/:code` without requesting all orders.
- [ ] Changing order status or uploading a proof in Admin immediately updates the Customer Tracking page in real time via SSE.
- [ ] Entering an invalid tracking code displays a clean, user-friendly Lao error message.
- [ ] `tsc --noEmit` and `npm run build` pass with 0 errors.
