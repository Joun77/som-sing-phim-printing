# PHASE 1 — Core Bug Fixes & Integrity
**สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed) | **Priority:** Critical

---

## 🤖 Role ของ AI

คุณคือ **Go Backend Engineer + React TypeScript Developer** ที่เชี่ยวชาญ:
- Go HTTP handlers (Gin framework), PostgreSQL, database transactions
- React Query (TanStack Query v5), TypeScript, data fetching patterns
- Decimal arithmetic สำหรับงานการเงิน (shopspring/decimal)
- Unit testing ใน Go

---

## ข้อห้ามเด็ดขาด

- ❌ ห้ามส่งโค้ดทั้งไฟล์กลับมา — ส่งเฉพาะ diff/ส่วนที่แก้เท่านั้น
- ❌ ห้ามเพิ่ม feature ใหม่ที่ไม่ได้อยู่ใน task นี้
- ❌ ห้ามแก้ไขไฟล์นอก scope ที่กำหนด
- ❌ ห้ามใช้ `float64` ในการคำนวณเงิน — ใช้ `shopspring/decimal` เสมอ
- ❌ ห้ามเขียนอธิบายทฤษฎี — ตอบเฉพาะโค้ดที่แก้ + Note 1-2 ประโยค

---

## TASK 1.1 — Fix Unit Cost Calculation (Paper & Ink)

**ปัญหา:** Warehouse แสดง `920 LAK/แผ่น` แต่จริงควรเป็น `184 LAK/แผ่น` (ผิด 5×)

**สูตรที่ถูกต้อง:**
```
Paper: unit_cost = total_cost / (pack_count × sheets_per_pack)
Ink:   unit_cost = total_cost / (bottle_count × ml_per_bottle)
```

**ไฟล์ที่ต้องแก้ (เรียงลำดับ):**
1. `admin-system/backend/internal/service/inventory_service.go`
   - ค้นหา logic คำนวณ `cost_per_consumption_unit` หรือ `unit_cost`
   - แก้สูตรให้หาร `total_cost` ด้วย `total_quantity` (ไม่ใช่ `sheets_per_pack` เพียงอย่างเดียว)
2. `admin-system/backend/internal/service/inventory_service_test.go`
   - เพิ่ม test: `460000 / (5 × 500) = 184 LAK/sheet`
3. `admin-system/frontend/src/features/inventory/components/StockTable.tsx`
   - ลบ client-side unit cost calculation ถ้ามี — ใช้ค่าจาก API แทน
4. `admin-system/frontend/src/features/inventory/components/details/` (ทุกไฟล์)
   - ตรวจสอบ display field ว่าอ่านจาก field ที่ถูกต้อง

**Acceptance Criteria:**
- [x] `go test ./internal/service/...` ผ่าน
- [x] Inbound กับ Warehouse แสดง unit cost ตรงกัน

---

## TASK 1.2 — Fix Cache Invalidation (Stale Table Data)

**ปัญหา:** หลัง Create/Update/Delete ตารางไม่ refresh อัตโนมัติ

**วิธีหาไฟล์ที่มีปัญหา:**
```bash
grep -r "useMutation" admin-system/frontend/src/features/ --include="*.tsx" -l
```

**ไฟล์ที่ต้องแก้:**
1. `features/inventory/components/InboundFormModal.tsx` → เพิ่ม `queryClient.invalidateQueries({ queryKey: ['inbound'] })` ใน `onSuccess`
2. `features/inventory/components/InventoryManagement.tsx` → เพิ่ม `['inventory']`
3. `features/equipment/` (ทุก mutation) → เพิ่ม `['equipment']`

**Query Keys มาตรฐาน:**
- Inbound: `['inbound']`
- Inventory: `['inventory']`, `['inventory-items']`
- Equipment: `['equipment']`

**Acceptance Criteria:**
- [x] เพิ่ม/แก้รายการ → ตารางอัปเดตทันทีโดยไม่ต้อง reload

---

## TASK 1.3 — Machine Cost Integration in Pricing Engine

**ปัญหา:** Quotation ไม่รวมค่าเสื่อม/บำรุงเครื่องพิมพ์

**สูตร:**
```
depreciation/sheet = price_cost / expected_life_a4_pages
maintenance/sheet  = depreciation × (maintenance_rate_percent / 100)
machine_cost/sheet = depreciation + maintenance
Guard: if expected_life_a4_pages <= 0 → return 0
```

**ไฟล์ที่ต้องแก้:**
1. `admin-system/backend/pricing/engine.go`
   - เพิ่ม `CalculateMachineOverhead()` function + เพิ่มเข้า cost breakdown
2. `admin-system/backend/pricing/engine_test.go`
   - Test: 50M LAK machine, 500K life pages, 20% maintenance → 120 LAK/sheet
   - Test boundary: life_pages=0 → return 0 (no panic)
3. `admin-system/backend/orders/models.go`
   - เพิ่ม `MachineOverheadLAK float64 \`json:"machine_overhead_lak"\``
4. `admin-system/frontend/src/features/pricing/components/`
   - เพิ่ม row "Machine Wear & Maintenance" ใน cost breakdown

**Acceptance Criteria:**
- [x] `go test ./pricing/...` ผ่านทุก case
- [x] Cost Breakdown มี 4 บรรทัด: Paper / Ink / Machine / Finishing

---

## TASK 1.4 — Verify Stock Deduction Atomicity

**งาน:** ตรวจสอบ `IN_PRODUCTION` handler ใน `orders/handlers.go`
ต้องมี `tx.Begin()` ครอบ: Paper deduction + Ink deduction + Spoilage log + `stock_deducted_at`

**Pattern ที่ต้องการ:**
```go
tx, err := db.DB.BeginTx(ctx, nil)
defer tx.Rollback()
// 1. Deduct paper stock
// 2. Deduct ink stock
// 3. Insert spoilage_log (ถ้ามี)
// 4. UPDATE orders SET stock_deducted_at = NOW()
tx.Commit()
```

**Acceptance Criteria:**
- [x] Ink fail → Paper rollback
- [x] `stock_deducted_at` บันทึกเฉพาะเมื่อ commit สำเร็จ

---

## ลำดับการ Assign งาน (แยก Session)

| Session | Task | ประมาณเวลา |
|---|---|---|
| Session A | TASK 1.1 Unit Cost Bug | 30-45 นาที |
| Session B | TASK 1.2 Cache Invalidation | 20-30 นาที |
| Session C | TASK 1.3 Machine Cost | 45-60 นาที |
| Session D | TASK 1.4 Transaction Atomicity | 20-30 นาที |
