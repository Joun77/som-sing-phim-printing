# Task: Inventory Inbound Audit, Offcuts Lifecycle & Machinery Unification

## 1. ปัญหาและวัตถุประสงค์ (Problem & Objective)
- **ปัญหาที่พบ:**
  1. **Inbound Edit Duplication Bug:** เมื่อแก้ไขบิลนำเข้าในหน้าจัดซื้อ Backend เอาจำนวนสินค้าไปบวกทับใน `materials.stock_qty` ซ้ำอีกรอบ ทำให้สต็อกบวมผิดพลาด และไม่มีการบันทึกประวัติการแก้ไข (Revision History) หรือตรวจสอบเหตุผลในการแก้
  2. **Offcuts Data Loss & Zombie Records:** ตาราง `offcuts` ใน PostgreSQL ขาดฟิลด์เก็บต้นทุน (`cost_per_sheet`), สเปกกระดาษ ทำให้หลังรีเฟรชหน้าจอ ข้อมูลราคา Pro-rated หายกลายเป็น 400 LAK และไม่มี Endpoint ลบ (`DELETE`) ทำให้ลบแล้วเศษกระดาษเด้งกลับมา อีกทั้งเมื่อเข้าสู่ `IN_PRODUCTION` ระบบยังไม่ตัดสต็อกเศษกระดาษ
  3. **Machinery Inbound Fragmented Entry:** มีจุดเพิ่มเครื่องจักร 2 ที่ (แบบกรอกลอยๆ ในหน้า Equipment ที่ไม่มีบิลจัดซื้อ และแบบ Inbound ที่มีบิลจัดซื้อ) ทำให้ข้อมูลไม่เชื่อมโยงกัน
- **ผลลัพธ์ที่ต้องการ:**
  1. บิลนำเข้ามีระบบ Audit Trail แบ่งเป็นประวัติรับเข้าล็อต (`inbound_transactions`) และประวัติการแก้ไข (`inbound_revision_logs`) บังคับใส่เหตุผลในการแก้ และแก้เฉพาะส่วนต่าง Delta ของสต็อก
  2. ระบบคำนวณต้นทุนการนำเข้า: บันทึกต้นทุนเฉลี่ยถ่วงน้ำหนัก (WAC) สำหรับสต็อกในคลัง และส่งค่า $\max(\text{Old Cost}, \text{New Cost})$ ให้ Pricing Engine คำนวณราคาขายลูกค้า
  3. ตาราง `offcuts` บันทึกสเปกและต้นทุน Pro-rated ถาวร มี API CRUD ครบถ้วน และตัดสต็อกอัตโนมัติเมื่อสั่งพิมพ์ (All-or-Nothing matching) โดยไม่ตัดกระดาษแผ่นใหญ่
  4. รวมศูนย์การลงทะเบียนเครื่องจักรให้ผ่านหน้าจัดซื้อ (Inbound) เท่านั้น โดยเปลี่ยนปุ่มในหน้า Equipment เป็นปุ่มนำทางไปหน้าจัดซื้อ

---

## 2. แผนงานประจำเฟส (Phase Scope - Complete Full-Stack Slice)

### Phase 1: Inbound Edit Delta, Revision Audit Trail & Cost Calculation Policy
- 🗄️ **Database:**
  - สร้างตาราง `inbound_revision_logs` (id, inbound_id, old_quantity, new_quantity, old_price, new_price, delta_stock, edit_reason, edited_by, created_at)
  - เพิ่มคอลัมน์ `is_edited BOOLEAN DEFAULT FALSE` และ `edit_reason TEXT` ใน `inbound_transactions`
  - เพิ่มคอลัมน์ `latest_market_cost NUMERIC(15,2)` ใน `materials`
- ⚙️ **Backend:**
  - แก้ไข `inbound.go` ฟังก์ชัน `HandleUpdateInboundTransaction`:
    - ตรวจสอบสิทธิ์ (เฉพาะ `ADMIN`, `SUPER_ADMIN`, `OWNER`)
    - ตรวจสอบว่าต้องมี `edit_reason` (ห้ามว่าง)
    - คำนวณ Delta: $\Delta Qty = Qty_{new} - Qty_{old}$ และปรับยอดสต็อกใน `materials` ตาม Delta เท่านั้น
    - คำนวณ Weighted Average Cost (WAC) ของ Material และอัปเดต `latest_market_cost = max(old_cost, new_cost)`
    - บันทึกลง `inbound_revision_logs`
  - เพิ่ม Endpoint `GET /api/inbound/:id/revisions` ดึงประวัติการแก้ไขของแต่ละล็อต
- 🎨 **UX/UI & Frontend:**
  - ปรับปรุง `InboundEditModal.tsx`: เพิ่มช่องบังคับ "สาเหตุในการแก้ไข (Edit Reason) *" พร้อม Validation
  - แสดงป้ายกำกับ `EDITED (ແກ້ໄຂແລ້ວ)` ในตาราง Inbound
  - เพิ่มแถบดูประวัติการแก้ไข (Revision History Tab) ในหน้ารายละเอียดบิลนำเข้า
- 🔒 **Security & Permissions:**
  - ป้องกัน Role ทั่วไปเข้าถึงการแก้ไขบิลนำเข้า จำกัดเฉพาะ `ADMIN`, `SUPER_ADMIN`, `OWNER`

