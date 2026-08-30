# Task 25: Master Backend Unification & PostgreSQL Order Persistence (Phase 1 / 2)

## 1. Execution Directives & AI Configuration
* **AI Role:** Principal Backend & Database Infrastructure Engineer
* **Anti-Gravity Model Tier:** `gemini-3.7-thinking`
* **Thinking Budget / Effort Level:** `High` *(High-risk database transaction refactoring, concurrency locking, and server architecture consolidation)*
* **Token Optimization Strategy:** Concentrate edits on `cmd/server/main.go`, `server/handler/order_handler.go`, and `admin-system/backend/main.go`; verify with unit tests.

> **CRITICAL LOCALIZATION REQUIREMENT:** All API response error messages and notification dispatch payloads MUST support standard **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Objective & Detailed Scope
Unify the fragmented Go backend server entrypoints into a single, high-performance master server. Eliminate memory-only order storage in `server/handler/order_handler.go` by ensuring 100% of created orders, line items, and proof revisions are persisted transactionally to PostgreSQL with zero data loss on server restart.

---

## 3. Phase-by-Phase Implementation Plan

### Phase A — Root Server Consolidation & Architecture Unification
* **Problem:** There are conflicting Go entrypoints (`cmd/server/main.go` vs `admin-system/backend/main.go`). `cmd/server/main.go` only registers partial handlers, leading to split endpoints.
* **Execution Steps:**
  1. Standardize `admin-system/backend/main.go` as the primary, authoritative API server.
  2. Update `cmd/server/main.go` and root `main.go` to import and mount the complete route tree (Catalog, Orders, Preflight, Finance, Customers, Pricing, Inventory, Inbound, Suppliers, HR, Settings).
  3. Unify CORS middleware: Support credentials, custom headers (`Authorization`, `Content-Type`, `X-CSRF-Token`, `Idempotency-Key`), and methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`).

---

### Phase B — Transactional PostgreSQL Order Persistence in `server/handler/order_handler.go`
* **Problem:** `HandleCreateOrder` currently calls `h.SaveOrder(order)` which only appends to `orderStore` in-memory map. If PostgreSQL DB is connected, it never inserts into `orders` or `order_items` tables!
* **Execution Steps:**
  1. In `server/handler/order_handler.go`:
     - Refactor `HandleCreateOrder` to execute inside a database transaction (`tx`):
       ```go
       tx, err := h.db.BeginTx(c.Request.Context(), nil)
       // 1. Check / auto-create customer in customers table
       // 2. Insert into orders table with status, total_amount_lak, deposit_lak, remaining_lak
       // 3. Insert all line items into order_items table with specs jsonb
       // 4. Commit transaction
       ```
     - Maintain in-memory `orderStore` strictly as a fast read-through cache or SSE broadcast buffer, NOT the sole storage.
  2. Implement database fallback for `findOrderByCode` to ensure complete consistency.

---

### Phase C — Idempotency Key & Concurrency Control
* **Problem:** Rapid double-clicks during customer checkout or slip upload can create duplicate orders or double-deduct inventory.
* **Execution Steps:**
  1. Check `idempotency_key` in `orders` table before insertion. If key exists, return the existing order record immediately with `200 OK`.
  2. Wrap slip verification in `HandleVerifySlip` with database uniqueness constraint on `trans_ref` in `bank_transaction_logs`.

---

### Phase D — Unified Configuration & Health Check
* **Execution Steps:**
  1. Load environment variables: `PORT` (default 8080), `DATABASE_URL` / `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `UPLOAD_DIR`.
  2. Add database connectivity status to `/api/health` and `/health` (`{"status": "healthy", "database": "connected"}`).

---

## 4. Target Files by Layer

### Layer 1: Go Server Entrypoints
* **[MODIFY]** `cmd/server/main.go` — Mount full route registry from master backend
* **[MODIFY]** `admin-system/backend/main.go` — Master route registry and middleware unification
* **[MODIFY]** `backend/cmd/server/main.go` — Align with master server

### Layer 2: Handlers & Services
* **[MODIFY]** `server/handler/order_handler.go` — Implement transactional PostgreSQL `INSERT` for orders & items
* **[MODIFY]** `admin-system/backend/orders/handlers.go` — Ensure transaction safety and idempotency guard
* **[MODIFY]** `backend/internal/repository/order_repository.go` — PostgreSQL repository CRUD

---

## 5. Universal Guardrails
1. **ZERO IN-MEMORY DATA LOSS:** Every order created via API MUST be written to PostgreSQL before sending HTTP 201 Created.
2. **SECURITY & COST MASKING:** The public tracking endpoint `GET /api/v1/orders/track/:code` MUST strictly mask internal production costs (`unit_cost_lak`, `total_cost`, `markup_margin`).
3. **NO TEXT EMOJIS:** All system log outputs and error responses must be plain technical text.

---

## 6. Acceptance Criteria
- [ ] Starting the Go backend on port 8080 mounts all endpoints without route conflicts.
- [ ] Submitting an order via `POST /api/orders` or `POST /api/v1/orders` inserts rows into `orders` and `order_items` tables in PostgreSQL.
- [ ] Restarting the Go server does NOT cause previously created orders to disappear from tracking or Admin list.
- [ ] `GET /api/v1/orders/track/:code` returns public order details with internal costs properly masked.
- [ ] All unit tests in `server/handler/order_handler_test.go` and `admin-system/backend/` pass.
