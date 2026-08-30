# Task 24: Customer Data & CRM End-to-End Pipeline Integration (Phase 1)

## 1. Execution Directives & AI Configuration
* **AI Role:** Senior CRM & Database Systems Architect
* **Anti-Gravity Model Tier:** `gemini-3.7-thinking`
* **Thinking Budget / Effort Level:** `High` *(Critical database schema migration, multi-tenant CRM pipeline, and cross-system customer identity resolution)*
* **Token Optimization Strategy:** Strict code scoping; do not rewrite unrelated files; focus on database schema, Go customer handlers, and React CRM data hooks.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing labels, table headers, form inputs, badges, and notification messages MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ) using technical print shop terminology.

---

## 2. Objective & Detailed Scope
Bridge the customer data gap between the Customer Service storefront (`customer-service`) and the Admin ERP (`admin-system/frontend/src/features/customers/`). Ensure every customer who places an order or is manually registered is persisted with full contact channels (Phone, Social Media, Lao Address hierarchy) to PostgreSQL, and can be searched, viewed with full order history, edited, and deleted.

---

## 3. Phase-by-Phase Implementation Plan

### Phase A — Database Migration for CRM & Social Channels (`migrations/023_customer_crm_enhancements.sql`)
* **Problem:** Table `customers` lacks social media channels (`instagram`, `line_id`, `facebook`, `whatsapp`), Lao address structure (`province`, `district`, `village`, `branch_code`), tax ID, and notes.
* **Execution Steps:**
  1. Create `admin-system/migrations/023_customer_crm_enhancements.sql`:
     ```sql
     ALTER TABLE customers 
       ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
       ADD COLUMN IF NOT EXISTS line_id VARCHAR(100),
       ADD COLUMN IF NOT EXISTS facebook VARCHAR(255),
       ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(100),
       ADD COLUMN IF NOT EXISTS province VARCHAR(100),
       ADD COLUMN IF NOT EXISTS district VARCHAR(100),
       ADD COLUMN IF NOT EXISTS village VARCHAR(255),
       ADD COLUMN IF NOT EXISTS branch_code VARCHAR(100),
       ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
       ADD COLUMN IF NOT EXISTS notes TEXT,
       ADD COLUMN IF NOT EXISTS total_spent_lak NUMERIC(15, 2) DEFAULT 0,
       ADD COLUMN IF NOT EXISTS total_orders_count INT DEFAULT 0;

     CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
     CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
     ```
  2. Add foreign key index on `orders.customer_id` referencing `customers.id`.

---

### Phase B — Go Backend Customer Handlers & Full CRUD (`admin-system/backend/customers/`)
* **Problem:** Missing `DELETE /api/customers/:id`, missing customer order history endpoint, and struct doesn't include social fields.
* **Execution Steps:**
  1. Update Go struct `Customer` in `admin-system/backend/customers/customers.go`:
     - Add fields: `Instagram`, `LineID`, `Facebook`, `WhatsApp`, `Province`, `District`, `Village`, `BranchCode`, `TaxID`, `Notes`, `TotalSpentLAK`, `TotalOrdersCount`.
  2. Implement `HandleDeleteCustomer(c *gin.Context)`:
     - Execute `DELETE FROM customers WHERE id = $1`.
  3. Implement `HandleGetCustomerOrders(c *gin.Context)`:
     - Query all orders belonging to customer: `SELECT ... FROM orders WHERE customer_id = $1 OR customer_phone = $2 ORDER BY created_at DESC`.
  4. Register routes in `admin-system/backend/main.go`:
     - `GET /api/customers`
     - `GET /api/customers/:id`
     - `GET /api/customers/:id/orders`
     - `POST /api/customers`
     - `PUT /api/customers/:id`
     - `DELETE /api/customers/:id`

---

### Phase C — Auto-Create / Link Customer upon Storefront Checkout
* **Problem:** When an online order is placed via `customer-service`, customer data is not stored in CRM table `customers`.
* **Execution Steps:**
  1. In `admin-system/backend/orders/handlers.go` (`saveOrderToDB` / `HandleCreateOrder`):
     - Check if customer with `req.CustomerPhone` or `req.CustomerEmail` already exists in `customers`.
     - If exists ➔ Link `order.CustomerID = existing.ID`.
     - If not exists ➔ Automatically insert a new row in `customers` with:
       `id = fmt.Sprintf("cust-%d", time.Now().Unix())`, `name = req.CustomerName`, `phone = req.CustomerPhone`, `address = req.Address`, `province`, `district`, `village`.
     - Increment `total_orders_count` and `total_spent_lak` for the customer.

---

### Phase D — Admin CRM UI Refactoring & Full DB Linking (`CustomerManagement.tsx`)
* **Problem:** Hardcoded `http://localhost:8080`, `deleteCustomer` only deletes from local React state, order stats calculated via brittle string matching.
* **Execution Steps:**
  1. Remove hardcoded URLs; use relative `/api/customers` or environment base URL.
  2. Wire `deleteCustomer` to call `DELETE /api/customers/${customerId}` with error handling and toast alert.
  3. In customer detail sub-view: Fetch real orders using `GET /api/customers/${customerId}/orders` rather than filtering local state.
  4. Form modal: Ensure all fields (Instagram, Line, Facebook, Address, Credit Limit, Payment Terms, Notes) serialize cleanly.

---

## 4. Target Files by Layer

### Layer 1: Database & Migrations
* **[NEW]** `admin-system/migrations/023_customer_crm_enhancements.sql`

### Layer 2: Go Backend
* **[MODIFY]** `admin-system/backend/customers/customers.go` — Update struct, add Delete and Customer Orders handler
* **[MODIFY]** `admin-system/backend/main.go` — Register `DELETE /api/customers/:id` and `GET /api/customers/:id/orders`
* **[MODIFY]** `admin-system/backend/orders/handlers.go` — Add customer auto-creation & ID linking in `saveOrderToDB`

### Layer 3: Admin Frontend ERP
* **[MODIFY]** `admin-system/frontend/src/features/customers/components/CustomerManagement.tsx` — Full DB linking, delete API, and order history
* **[MODIFY]** `admin-system/frontend/src/store/AppContext.tsx` — Replace hardcoded fetch URLs and connect `deleteCustomer` API

---

## 5. Universal Guardrails
1. **NO EMOJIS:** Never insert text emojis (`👤`, `📞`, `🌐`, `⚠️`, `❌`); use `lucide-react` icons exclusively.
2. **LAO LANGUAGE PRIMARY UI:** All CRM labels (`ຊື່ລູກຄ້າ`, `ເບີໂທ`, `ທີ່ຢູ່ຈັດສົ່ງ`, `ວົງເງິນສິນເຊື່ອ`, `ປະຫວັດການສັ່ງຊື້`) must render in standard Lao.
3. **IDEMPOTENCY & TRANSACTION SAFETY:** Customer auto-linking during order placement must run inside the database transaction (`tx`).

---

## 6. Acceptance Criteria
- [ ] Running migration `023_customer_crm_enhancements.sql` adds social and address columns successfully.
- [ ] Admin CRM list loads directly from PostgreSQL via `GET /api/customers`.
- [ ] Deleting a customer in Admin calls `DELETE /api/customers/:id` and removes the row from the database.
- [ ] Placing an order in Customer Service automatically creates or links a customer profile in the CRM.
- [ ] Customer Detail sub-view shows genuine order history and financial stats from PostgreSQL.
- [ ] `tsc --noEmit` and `go test ./...` pass with 0 errors.
