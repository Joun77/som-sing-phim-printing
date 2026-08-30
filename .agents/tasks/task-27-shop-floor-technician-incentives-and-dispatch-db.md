# Task 27: Shop Floor Operations, Technician Incentives & Dispatch Database Integration (Phase 2)

## 1. Execution Directives & AI Configuration
* **AI Role:** Industrial Print Operations & Data Architect
* **Anti-Gravity Model Tier:** `gemini-3.6`
* **Thinking Budget / Effort Level:** `Medium` *(Schema definition, Go CRUD handlers, and frontend state synchronization for shop floor operations)*
* **Token Optimization Strategy:** Isolate modifications to shop floor operations, HR piece-rate, and dispatch tracking without bloating context.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing tables, technician earning badges, downtime logs, and dispatch statuses MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Objective & Detailed Scope
Move the remaining shop floor operational records (Technician Piece-Rate Incentives `earningRecords`, Machine Status & Downtime Logs `downtimeLogs`, and Dispatch Delivery Logs `deliveries`) from `localStorage` into PostgreSQL with dedicated tables, Go backend REST APIs, and UI wiring.

---

## 3. Phase-by-Phase Implementation Plan

### Phase A — Database Migration for Shop Floor Operations (`migrations/024_shop_floor_and_incentives.sql`)
* **Problem:** There are no PostgreSQL tables for technician earnings, machine downtime, or dispatch logs.
* **Execution Steps:**
  1. Create `admin-system/migrations/024_shop_floor_and_incentives.sql`:
     ```sql
     -- 1. Technician Piece-Rate Earning Records
     CREATE TABLE IF NOT EXISTS technician_earnings (
         id VARCHAR(100) PRIMARY KEY,
         employee_id VARCHAR(100) NOT NULL,
         employee_name VARCHAR(255) NOT NULL,
         order_id VARCHAR(100) NOT NULL,
         order_number VARCHAR(100),
         customer_name VARCHAR(255),
         step_id VARCHAR(100) NOT NULL,
         step_name VARCHAR(255) NOT NULL,
         impressions INT DEFAULT 0,
         rate_per_impression NUMERIC(10, 2) DEFAULT 0,
         earned_amount_lak NUMERIC(15, 2) NOT NULL,
         recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     );
     CREATE INDEX IF NOT EXISTS idx_tech_earnings_emp ON technician_earnings(employee_id);
     CREATE INDEX IF NOT EXISTS idx_tech_earnings_order ON technician_earnings(order_id);

     -- 2. Machine Downtime & Maintenance Logs
     CREATE TABLE IF NOT EXISTS machine_downtime_logs (
         id VARCHAR(100) PRIMARY KEY,
         machine_id VARCHAR(100) NOT NULL,
         machine_name VARCHAR(255) NOT NULL,
         status VARCHAR(50) NOT NULL, -- 'DOWNTIME', 'MAINTENANCE', 'SETUP'
         reason TEXT,
         technician_id VARCHAR(100),
         start_time TIMESTAMP WITH TIME ZONE NOT NULL,
         end_time TIMESTAMP WITH TIME ZONE,
         duration_minutes INT DEFAULT 0,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     );

     -- 3. Delivery & Dispatch Tracking
     CREATE TABLE IF NOT EXISTS delivery_dispatches (
         id VARCHAR(100) PRIMARY KEY,
         order_id VARCHAR(100) NOT NULL,
         order_number VARCHAR(100),
         customer_name VARCHAR(255),
         courier_id VARCHAR(100) NOT NULL,
         courier_name VARCHAR(255) NOT NULL,
         tracking_code VARCHAR(100),
         shipping_fee_lak NUMERIC(15, 2) DEFAULT 0,
         status VARCHAR(50) DEFAULT 'PENDING_PICKUP', -- 'PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED'
         dispatched_at TIMESTAMP WITH TIME ZONE,
         delivered_at TIMESTAMP WITH TIME ZONE,
         driver_phone VARCHAR(100),
         pod_image_url TEXT,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     );
     ```

---

### Phase B — Go Backend Handlers & API Routes
* **Execution Steps:**
  1. In `admin-system/backend/hr/`:
     - Add `HandleGetTechnicianEarnings(c *gin.Context)` (support `?employee_id=` filter).
     - Add `HandleCreateTechnicianEarning(c *gin.Context)`.
  2. In `admin-system/backend/inventory/` / `production/`:
     - Add `HandleGetDowntimeLogs(c *gin.Context)` and `HandleCreateDowntimeLog(c *gin.Context)`.
  3. In `admin-system/backend/orders/`:
     - Add `HandleGetDeliveries(c *gin.Context)` and `HandleUpdateDelivery(c *gin.Context)`.
  4. Register routes in `admin-system/backend/main.go`:
     - `GET /api/v1/hr/earnings` & `POST /api/v1/hr/earnings`
     - `GET /api/v1/production/downtime` & `POST /api/v1/production/downtime`
     - `GET /api/v1/orders/deliveries` & `PUT /api/v1/orders/deliveries/:id`

---

### Phase C — Admin Frontend Integration (`AppContext.tsx` & Feature Pages)
* **Execution Steps:**
  1. In `AppContext.tsx`:
     - `addEarningRecord`: Send `POST /api/v1/hr/earnings`.
     - `updateDelivery`: Send `PUT /api/v1/orders/deliveries/:id`.
     - Load initial state for earnings, downtime logs, and deliveries from backend endpoints on mount.
  2. In `EmployeeManagement.tsx`: Display real persisted earnings and impressions produced per technician.
  3. In `OrderDeliveryPage.tsx`: Reflect database-backed dispatch and courier tracking status.

---

## 4. Target Files by Layer

### Layer 1: Database Migrations
* **[NEW]** `admin-system/migrations/024_shop_floor_and_incentives.sql`

### Layer 2: Go Backend
* **[MODIFY]** `admin-system/backend/hr/employees.go` — Add technician earnings CRUD
* **[MODIFY]** `admin-system/backend/orders/handlers.go` — Add dispatch delivery endpoints
* **[MODIFY]** `admin-system/backend/main.go` — Mount new shop floor routes

### Layer 3: Admin Frontend
* **[MODIFY]** `admin-system/frontend/src/store/AppContext.tsx` — Connect earnings & dispatch APIs
* **[MODIFY]** `admin-system/frontend/src/features/hr/components/EmployeeManagement.tsx` — Render live technician piece-rate logs
* **[MODIFY]** `admin-system/frontend/src/features/orders/components/OrderDeliveryPage.tsx` — Live dispatch tracking

---

## 5. Universal Guardrails
1. **CONCURRENCY & AUDIT INTEGRITY:** Earning records must record the exact `order_id` and cannot be mutated once locked by accounting.
2. **NO TEXT EMOJIS:** Use Lucide icons exclusively.
3. **LAO PRIMARY UI:** All technician roles (`ຊ່າງພິມ`, `ຊ່າງຕັດເຈ້ຍ`, `ຊ่างເຂົ້າເລ່ມ`) and status tags must render in standard Lao.

---

## 6. Acceptance Criteria
- [ ] Running migration `024_shop_floor_and_incentives.sql` creates all three tables without syntax errors.
- [ ] Completing a production step in Admin automatically records piece-rate earnings in PostgreSQL.
- [ ] Dispatching an order records a delivery entry in `delivery_dispatches` table.
- [ ] Reloading the browser preserves all technician earnings and dispatch statuses from the database.
- [ ] `tsc --noEmit` and `npm run build` pass with 0 errors.