### Phase 2: Offcuts Persistence, API CRUD & Production Auto-Deduction
- 🗄️ **Database:**
  - Migration เพิ่มคอลัมน์ในตาราง `offcuts`: `cost_per_sheet NUMERIC(12,2) DEFAULT 0`, `grammage_gsm INTEGER DEFAULT 0`, `paper_type VARCHAR(100)`, `paper_surface VARCHAR(50)`, `parent_material_id VARCHAR(100)`
- ⚙️ **Backend:**
  - ปรับปรุง `inventory/offcuts.go`:
    - แก้ไข `getOffcutsFromDB` และ `saveOffcutToDB` ให้ Select/Insert คอลัมน์ใหม่ครบถ้วน
    - เพิ่ม Handler `HandleDeleteOffcut` (`DELETE /api/inventory/offcuts/:id`)
    - เพิ่ม Handler `HandleUpdateOffcut` (`PUT /api/inventory/offcuts/:id`)
  - อัปเดต `main.go` เพิ่ม Routes สำหรับ Delete และ Update Offcut
  - ปรับปรุง `backend/inventory/deduction.go`:
    - ใน `DeductInventoryForJob`: ตรวจสอบว่า `JobDeductionSpec` มี `UsedOffcutLotID` หรือไม่
    - หากมี: ให้ตัดจำนวนจากตาราง `offcuts` โดยตรง (และลบหรือตั้งเป็น 0 เมื่อหมด) พร้อมบันทึก `stock_movements` ว่าใช้เศษกระดาษ และ **ข้ามการตัดกระดาษแผ่นใหญ่ในตาราง `materials`**
- 🎨 **UX/UI & Frontend:**
  - ปรับปรุง `AppContext.tsx`: โหลดข้อมูลเศษกระดาษจาก `/api/inventory/offcuts` โดยใช้ต้นทุน `cost_per_sheet` จริงจาก Database แทนค่า Hardcode 400 LAK
  - ฟังก์ชัน `deleteOffcut` ใน `AppContext.tsx` ยิงเรียก `DELETE /api/inventory/offcuts/:id` จริง
  - หน้า `OffcutsTab.tsx`: ช่างสามารถลบเศษกระดาษที่หมดสภาพ และดูราคา Pro-rated ที่แท้จริงได้แม้รีเฟรชหน้าจอ

### Phase 3: Machinery Entry Unification & Navigation Bridge
- 🎨 **UX/UI & Frontend:**
  - ที่หน้า `EquipmentManagement.tsx`: นำปุ่ม "เพิ่มเครื่องจักร" แบบ Standalone Modal ออก
  - แทนที่ด้วยปุ่มดีไซน์สวยงาม: **"ນຳເຂົ້າເຄື່ອງຈັກຜ່ານການຈັດຊື້ (New Inbound Machinery)"** พร้อมไอคอน PackagePlus/Truck
  - เมื่อคลิก จะเรียก `setActiveTab('inbound')` พร้อมส่งพารามิเตอร์เปิด `ImportForm` และเลือกประเภทเป็น `MACHINERY` ทันที
  - เชื่อมโยงข้อมูลหลังบันทึกจัดซื้อเครื่องจักรให้แสดงผลในหน้าเครื่องจักร (Equipment) พร้อมสเปก Color Slots, OEM Inks และ Wear Parts ทันที
- ⚙️ **Backend:**
  - ตรวจสอบความสอดคล้องของ `inbound.go` ในการ Upsert ข้อมูลเครื่องจักรเข้าสู่ตาราง `printers` และ `equipment` ให้สมบูรณ์แบบ

---

## 3. เกณฑ์การตรวจรับงาน (QA Acceptance Criteria)
- [ ] เมื่อแก้ไขบิลนำเข้า สต็อกใน `materials` ไม่บวมเบิ้ลซ้ำ และมีประวัติบันทึกใน `inbound_revision_logs`
- [ ] บังคับกรอกเหตุผลในการแก้ไขบิลนำเข้าเสมอ และจำกัดสิทธิ์เฉพาะ Admin/Owner
- [ ] สเปกและราคา Pro-rated ของเศษกระดาษในคลังไม่สูญหายหลังรีเฟรชหน้าจอ
- [ ] ช่างสามารถลบเศษกระดาษออกจากระบบได้จริง (ไม่เด้งกลับมาหลังรีเฟรช)
- [ ] เมื่อสั่งพิมพ์ออเดอร์ที่ใช้เศษกระดาษ (`IN_PRODUCTION`) ระบบตัดยอดใน `offcuts` จริง และไม่ตัดกระดาษแผ่นใหญ่ใน `materials`
- [ ] หน้าเครื่องจักรไม่มีปุ่มกรอกเครื่องจักรลอยๆ อีกต่อไป ทุกเครื่องจักรต้องบันทึกผ่านหน้าจัดซื้อ
- [ ] ไม่ใช้ Unicode Emoji ใน UI Component (ใช้ Lucide Icons เท่านั้น)
- [ ] Compile ผ่านทั้งหมด (`go build ./...` และ `npm run build`)
- [ ] Unit Tests ผ่านทั้งหมด (`go test ./...` และ `vitest`)
