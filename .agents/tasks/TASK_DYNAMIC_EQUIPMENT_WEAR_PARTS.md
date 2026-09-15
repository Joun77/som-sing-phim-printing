# Task: ระบบจัดการอะไหล่สิ้นเปลืองเครื่องจักรแบบไดนามิก (Dynamic Equipment Wear Parts System)

## 1. ปัญหาและวัตถุประสงค์ (Problem & Objective)
- **ปัญหาที่พบ:**
  - ในหน้ารายละเอียดเครื่องจักร (`EquipmentDetailsPage.tsx`) และระบบเครื่องจักรเดิม รายการอะไหล่สิ้นเปลือง (Wear Parts) ยังไม่ได้เป็นแบบไดนามิกอย่างแท้จริง มีการใช้ Fallback Mock Data หรือแชร์อะไหล่ชุดเดียวกัน ทำให้เครื่องพิมพ์เลเซอร์ เครื่องพิมพ์อิงเจ็ต เครื่องตัด เครื่องเคลือบ เครื่องเข้าเล่ม แสดงรายการอะไหล่เหมือนกันในบางกรณี
  - ผู้ใช้งานไม่สามารถ เพิ่มอะไหล่ใหม่ (Add Part), ลบอะไหล่ที่ไม่ต้องการ (Delete Part), หรือแก้ไขรายการอะไหล่ได้อย่างอิสระตามสภาพเครื่องจักรจริงของแต่ละรุ่น
- **ผลลัพธ์ที่ต้องการ:**
  - สร้างระบบ **Dynamic Wear Parts System** โดยมี Category Preset Templates เป็นค่าเริ่มต้น (Laser, Inkjet, Cutter, Laminator, Binder, Custom)
  - เมื่อนำเข้าเครื่องจักรจากหน้า Inbound ให้นำสเปกอะไหล่ที่กรอกไว้มาแปลงเป็น Dynamic Components เริ่มต้นของเครื่องนั้นโดยอัตโนมัติ
  - ในหน้ารายละเอียดเครื่องจักร สามารถ **เพิ่ม / ลบ / แก้ไข** (Add / Delete / Inline Edit) อะไหล่ได้อิสระ
  - หน่วยนับอายุการใช้งานปรับตามประเภทเครื่องจักรอัตโนมัติ (หน้า/Pages, รอบตัด/Cuts, เมตร/Meters, เล่ม/Books)
  - ระบบคำนวณอัตราต้นทุนอะไหล่สิ้นเปลืองรวม (Total Wear Rate) และต้นทุนเครื่องจักรสุทธิ (Total Machine Cost) จากอะไหล่จริงที่มีอยู่อย่างแม่นยำ

---

## 2. แผนงานประจำเฟส (Phase Scope - Complete Full-Stack Slice)

### Phase 1: Full-Stack Dynamic Wear Parts Engine & UI
- 🗄️ **Database & State:**
  - ปรับปรุง interface `EquipmentComponent` ให้รองรับ `id`, `name`, `nameLo`, `cost`, `lifeVal`, `unitLabel`, `usage`, `threshold`, `keyCost`, `keyLife`
  - ใน `AppContext.tsx`:
    - สร้างฟังก์ชัน `updateEquipmentComponents(equipmentId, components)` เพื่อบันทึกลงทั้ง local state และส่ง PUT ไปยัง Backend API `/api/equipment/:id`
    - ปรับปรุงการซิงก์ Inbound ให้แปลงสเปกอะไหล่มาเป็น dynamic components เริ่มต้นตามประเภทเครื่องจักร
- ⚙️ **Backend:**
  - ตรวจสอบและยืนยัน endpoint `PUT /api/equipment/:id` ใน `assets.go` ให้รับและบันทึก `components` แบบ dynamic array ได้อย่างสมบูรณ์
- 🎨 **UX/UI & Frontend:**
  - ใน `EquipmentDetailsPage.tsx`:
    - ปรับปรุง Section 2 "Itemized Wear Parts" ให้รองรับการเพิ่มรายการอะไหล่ใหม่ (Add Wear Part Modal / Inline Row)
    - เพิ่มปุ่มลบอะไหล่ (Delete Part) พร้อมการยืนยัน
    - รองรับการแก้ไขชื่ออะไหล่, ราคาซื้อเปลี่ยนใหม่ (Replacement Cost), และรอบอายุการใช้งาน (Rated Lifespan)
    - หน่วยนับ (Unit Label) ผูกกับประเภทเครื่องจักร (Laser/Inkjet: Pages, Cutter: Cuts, Laminator: Meters, Binder: Books)
  - ใน `machineCostCalculator.ts`:
    - ปรับฟังก์ชัน `calculateMachineWearPartsRate` ให้คำนวณจาก `machine.components` แบบไดนามิกเป็นหลัก (`sum(cost / lifeVal)`) และใช้ Category Specs เป็น fallback เมื่อไม่มี components
- 🧪 **Testing & Verification:**
  - เพิ่ม Unit Tests ใน `machineCostCalculator.test.ts` ทดสอบการคำนวณ Dynamic Components ทั้ง Laser, Inkjet, Cutter, Laminator, Binder

---

## 3. เกณฑ์การตรวจรับงาน (QA Acceptance Criteria)
1. **Inbound Sync:** เครื่องจักรที่นำเข้าจาก Inbound มีอะไหล่ตรงตามสเปกที่กรอก และแปลงเป็น dynamic components ได้ถูกต้อง
2. **Category Presets:** เครื่องจักรแต่ละประเภทมี Template อะไหล่เริ่มต้นที่ถูกต้องตามประเภทของมัน (Laser != Inkjet != Cutter != Laminator != Binder)
3. **Dynamic CRUD:** ในหน้ารายละเอียดเครื่องจักร สามารถ เพิ่ม, ลบ, แก้ไข อะไหล่ได้จริง และบันทึกข้อมูลคงอยู่หลังรีเฟรช
4. **Formula Accuracy:** อัตราต้นทุนอะไหล่รวม (Total Wear Rate) คำนวณจาก sum(Cost / Life) ของอะไหล่ที่เปิดใช้งานจริง
5. **No Unicode Emojis:** ใช้ Lucide Icons เท่านั้นตามกฎของระบบ
6. **Pass All Tests:** Unit tests ใน Frontend (`npm test`) และ Backend (`go test ./...`) ผ่าน 100%
