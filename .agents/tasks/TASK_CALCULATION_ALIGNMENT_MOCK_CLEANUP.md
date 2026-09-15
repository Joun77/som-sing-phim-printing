# Task: Calculation Alignment, Equipment Precision, Mock Data Purge, DB Templates & Quotation UX Clarification

## 1. ปัญหาและวัตถุประสงค์ (Problem & Objective)
- **ปัญหาที่พบ:**
  1. **Bug คำนวณต้นทุนกระดาษถูกลง 500 เท่า (Double Division):** `cost_per_consumption_unit` จากคลังสินค้าเป็นราคาต่อแผ่นอยู่แล้ว แต่เมื่อส่งเข้า Pricing Engine (`engine.go`) ตัว Engine ทำการ default `sheetsPerPack = 500` และนำไปหาร 500 ซ้ำ ส่งผลให้ต้นทุนกระดาษถูกกว่าความเป็นจริง 500 เท่า
  2. **ความแม่นยำของค่าเสื่อมเครื่องจักรและค่าแรงช่างพิมพ์:** การคำนวณยังมีการประมาณการคร่าว ๆ หรือใช้ fallback แทนที่จะดึงค่าจริงจาก Master Equipment (`expected_life_a4_pages`, `maintenance_cost_per_page`, `linked_ink_cost_per_page`) และค่าแรงช่างพิมพ์จริง
  3. **Mock Data ตกค้างในหน้าติดตามงาน (Shop Floor Tracker):** มีการใช้ข้อมูลจำลอง Unsplash (`SAMPLE_PREVIEWS`), วันที่ส่งมอบ `'2026-09-10'`, เงินมัดจำ 50% fallback, และค่าเฉลี่ยสี CMYK ปลอม `(2.5, 2.5, 2.5, 5.0)`
  4. **ความสับสนระหว่างจำนวนชิ้นงานลูกค้า vs จำนวนแผ่นแม่ที่ต้องตัด:** ผู้ใช้งานและช่างพิมพ์สับสนระหว่างยอดสั่งของลูกค้า (ชิ้นงานสำเร็จ เช่น 500 ชิ้น) กับจำนวนแผ่นแม่ในคลังที่ต้องเบิกตัด (Parent Sheets เช่น 25 แผ่น)
  5. **การจัดเก็บและใช้งาน Template ใบเสนอราคา:** ผู้ใช้ต้องการให้บันทึกเทมเพลตลงฐานข้อมูล PostgreSQL กลาง เพื่อให้แอดมินและพนักงานทุกคนแชร์เทมเพลตเดียวกันได้แบบ Real-time และกดเลือก 1-Click เติมสเปกได้ทันที

- **ผลลัพธ์ที่ต้องการ (User-Approved):**
  - ต้นทุนกระดาษดึง `cost_per_consumption_unit` จากคลังสินค้ามาคำนวณโดยตรง โดยส่งแฟล็ก `paper_cost_is_per_sheet: true` ไม่มีการหาร 500 ซ้ำ
  - อัตราค่าเสื่อม ค่าบำรุงรักษา และต้นทุนน้ำหมึกของเครื่องพิมพ์ ดึงจากตาราง `equipment` จริง 100%
  - ลบ Mock Data ทั้งหมดออกจากระบบ หากไม่มีไฟล์อาร์ตเวิร์กจริง ให้แสดงสถานะ `"ລໍຖ້າໄຟລ໌ຈາກລູກຄ້າ"` (Pending Artwork) พร้อมปุ่มอัปโหลดจริง
  - ปรับหน่วยนับสำหรับจำนวนงานลูกค้าให้เปลี่ยนอัตโนมัติตามประเภทสินค้า (เช่น "ຊິ້ນ" สำหรับโบรชัวร์, "ໃບ" สำหรับนามบัตร, "ຫົວ/ເຫຼັ້ມ" สำหรับสมุด, "ຮູບ" สำหรับงานภาพ) พร้อมกล่องแสดงสูตร: `⌈ຈຳນວນຊິ້ນງານ ÷ ອັດຕາຕັດ⌉ + ເສຍ = ແຜ່ນແມ່ທັງໝົດ`
  - สร้างตาราง `quotation_templates` ใน PostgreSQL พร้อม API ให้บันทึกและดึงเทมเพลตกลางมาใช้ได้ทันที

---

## 2. แผนงานประจำเฟส (Feature-Driven Vertical Slicing)

