# Master Implementation Plan: Inventory Inbound Correction, Stock Lifecycle & Ink Pricing Architecture

## 1. Directive for AI Agent
> **AI Execution Rule:**
> 1. Execute the phases sequentially (Phase 1 -> Phase 2 -> Phase 3 -> Phase 4).
> 2. Do not jump to the next phase until the current phase is fully implemented, syntax-checked, and verified.
> 3. Read only the specific target files listed in each phase to minimize token consumption.
> 4. Keep existing admin architecture guardrails intact and maintain Go Backend persistence standards.

---

## 2. Business Logic & System Design Agreements
1. **Dynamic Moving Average Cost:** คำนวณต้นทุนเฉลี่ยถ่วงน้ำหนักอัตโนมัติเมื่อรับเข้าสินค้า และอนุญาตให้แอดมินแก้ไขต้นทุนต่อหน่วย (`unit_cost`) ทับตรง ๆ ได้
2. **Inbound Reversal & Zero-Stock Retention:** เมื่อกดยกเลิกหรือลบบิลนำเข้า ให้หักยอดสต็อกคืนตามจำนวนบิล หากยอดคงเหลือเป็น `0` ให้คงข้อมูล Master Record ไว้ และปรับสถานะเป็น `OUT_OF_STOCK` พร้อมแสดง Badge แจ้งเตือน (ไม่ลบ Record จาก Database)
3. **Bottle-Level Stock vs. ML-Level Pricing:** 
   - คลังสินค้าตัดสต็อกน้ำหมึกเป็นหน่วย **"ขวด/ตลับ/ถุง"** เมื่อช่างเบิกเติมเครื่อง
   - ปริมาณ $ml$ และต้นทุนต่อ $ml$ (`cost_per_ml`) มีไว้สำหรับสูตรคำนวณราคาขายและประเมินต้นทุนต่อใบงาน (Pricing & Estimation Engine) ใน Go Backend เท่านั้น
4. **Single-Record Master Integrity:** แก้ไขปัญหารายการสต็อกงอกซ้ำซ้อน โดยแยกตาราง Master Stock (`materials`) ออกจากตารางประวัติการรับเข้า (`stock_inbound_records`)

---

## 3. Scoped Target Files (Token Saver Index)

backend/
├── migrations/000002_inventory_inbound_fix.sql
└── internal/
├── domain/
│   ├── material.go
│   ├── inbound.go
│   └── ink.go
├── repository/
│   ├── material_repository.go
│   └── inbound_repository.go
├── service/
│   └── inventory_service.go
└── handler/
└── inventory_handler.go

frontend/
└── src/features/inventory/
├── types/index.ts
├── api/inventoryApi.ts
└── components/
├── InboundFormModal.tsx
├── InboundHistoryTable.tsx
└── StockTable.tsx


---

## 4. Phase-by-Phase Execution

### Phase 1: Database Migration & Transactional Data Contracts
**Target Files:**
- `backend/migrations/000002_inventory_inbound_fix.sql`
- `backend/internal/domain/material.go`
- `backend/internal/domain/inbound.go`
- `backend/internal/domain/ink.go`
- `frontend/src/features/inventory/types/index.ts`

**Tasks:**
1. สร้างไฟล์ PostgreSQL Migration `000002_inventory_inbound_fix.sql`:
   - ปรับปรุงตาราง `materials`: เพิ่มฟิลด์ `is_active` (BOOLEAN DEFAULT TRUE), `min_stock_alert` (NUMERIC(14,4) DEFAULT 10), `stock_status` (VARCHAR(30) DEFAULT 'IN_STOCK')
   - สร้างตาราง `stock_inbound_records`: เก็บประวัติการรับเข้าสินค้า พร้อมคอลัมน์ `status` (`COMPLETED`, `CANCELLED`), `inbound_number`, `material_id`, `quantity_received`, `unit_purchase_price`, `received_by_user_id`, `cancelled_by_user_id`, `cancellation_reason`
   - สร้างตาราง `ink_bottle_inventory`: เก็บจำนวนสต็อกขวดหมึกสำหรับเบิกเติมเครื่องพิมพ์
2. อัปเดต Go Domain Structs ใน `material.go`, `inbound.go`, และ `ink.go` โดยใช้ `github.com/shopspring/decimal` สำหรับทศนิยมทั้งหมด
3. อัปเดต TypeScript Types ฝั่ง Frontend ให้ตรงกับ Schema Backend

---

### Phase 2: Go Backend Service Layer & Reversal Handlers
**Target Files:**
- `backend/internal/repository/material_repository.go`
- `backend/internal/repository/inbound_repository.go`
- `backend/internal/service/inventory_service.go`
- `backend/internal/handler/inventory_handler.go`

