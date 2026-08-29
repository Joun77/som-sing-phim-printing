# Task 19: Smart Inventory Auto-Restocking & Predictive Machinery Maintenance

## 1. AI Role & Mission
* **Role:** Senior Industrial Print ERP Engineer & Maintenance Systems Specialist
* **Mission:** Develop an automated raw material replenishment engine (Smart Reorder & Auto-PO Generation) driven by actual consumption velocity, implement paper scrap reclaim logic (Offcut Reuse), and build an equipment lifecycle wear-tracker (Predictive Maintenance & Meter Tracking per Migration 016).

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing alerts, table headers, maintenance badges, and modal dialogs rendered in the UI MUST strictly remain in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Smart Reorder Point & Auto-PO Draft Generation
* **Workflow:**
  1. Whenever raw materials are deducted (`stock_quantity` decreases):
     - System evaluates: `stock_quantity <= min_stock_alert` (or `reorderPoint`).
     - Calculates the 30-day consumption velocity (Average Daily Usage).
     - Computes the optimal reorder batch size: $	ext{Reorder Qty} = (	ext{Daily Usage} 	imes 	ext{Lead Time Days}) + 	ext{Safety Stock}$.
  2. Automatically generates a **Draft Purchase Order (ຮ່າງໃບສັ່ງຊື້)** in `features/suppliers/POListPage.tsx`:
     - Selects the lowest-cost supplier from `SupplierPriceCompare.tsx`.
     - Displays an amber banner in Admin: `⚠ ສະຕັອກໃກ້ໝົດ — ສ້າງຮ່າງ PO ແລ້ວ` with button `[ກວດສອບ & ສົ່ງ PO]`.

---

### Phase B — Offcut Scrap Reclaim & Smart Job Matching
* **Workflow:**
  1. When cutting parent sheets in `PaperCuttingTicketCard.tsx`:
     - Computes leftover scrap dimensions (Offcut W×H mm). If size $\ge$ A6 (105×148mm), register into offcut inventory (`OffcutsTab.tsx`).
  2. When configuring orders in `EditOrderModal.tsx`:
     - If job dimensions fit available offcuts in stock, display a smart suggestion banner:
       *\"💡 ມີເສດເຈ້ຍ Art Card 260g (A5) ພ້ອມໃຊ້ 120 ແຜ່ນ — ປະຢັດຕົ້ນທຶນ 45,000 LAK\"*
     - If accepted, deduct quantity from `offcut_inventory` instead of parent sheets.

---

### Phase C — Predictive Maintenance & Component Wear Tracking (Migration 016)
* **Workflow:**
  1. During each print and cutting job run:
     - Increment `current_meter = current_meter + job_impressions` in `equipment` and `equipment_specs` tables.
     - Track wear percentages for critical components:
       * **Digital Press:** Drum Unit Black (90%), Drum Unit Color (90%), Fuser Unit (90%), Transfer Belt (85%).
       * **Guillotine Cutter:** High-Speed Steel Blade (95% or 10,000 cuts), Hydraulic Oil Pressure.
       * **Perfect Glue Binder:** Milling Cutter, Glue Tank Temperature SLA.
  2. When any component exceeds 90% wear lifespan:
     - Automatically open a `Maintenance Ticket` (Migration 016: `status = 'OPEN'`).
     - Render warning alert in Machinery Management:
       *\"⚠ Drum Unit Color ໃກ້ຮອດກຳນົດປ່ຽນ (92% / 138,000 ແຜ່ນ) — ກະລຸນາສັ່ງອາໄຫຼ່\"*
     - Reset meter upon clicking `[✓ ບຳລຸງຮັກສາສຳເລັດ]`.

---

## 3. Target Files by Layer

### Level 1: Frontend Admin ERP (`admin-system/frontend/`)
* **[MODIFY]** `src/features/suppliers/POListPage.tsx` & `CreatePOModal.tsx` — Auto-PO draft generation
* **[MODIFY]** `src/features/inventory/components/OffcutsTab.tsx` — Offcut stock reclaim & modal
* **[MODIFY]** `src/features/orders/components/modals/EditOrderModal.tsx` — Smart offcut suggestion banner
* **[MODIFY]** `src/features/equipment/` (or `MachineryPage.tsx`) — Component health meters & maintenance tickets

### Level 2: Go Backend Layer (`backend/` & `admin-system/backend/`)
* **[MODIFY]** `backend/internal/service/inventory_service.go` — Safety stock velocity & auto-PO generator
* **[MODIFY]** `backend/internal/domain/material.go` & `inbound.go` — Offcut & reorder point data contract
* **[VERIFY]** `admin-system/migrations/016_predictive_maintenance.sql` & `020_inventory_inbound_fix.sql`

---

## 4. Universal Guardrails
1. **STOCK ISOLATION:** Offcut deductions must deduct from `offcut_inventory` without corrupting master parent sheet counts.
2. **MAINTENANCE AUDIT TRAIL:** Every meter reset must record the technician name, date, and part cost in `maintenance_tickets`.
3. **NO TEXT EMOJIS:** Use Lucide icons exclusively.
4. **LAO PRIMARY UI:** All client-facing text must be standard Lao technical printing terms.

---

## 5. Acceptance Criteria
- [ ] Dropping stock below Reorder Point automatically drafts a PO to the best-priced supplier.
- [ ] Matching print jobs display smart offcut suggestion badges and deduct offcut stock correctly.
- [ ] Equipment screen displays health meter progress bars for Drum, Fuser, and Cutting Blades.
- [ ] Reaching 90% wear threshold automatically triggers an open maintenance ticket.
- [ ] `npm run build` and `go test ./...` pass with 100% success.
