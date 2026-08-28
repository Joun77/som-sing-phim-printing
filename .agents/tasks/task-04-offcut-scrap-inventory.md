# Task 04: Offcut / Scrap Inventory Management

## 1. AI Role Definition
* **Role:** Material Resource Planning (MRP) & Warehouse Systems Architect
* **Mission:** พัฒนาระบบ **"คลังเศษกระดาษ (Offcut Inventory Management)"** เพื่อรองรับการบันทึกเศษกระดาษขนาดมาตรฐานที่เหลือจากการตัดแผ่นใหญ่ (เช่น 13×19", A4, A5, หรือแถบสติกเกอร์) เข้าสู่สต็อก เพื่อนำกลับมาพิมพ์งานขนาดเล็ก เช่น นามบัตร, ป้ายแท็ก, สติกเกอร์ฉลากสินค้า

---

## 2. ขอบเขตงานที่ต้องทำ (Scope of Work)
1. **Offcut Category & Sub-warehouse ใน Inventory:**
   - เพิ่มหมวดหมู่ย่อยในคลัง: `ເສດເຈ້ຍມາດຕະຖານ (Standard Offcuts)`
   - แสดงขนาดกว้าง × ยาว (มม. หรือ นิ้ว), แกรม (GSM), ชนิดกระดาษ (Art Card, Bond, Kraft), และจำนวนแผ่นคงเหลือ
2. **Quick "Save to Offcut" Action:**
   - ในหน้าตัดกระดาษ หรือหน้าจัดการสต็อก มีปุ่มกด `[ບັນທຶກເສດເຈ້ຍ (Save Offcut)]`
   - คำนวณราคาประเมินต้นทุนต่อแผ่นอัตโนมัติ (Pro-rated Cost หรือ Low Scrap Cost)
3. **Offcut Deduction upon Small Job Printing:**
   - เมื่อสร้างใบเสนอราคาหรือสั่งพิมพ์งานนามบัตร/การ์ด สามารถเลือกเบิกกระดาษจาก **"คลังเศษกระดาษ"** แทนการเบิกแผ่นใหญ่ได้

---

## 3. สิ่งที่ห้ามทำเด็ดขาด (Strict Restrictions)
* ❌ **ห้ามใช้อีโมจิในโค้ดและ UI เด็ดขาด** (ให้ใช้ Lucide Icons เช่น `<Scissors />`, `<Layers />`, `<Archive />`, `<Plus />` เท่านั้น)
* ❌ **ห้ามใช้ภาษาไทยใน UI** (ข้อความทั้งหมดต้องเป็น **ภาษาลาว** เช่น `ຄັງເສດເຈ້ຍ`, `ຂະໜາດເສດ`, `ຈຳນວນແຜ່ນ`, `ມູນຄ່າຕົ້ນທຶນ`)
* ❌ **ห้ามกระทบโครงสร้างการตัดสต็อกสินค้าหลัก** (ให้แยกประเภท Item Type เป็น `offcut` หรือเพิ่มแท็กชัดเจน)

---

## 4. สิ่งที่แก้ไขได้และไฟล์เป้าหมาย (Permitted Scope & Target Files)
* [MODIFY] `admin-system/frontend/src/features/inventory/components/InventoryManagement.tsx`
* [MODIFY] `admin-system/frontend/src/features/inventory/components/StockTable.tsx`
* [NEW] `admin-system/frontend/src/features/inventory/components/modals/AddOffcutModal.tsx`
* [MODIFY] `admin-system/frontend/src/features/inventory/types.ts`
* [MODIFY] `admin-system/frontend/src/store/AppContext.tsx`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria)
1. สามารถบันทึกเศษกระดาษพร้อมขนาด แกรม และจำนวนแผ่นเข้าคลังได้
2. มีแท็บ/ฟิลเตอร์กรองดูเฉพาะ "ເສດເຈ້ຍ (Offcuts)" ในหน้าคลังสินค้า
3. ข้อมูลคำนวณมูลค่ารวมของเศษกระดาษในคลังได้ถูกต้อง
4. UI เป็นภาษาลาว 100% ปราศจากอีโมจิ