### Phase 1: Database & Backend Pricing Engine Alignment
- 🗄️ **Database:**
  - สร้าง Migration `038_quotation_templates.sql` รองรับการจัดเก็บเทมเพลตใบเสนอราคา
  - ลงทะเบียนใน `admin-system/backend/db/db.go`
- ⚙️ **Backend:**
  - เพิ่มฟิลด์ `PaperCostIsPerSheet bool` ใน `CalculationRequest` ของ `engine.go`
  - แก้ตรรกะ `CalculatePrintJobPrice`: หาก `req.PaperCostIsPerSheet == true` หรือ `req.SheetsPerPack <= 1` ไม่ต้องหารด้วย `sheetsPerPack` ซ้ำ
  - สร้าง Handlers สำหรับ `GET /api/v1/quotations/templates`, `POST /api/v1/quotations/templates`, `DELETE /api/v1/quotations/templates/:id`
  - รันและอัปเดต `engine_test.go`

### Phase 2: Purge Mock Data & Artwork Pending State in Tracker
- ⚙️ **Backend:**
  - ตรวจสอบให้ orders API ส่งยอดมัดจำจริงและสถานะไฟล์จริง
- 🎨 **UX/UI & Frontend:**
  - ลบอาเรย์ `SAMPLE_PREVIEWS` (Unsplash) ออกจาก `ArtworkFilesCard.tsx`
  - หากไม่มีไฟล์อัปโหลด แสดงการ์ดสถานะ `"ລໍຖ້າໄຟລ໌ຈາກລູກຄ້າ"` (Pending Artwork) พร้อมปุ่มเลือกไฟล์อัปโหลดจริง
  - ปรับ `ShopFloorTracker.tsx`: ลบ fallback วันที่ `'2026-09-10'`, ลบ fallback มัดจำ 50%, และลบ fallback CMYK `2.5, 2.5, 2.5, 5.0`

### Phase 3: Quotation UX Clarification, Equipment Precision & DB Templates
- 🎨 **UX/UI & Frontend:**
  - ปรับ `CreateOrderPage.tsx`: ส่ง `paper_cost_is_per_sheet: true` และดึงค่าเสื่อมเครื่องจักรผ่าน `calculateMachineUnitCost`
  - ปรับ `PaperAndCoverSection.tsx`:
    - แสดง Card Badge: `[ຈຳນວນຊິ້ນງານລູກຄ້າ: X หน่วย] ⟶ [ອັດຕາຕັດ: Y หน่วย/ແຜ່ນ] ⟶ [ຈຳນວນແຜ່ນແມ່ທີ່ຕ້ອງຕັດ: Z ແຜ່ນ (+ ເຜື່ອເສຍ S ແຜ່ນ)]`
    - กำหนดหน่วยนับตามประเภทงาน ("ໃບ", "ຊິ້ນ", "ຫົວ/ເຫຼັ້ມ", "ຮູບ")
    - เพิ่มคำอธิบายสูตรชัดเจน: `⌈ຈຳນວນຊິ້ນງານ ÷ ອັດຕາຕັດ⌉ + ເສຍ = ແຜ່ນແມ່ທັງໝົດ`
  - ปรับ `QuotationManager.tsx`:
    - เชื่อมต่อ API ดึงและบันทึกเทมเพลตลงฐานข้อมูล PostgreSQL
    - แสดงแถบ 1-Click Fast Presets ด้านบนสุดให้เด่นชัด

---

## 3. เกณฑ์การตรวจรับงาน (QA Acceptance Criteria)
- [ ] ต้นทุนกระดาษในใบเสนอราคาและการเปิดออเดอร์ตรงกับ `cost_per_consumption_unit` ในคลังสินค้า ไม่ถูกหาร 500 ซ้ำ
- [ ] ต้นทุนค่าเสื่อมและบำรุงรักษาเครื่องจักรตรงกับข้อมูลจริงใน Equipment Master
- [ ] ไม่มีรูป Unsplash หรือวันที่ฮาร์ดโค้ดหลงเหลือใน Shop Floor Tracker และแสดงการ์ด Pending Artwork ถูกต้อง
- [ ] แสดงความต่างระหว่างจำนวนชิ้นงานลูกค้าและจำนวนแผ่นแม่ชัดเจนตามหน่วยนับประเภทงาน
- [ ] บันทึกและเรียกใช้เทมเพลตใบเสนอราคาจาก PostgreSQL Database สำเร็จ
- [ ] ไม่ใช้ Unicode Emoji ใน UI (ใช้ Lucide Icons เท่านั้น)
- [ ] Compile ผ่าน (`go test ./...`, `npm run typecheck`, `npm test`)
