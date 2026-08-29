# Som Sing Phim - Master Development Roadmap (.agents/tasks)

Enterprise-grade development roadmap for Som Sing Phim Print House ERP (`admin-system`), Customer Storefront (`customer-service`), and Go Backend Services (`backend`).

---

## Active Task Index (Tasks 16 – 23)

| Task File | Task Title & Scope | Target Layer | Status |
| :--- | :--- | :--- | :---: |
| [task-16-cross-system-cost-sync-and-pricing-guard.md](file:///.agents/tasks/task-16-cross-system-cost-sync-and-pricing-guard.md) | **Task 16: Cross-System Pricing & Cost Engine Synchronization**<br>Synchronize paper unit cost, ink coverage, and machine depreciation across Admin and Customer Service. | Admin / CS / Backend | ⏳ Ready |
| [task-17-proof-review-loop-and-multi-item-reception.md](file:///.agents/tasks/task-17-proof-review-loop-and-multi-item-reception.md) | **Task 17: End-to-End Digital Proof Review & Multi-Item Orders**<br>Real-time proof approval/revision loop and itemized multi-job order reception. | Admin / CS / Backend | ⏳ Ready |
| [task-18-local-financial-and-logistics-integration.md](file:///.agents/tasks/task-18-local-financial-and-logistics-integration.md) | **Task 18: Local Financial & Logistics Ecosystem Integration**<br>Automated BCEL OnePay slip verification and Lao courier dispatch (Anousith/HAL) with barcode labels. | Admin / CS / Backend | ⏳ Ready |
| [task-19-smart-inventory-restock-and-predictive-maintenance.md](file:///.agents/tasks/task-19-smart-inventory-restock-and-predictive-maintenance.md) | **Task 19: Smart Inventory Auto-Restocking & Predictive Maintenance**<br>Velocity-based Auto-PO drafts, offcut scrap reclaim, and equipment wear meter alerts (Migration 016). | Admin / Backend | ⏳ Ready |
| [task-20-auth-silent-refresh-and-backend-rbac.md](file:///.agents/tasks/task-20-auth-silent-refresh-and-backend-rbac.md) | **Task 20: Authentication, Silent Token Refresh & Backend RBAC**<br>Seamless token renewal without session drop and route-level role protection in Go Backend. | Admin / Backend | ⏳ Ready |
| [task-21-zero-emoji-and-lao-localization-polish.md](file:///.agents/tasks/task-21-zero-emoji-and-lao-localization-polish.md) | **Task 21: Enterprise Zero-Emoji Refactor & Complete Lao i18n Polish**<br>100% text emoji purge replaced with Lucide icons and technical Lao printing vocabulary standard. | Admin / CS | ⏳ Ready |
| [task-22-end-to-end-system-qa-and-customer-journey.md](file:///.agents/tasks/task-22-end-to-end-system-qa-and-customer-journey.md) | **Task 22: End-to-End System QA & Customer Journey Audit**<br>Full-lifecycle testing across 5 core workflows from customizer to delivery and invoice. | Full System | ⏳ Ready |
| [task-23-state-management-react-query-refactor.md](file:///.agents/tasks/task-23-state-management-react-query-refactor.md) | **Task 23: State Management & React Query Refactoring**<br>Decouple server state from AppContext into React Query custom hooks and Zustand for 60fps rendering. | Admin Frontend | ⏳ Ready |

---

## Completed & Archived Tasks (Tasks 01 – 15)

* **Task 01:** Quick Actions & Edit Button Integration (4 action buttons & aligned data grid) — ✅ Completed
* **Task 02:** Multi-Step Large Edit Order Modal & In-Production Stock Guard — ✅ Completed
* **Task 03:** Universal Bank Slip Verification & Dual-Mode Payment Upload — ✅ Completed
* **Task 04:** Customer Artwork Specs Viewer & Comprehensive Job Specs Inspection — ✅ Completed
* **Task 05:** Design System Emoji Cleanup & End-to-End QA Verification — ✅ Completed
* **Task 06:** Quotation-Grade Order Editing & Deep Pricing Specs Integration — ✅ Completed
* **Task 07:** Direct Order Edit from OrderDetailsPage (Step 1-4 View) — ✅ Completed
* **Task 08:** Industrial Factory Job Ticket Print Layout (Standard A4 Job Ticket) — ✅ Completed
* **Task 09:** Advanced Order Search & Multi-Criteria Filtering — ✅ Completed
* **Task 10:** Batch Order Actions & Report Export (Excel/CSV & Bulk Print) — ✅ Completed
* **Task 11:** Dynamic Production Workflow & Template Engine with Technician Role Assignment — ✅ Completed
* **Task 12:** Customer Payment Invoice / Receipt with Multi-Format Export (PDF/PNG/JPG) — ✅ Completed
* **Task 13:** Low-Stock Alert Banner & Offcuts Inventory Management UI — ✅ Completed
* **Task 14:** Executive Profit & Spoilage Dashboard — ✅ Completed
* **Task 15:** Technician Piece-Rate & Incentive Tracking System — ✅ Completed

---

## Universal Guardrails for AI Execution

1. **NO EMOJIS:** Never insert text emojis (e.g. `📑`, `🎨`, `⚠️`, `❌`, `✂️`, `✓`, `⏳`) in code or UI; use `lucide-react` icons exclusively.
2. **LAO LANGUAGE PRIMARY UI:** All client-facing text, button labels, status badges, and notifications MUST strictly render in standard **Lao language** (`lo` / ພາສາລາວ) with proper technical printing terminology.
3. **STRICT SCOPE ISOLATION:** Keep modifications isolated to the designated module without unintended regressions.
4. **STOCK INTEGRITY GUARD:** Never permit raw material spec mutations on orders already in `IN_PRODUCTION` status.
5. **SEQUENTIAL EXECUTION:** Execute and verify tasks strictly in sequential order.
