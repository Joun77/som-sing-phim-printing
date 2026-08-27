# PHASE 6 — Supplier Management & Purchase Orders
**สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed) | **Priority:** Medium | **ต้องทำหลัง Phase 2**

---

## 🤖 Role ของ AI

คุณคือ **Procurement Systems Developer + Full-stack Engineer** ที่เชี่ยวชาญ:
- Procurement workflow: Supplier → PO → Goods Receipt → AP
- Go backend: CRUD handlers, PDF generation, PostgreSQL
- React TypeScript: Data tables, multi-step forms, status workflows
- Integration กับ Inbound และ AP module ที่มีอยู่แล้ว

---

## ข้อห้ามเด็ดขาด

- ❌ ห้ามส่งโค้ดทั้งไฟล์ — ส่งเฉพาะส่วนที่เพิ่ม/แก้
- ❌ ห้ามแก้ไข Inbound logic ที่ผ่านมา — ต่อยอดเท่านั้น
- ❌ ห้ามสร้าง ERP-level complexity (Double-entry PO accounting) — SME level พอ
- ❌ ห้ามเพิ่ม feature นอก scope
- ❌ ห้ามใช้ float64 สำหรับเงิน

---

## TASK 6.1 — Database Migration: Supplier & PO Tables

**ไฟล์สร้างใหม่:** `admin-system/backend/migrations/000013_create_supplier_po_tables.up.sql`

**Acceptance Criteria:**
- [x] Migration สำเร็จ
- [x] `purchase_order_lines.total_price` คำนวณ auto (Generated Column)
- [x] `accounts_payable` รองรับ supplier_id แล้ว

---

## TASK 6.2 — Supplier Backend Module

**ไฟล์สร้างใหม่:** `admin-system/backend/suppliers/`
- `handlers.go`
- `models.go`
- `po_service.go`

**Acceptance Criteria:**
- [x] สร้าง PO → สามารถ export PDF ได้
- [x] รับของ → Inbound สร้างอัตโนมัติ + AP สร้างอัตโนมัติ
- [x] Partial receive → PO status = PARTIAL_RECEIVED

---

## TASK 6.3 — PO PDF Export

**ไฟล์สร้างใหม่:** `admin-system/backend/suppliers/pdf.go`

**Acceptance Criteria:**
- [x] PDF แสดงข้อมูลถูกต้องทุกฟิลด์
- [x] รองรับ Lao font (ใช้ font เดียวกับ quotation PDF)

---

## TASK 6.4 — Supplier Frontend Pages

**ไฟล์สร้างใหม่:** `admin-system/frontend/src/features/suppliers/`
1. `SupplierListPage.tsx`
2. `SupplierFormModal.tsx`
3. `POListPage.tsx`
4. `CreatePOModal.tsx`
5. `GoodsReceiptModal.tsx`
6. `SupplierPriceCompare.tsx`

**Acceptance Criteria:**
- [x] สร้าง Supplier → ปรากฏในรายการทันที (queryClient.invalidateQueries)
- [x] สร้าง PO → Export PDF ได้
- [x] บันทึกรับของ → Inbound ปรากฏในหน้า Inventory ทันที

---

## TASK 6.5 — Register Routes + App Integration

**ไฟล์แก้:**
- `admin-system/backend/main.go`
- `admin-system/frontend/src/App.tsx`
- `admin-system/frontend/src/components/Navbar.tsx`

---

## ลำดับการ Assign งาน (แยก Session)

| Session | Task | ขึ้นอยู่กับ |
|---|---|---|
| Session A | TASK 6.1 DB Migration | Phase 2 เสร็จ (AP table ต้องมีก่อน) |
| Session B | TASK 6.2 Supplier Backend Module | 6.1 เสร็จ |
| Session C | TASK 6.3 PO PDF Export | 6.2 เสร็จ |
| Session D | TASK 6.4 Frontend — SupplierListPage + SupplierFormModal | 6.2 เสร็จ |
| Session E | TASK 6.4 Frontend — POListPage + CreatePOModal | Session D เสร็จ |
| Session F | TASK 6.4 Frontend — GoodsReceiptModal + PriceCompare | Session E เสร็จ |
| Session G | TASK 6.5 Register Routes + App Integration | ทุก Task เสร็จ |