**Tasks:**
1. **Inbound Processing Service (`ProcessStockInbound`):**
   - ค้นหา Material เดิมผ่าน `material_id` หรือ `SKU`
   - คำนวณ Moving Average Cost: 
     $$\text{New Unit Cost} = \frac{(\text{Current Qty} \times \text{Current Cost}) + (\text{Incoming Qty} \times \text{Incoming Cost})}{\text{Current Qty} + \text{Incoming Qty}}$$
   - อัปเดตสต็อกและต้นทุนทับ Master Record เดิม และบันทึกประวัติลง `stock_inbound_records` ภายใต้ DB Transaction เดียวกัน
2. **Inbound Reversal Service (`CancelStockInbound`):**
   - ตรวจสอบยอดสต็อกคงเหลือ ต้องมีไม่น้อยกว่าจำนวนที่ขอยกเลิก
   - หักยอดสต็อกคืน `stock_quantity = stock_quantity - inbound.quantity_received`
   - หาก `stock_quantity <= 0` ให้ปรับ `stock_status = 'OUT_OF_STOCK'` โดยไม่ลบ Record ทิ้ง
   - ปรับสถานะบิลนำเข้าเป็น `CANCELLED` พร้อมบันทึกผู้ยกเลิกและเหตุผล
3. **Direct Update Handler (`UpdateMaterialDirect`):**
   - ให้สิทธิ์แอดมินแก้ไขข้อมูลสินค้า (ชื่อ, หน่วย, ต้นทุน, รายละเอียด) ผ่าน `PUT /api/v1/materials/:id` โดยไม่สร้าง Record ซ้ำ
4. **Ink Bottle Intake & Deduction Handler:**
   - Endpoint รับเข้าขวดหมึก และเบิกขวดหมึกเติมเครื่องพิมพ์

---

### Phase 3: Frontend Inbound UX & Stock Table Workflow
**Target Files:**
- `frontend/src/features/inventory/api/inventoryApi.ts`
- `frontend/src/features/inventory/components/InboundFormModal.tsx`
- `frontend/src/features/inventory/components/InboundHistoryTable.tsx`
- `frontend/src/features/inventory/components/StockTable.tsx`

**Tasks:**
1. **API Integration (`inventoryApi.ts`):**
   - เพิ่มฟังก์ชัน `createInbound`, `cancelInbound`, `updateMaterial`, `fetchInboundHistory`
2. **Inbound Form Modal (`InboundFormModal.tsx`):**
   - รองรับ 2 โหมด: 
     - **เติมสินค้าเดิม:** มี Auto-select/Dropdown รายชื่อสินค้าเดิม (ดึง `material_id` ให้อัตโนมัติ ไม่ต้องกรอก SKU)
     - **เพิ่มสินค้าใหม่:** ฟอร์มสร้าง Master SKU ใหม่สำหรับสินค้าที่ไม่เคยมีในระบบ
3. **Inbound History Table (`InboundHistoryTable.tsx`):**
   - แสดงประวัติการนำเข้าสินค้า พร้อมปุ่ม **"ยกเลิกบิลนำเข้า (Cancel/Rollback)"** มี Modal ยืนยันเหตุผล
4. **Stock Table Updates (`StockTable.tsx`):**
   - แสดง Badge สถานะ: `มีสินค้า (In Stock)`, `สินค้าใกล้หมด (Low Stock)`, `สินค้าหมด (Out of Stock)`
   - เพิ่มปุ่ม "แก้ไขข้อมูลสินค้า (Edit Material)" สำหรับแก้ไขชื่อ/ราคาโดยตรง

---

### Phase 4: Verification, Audit Trail & Pricing Engine Alignment
**Target Files:**
- `backend/internal/service/inventory_service.go`
- `frontend/src/features/inventory/components/StockTable.tsx`

**Tasks:**
1. ทดสอบ Flow การรับเข้าสินค้าซ้ำหลายรอบ: ยืนยันว่าหน้าคลังสินค้ามีเพียง 1 แถวต่อ 1 SKU เสมอ
2. ทดสอบ Flow การยกเลิกบิลนำเข้า: ตรวจสอบการลดลงของสต็อก และการเปลี่ยนสถานะเป็น `OUT_OF_STOCK` เมื่อยอดเป็น 0
3. ตรวจสอบการเชื่อมโยงราคาหมึก: ให้ Pricing Engine ฝั่ง Go Backend ดึงค่า `cost_per_ml` จากสเปกเครื่องพิมพ์และหมึกเทียบเคียงไปประเมินราคาใบงานได้อย่างแม่นยำ