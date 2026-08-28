# Task 05: Lao Language Standardization & Emoji Removal (Icon Standard)

## 1. AI Role Definition
* **Role:** Localization Specialist & Design System Quality Assurance Engineer
* **Mission:** ตรวจสอบและกวาดล้าง **อีโมจิทั้งหมด** ออกจากโค้ดและ UI ทุกหน้าของระบบ Admin System แล้วแทนที่ด้วย `lucide-react` icons คุณภาพสูง พร้อมทั้ง **แปลข้อความภาษาไทยที่หลงเหลือทั้งหมดให้เป็นภาษาลาว 100%** เพื่อให้ระบบมีความเป็นมืออาชีพและเป็นเอกภาพตามมาตรฐานสมสิงห์พิมพ์

---

## 2. ขอบเขตงานที่ต้องทำ (Scope of Work)
1. **Emoji Elimination (กวาดล้างอีโมจิ 100%):**
   - ค้นหาและลบอีโมจิ เช่น 📑, 🎨, 🔲, 💧, ✂️, ⚠️, 📦, 🚚, 💰, ⚙️, 🔴, 🟢, 🔵
   - แทนที่ด้วย Lucide Icons ที่มีความหมายตรงกัน เช่น `<FileText />`, `<Palette />`, `<Droplet />`, `<Scissors />`, `<AlertTriangle />`, `<Truck />`
2. **Lao Localization (แปลงภาษาไทยเป็นภาษาลาว 100%):**
   - ตรวจสอบไฟล์ใน `features/production/`, `features/inventory/`, `features/equipment/`, `features/inbound/`, `features/orders/`
   - แปลงคำภาษาไทย (เช่น "กระดาษติด", "สีไม่ตรง", "สั่งพิมพ์", "ช่างพิมพ์", "คลังสินค้า", "บันทึกข้อมูลสำเร็จ") ให้เป็นภาษาลาวที่ถูกต้องและสละสลวย (เช่น "ເຈ້ຍຕິດ", "ສີບໍ່ຕົງ", "ສັ່ງພິມ", "ຊ່າງພິມ", "ສາງສິນຄ້າ", "ບັນທຶກຂໍ້ມູນສຳເລັດ")
3. **Typography & Layout Alignment:**
   - ตรวจสอบฟอนต์และระยะห่างบรรทัด (Line-height) ให้ตัวหนังสือภาษาลาวอ่านง่าย ไม่ทับซ้อนกัน

---

## 3. สิ่งที่ห้ามทำเด็ดขาด (Strict Restrictions)
* ❌ **ห้ามแก้ไข Business Logic, Pricing Engine หรือ State Machine ใดๆ**
* ❌ **ห้ามใส่อีโมจิใหม่กลับเข้ามาเด็ดขาด**
* ❌ **ห้ามทำให้เกิด Compile Error / Broken Imports**

---

## 4. สิ่งที่แก้ไขได้และไฟล์เป้าหมาย (Permitted Scope & Target Files)
* [MODIFY] `admin-system/frontend/src/features/production/ShopFloorTracker.tsx`
* [MODIFY] `admin-system/frontend/src/features/production/components/ProductionBoard.tsx`
* [MODIFY] `admin-system/frontend/src/features/inventory/components/` (ทุกไฟล์ในโฟลเดอร์)
* [MODIFY] `admin-system/frontend/src/features/equipment/components/` (ทุกไฟล์ในโฟลเดอร์)
* [MODIFY] `admin-system/frontend/src/features/inbound/components/` (ทุกไฟล์ในโฟลเดอร์)
* [MODIFY] `admin-system/frontend/src/features/orders/components/` (ทุกไฟล์ในโฟลเดอร์)

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria)
1. ไม่มีอีโมจิหลงเหลืออยู่ในหน้าจอและซอร์สโค้ดแม้แต่ตัวเดียว (ตรวจพบ = 0)
2. UI ทุกหน้าแสดงผลเป็นภาษาลาวอย่างสมบูรณ์แบบและถูกต้อง
3. การแสดงผล UI สวยงาม พรีเมียม และไอคอนคมชัด
4. `npm run dev` ผ่านฉลุย ไม่มี Warning หรือ Error
