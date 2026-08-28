# Task 02: Quick Ink Swap & Consumable Stock Auto-Deduction

## 1. AI Role Definition
* **Role:** Equipment & Inventory Integration Engineer
* **Mission:** พัฒนาระบบ **"เปลี่ยนหมึก/อะไหล่ด่วน (One-Click Consumable Swap)"** ในหน้ารายละเอียดเครื่องพิมพ์ ([EquipmentDetailsPage.tsx](file:///admin-system/frontend/src/features/equipment/components/details/EquipmentDetailsPage.tsx)) เมื่อกดยืนยันการเปลี่ยนขวดหมึกหรืออะไหล่ ให้ระบบไปตัดสต็อกสินค้าในคลังสินค้าอัตโนมัติทันที และรีเซ็ตอายุการใช้งานอะไหล่ชิ้นนั้น

---

## 2. ขอบเขตงานที่ต้องทำ (Scope of Work)
1. **Quick Ink Swap Button บนแท็บ Inks:**
   - เพิ่มปุ่ม `[ປ່ຽນໝຶກຕຸກໃໝ່ (Replace Ink)]` ประจำแต่ละสี (C, M, Y, K)
   - เมื่อกด จะแสดง Modal สรุปจำนวนขวดที่ตัดจากคลัง (เช่น ตัดขวดหมึก 1 ลิตร / 500 mL รหัส INK-CANON-C ออกจากสต็อก 1 หน่วย)
2. **Component Wear Reset & Part Deduct:**
   - เมื่อเปลี่ยนลูกยาง (Roller), ชุดดรัม (Drum Unit), หรือใบมีดตัด (Cutter Blade) ให้มีตัวเลือกว่า "ตัดสต็อกอะไหล่สำรองในคลังหรือไม่"
3. **Activity Logging:**
   - บันทึกประวัติการเปลี่ยนหมึกและอะไหล่ลงในประวัติเครื่องจักรและคลังสินค้า พร้อมระบุวันที่และผู้ดำเนินการ

---

## 3. สิ่งที่ห้ามทำเด็ดขาด (Strict Restrictions)
* ❌ **ห้ามใช้อีโมจิในโค้ดและ UI เด็ดขาด** (ให้ใช้ Lucide Icons เช่น `<Layers />`, `<RotateCcw />`, `<Wrench />`, `<Check />` เท่านั้น)
* ❌ **ห้ามใช้ภาษาไทยใน UI** (ข้อความทั้งหมดต้องเป็น **ภาษาลาว** เช่น `ປ່ຽນໝຶກໃໝ່`, `ຕັດສະຕັອກສຳເລັດ`, `ປະຫວັດການບຳລຸງຮັກສາ`)
* ❌ **ห้ามตัดสต็อกหากสินค้าในคลังหมด** (ต้องมี Validation เตือนว่าหมึกในคลังไม่พอ หากสต็อกเป็น 0)
* ❌ **ห้ามแก้ไขสูตรคำนวณค่าเสื่อมราคาและ ROI ที่มีอยู่แล้ว**

---

## 4. สิ่งที่แก้ไขได้และไฟล์เป้าหมาย (Permitted Scope & Target Files)
* [MODIFY] `admin-system/frontend/src/features/equipment/components/details/EquipmentDetailsPage.tsx`
* [NEW] `admin-system/frontend/src/features/equipment/components/modals/QuickSwapConsumableModal.tsx`
* [MODIFY] `admin-system/frontend/src/store/AppContext.tsx` (ฟังก์ชันตัดสต็อกหมึก/อะไหล่เมื่อเปลี่ยน)
* [MODIFY] `admin-system/frontend/src/features/equipment/types.ts`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria)
1. สามารถกดเปลี่ยนหมึกสีที่ต้องการได้จากหน้าเครื่องพิมพ์ และสต็อกขวดหมึกในคลังลดลง 1 ขวดทันที
2. แถบสุขภาพ SLA / Component Wear รีเซ็ตกลับเป็น 0% หลังกดยืนยันเปลี่ยนอะไหล่
3. ภาษาในหน้านี้เป็นภาษาลาว 100% และไม่มีอีโมจิ
4. มี Alert แจ้งเตือนหากหมึกในคลังหมด
