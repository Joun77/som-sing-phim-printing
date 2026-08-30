# Som Sing Phim - Master Development Roadmap (.agents/tasks)

Enterprise-grade development roadmap for Som Sing Phim Print House ERP (`admin-system`), Customer Storefront (`customer-service`), and Go Backend Services (`backend`).

---

## Active Task Index (Tasks 24 – 30)

| Task File | Task Title & Scope | Recommended Model & Effort | Target Layer | Status |
| :--- | :--- | :--- | :--- | :---: |
| [task-24-customer-crm-end-to-end-pipeline.md](file:///.agents/tasks/task-24-customer-crm-end-to-end-pipeline.md) | **Task 24: Customer Data & CRM End-to-End Pipeline Integration**<br>Migration 023 (Socials/Address), Go customer CRUD & Delete API, storefront customer auto-creation, and Admin CRM full DB linking. | `gemini-3.7-thinking`<br>**(Effort: High)** | Admin / CS / Backend | ⏳ Ready |
| [task-25-master-backend-unification-and-persistence.md](file:///.agents/tasks/task-25-master-backend-unification-and-persistence.md) | **Task 25: Master Backend Unification & PostgreSQL Order Persistence**<br>Deprecate fragmented memory stores, consolidate Go server routes into a single master API, and ensure 100% DB persistence. | `gemini-3.7-thinking`<br>**(Effort: High)** | Go Backend / DB | ⏳ Ready |
| [task-26-admin-erp-quotations-spoilage-tracking-persistence.md](file:///.agents/tasks/task-26-admin-erp-quotations-spoilage-tracking-persistence.md) | **Task 26: Admin ERP Quotations, Spoilage & Tracking Database Persistence**<br>Eliminate localStorage state traps for Quotation updates/conversions, Spoilage logs, and Logistics tracking. Purge hardcoded URLs. | `gemini-3.7`<br>**(Effort: Medium)** | Admin ERP / Backend | ⏳ Ready |
| [task-27-shop-floor-technician-incentives-and-dispatch-db.md](file:///.agents/tasks/task-27-shop-floor-technician-incentives-and-dispatch-db.md) | **Task 27: Shop Floor Operations, Technician Incentives & Dispatch Database Integration**<br>Migration 024 for `technician_earnings`, `machine_downtime_logs`, `delivery_dispatches` and backend CRUD integration. | `gemini-3.6`<br>**(Effort: Medium)** | Admin ERP / Backend | ⏳ Ready |
| [task-28-customer-service-direct-tracking-and-sse-sync.md](file:///.agents/tasks/task-28-customer-service-direct-tracking-and-sse-sync.md) | **Task 28: Customer Service Direct Order Tracking & Real-Time SSE Live Synchronization**<br>Replace full-order table scans with direct `/api/v1/orders/track/:code` endpoint and connect live Server-Sent Events stream. | `gemini-3.6`<br>**(Effort: Medium)** | Customer Service | ⏳ Ready |
| [task-29-customer-service-member-portal-and-address-book.md](file:///.agents/tasks/task-29-customer-service-member-portal-and-address-book.md) | **Task 29: Customer Service Member Portal & Saved Address Book**<br>Lightweight customer phone session, saved Lao address book (Province/District/Village/Branch), and personal order history. | `gemini-3.5`<br>**(Effort: Medium)** | Customer Service / Backend | ⏳ Ready |
| [task-30-end-to-end-cross-system-integration-qa.md](file:///.agents/tasks/task-30-end-to-end-cross-system-integration-qa.md) | **Task 30: End-to-End Cross-System Integration QA & Zero-Regression Verification**<br>Comprehensive verification across all 3 phases (Storefront ➔ CRM ➔ Prepress ➔ Production ➔ Dispatch ➔ Invoice). | `gemini-3.1-pro` / `3.5`<br>**(Effort: Low)** | Full System | ⏳ Ready |

---

## Anti-Gravity Model & Token Optimization Guidelines

To optimize token efficiency while maintaining enterprise code quality:
1. **High Complexity Tasks (Tasks 24, 25):** Use `gemini-3.7-thinking` with **High** effort level for database transactions, schema migrations, and cross-boundary identity linking.
2. **Medium Complexity Tasks (Tasks 26, 27, 28):** Use `gemini-3.7` or `gemini-3.6` with **Medium** effort level for REST API handler wiring and frontend state refactoring.
3. **UI / Component Tasks (Task 29):** Use `gemini-3.5` with **Medium/Low** effort level for standard UI forms, address books, and drawer components.
4. **QA & Build Verification (Task 30):** Use `gemini-3.1-pro` or `gemini-3.5` with **Low** effort level for running test suites and checking assertions.

---

## Universal Guardrails for AI Execution

1. **NO TEXT EMOJIS:** Never insert text emojis in code or UI; use `lucide-react` icons exclusively.
2. **LAO LANGUAGE PRIMARY UI:** All client-facing text, labels, badges, and notifications MUST render in standard **Lao language** (`lo` / ພາສາລາວ) with proper technical printing terminology.
3. **STRICT SCOPE ISOLATION:** Keep modifications isolated to the designated module without unintended regressions.
4. **SEQUENTIAL EXECUTION:** Execute and verify tasks in sequential order (Task 24 ➔ Task 30).
