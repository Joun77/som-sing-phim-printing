---
trigger: manual
---

# 🚀 Implementation Plan: Full-Stack Persistence & Dynamic Technical Specs Architecture

## 📌 Executive Summary
This implementation plan addresses the lack of real Database persistence in the backend (Go services currently return mock data) and fixes UI/UX issues in the frontend (empty Technical Specs Drawer, incorrect Edit modal triggers, and unmapped JSON data).

---

## 🛠️ Phase 1: Database Setup & Backend Integration (Go Services)

### Goal: Connect Go Backend to a Real PostgreSQL Database & Implement Persistence.

### Tasks:
1. **Database Connection Pool (`backend/db/db.go`)**
   - Install PostgreSQL driver (`pgx` or `gorm` / `sqlx`).
   - Create a singleton connection pool and initialize it in `backend/main.go`.

2. **Run Migrations (Based on `.agents/rules/Master_Printer_Ink_Paper_Quotation_Spec.md`)**
   - Create Table `printers`:
     - Columns: `id` (PK), `name`, `serial_number`, `brand`, `model`, `category`, `price`, `currency`, `location`, `status`, `expected_life_a4_pages`, `maintenance_rate_percent`, `warranty_expiration_year`, `components` (JSONB), `technical_specs` (JSONB).
   - Create Table `ink_master_catalog`, `paper_catalog`, `inbound_transactions`, `quotations`.

3. **Update Inventory Handlers (`backend/inventory/assets.go`)**
   - **`POST /api/v1/assets/inbound`**: Insert inbound procurement record AND upsert master asset technical specs into `printers` or corresponding asset table.
   - **`GET /api/v1/assets`**: Query all assets from the DB.
   - **`GET /api/v1/assets/:id`**: Query single asset and parse `components` & `technical_specs` JSONB fields.
   - **`PUT /api/v1/assets/:id`**: Update master asset specification data.

4. **Update Quotation / Pricing Engine (`backend/pricing/engine.go`)**
   - Connect pricing handlers to fetch real `baseConsumptionRateMlPerPage` from `printers` table and ink prices from `ink_master_catalog` to calculate exact cost-per-page.

---

## 🎨 Phase 2: Frontend Refactoring (React / Next.js)

### Goal: Separate Procurement Inbound Logic from Asset Master Editing and Render Dynamic Specs.

### Directory Structure:
```text
src/components/inventory/
├── modals/
│   ├── DynamicInboundModal.jsx      # Procurement & Inventory Restock
│   └── AssetEditModal.jsx           # Master Asset Data & Tech Specs Editing
├── forms/category-specs/
│   ├── PrinterSpecForm.jsx         # Inputs for Slot Position, Ink Code, Vol, Yield, Rate
│   ├── InkSpecForm.jsx
│   └── PaperSpecForm.jsx
└── details/category-specs/
    ├── PrinterSpecDetail.jsx       # Read-only UI Card for Slots, Base Rates & Wear Bars
    ├── InkSpecDetail.jsx
    └── GenericSpecDetail.jsx