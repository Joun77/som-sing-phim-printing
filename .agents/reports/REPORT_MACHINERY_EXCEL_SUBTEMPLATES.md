# Task: พัฒนาระบบ Sub-Template Excel สำหรับเครื่องจักร 5 ประเภทย่อย (Laser, Inkjet, Cutter, Laminator, Binder)

## 1. วัตถุประสงค์ (Objective)
เครื่องจักรและเครื่องพิมพ์แต่ละประเภทมีพารามิเตอร์เฉพาะทางที่แตกต่างกันอย่างสิ้นเชิง:
1. **Laser Printer:** ช่องสี (CMYK), Drum, Fuser, Developer, Transfer Belt, GSM สูงสุด, PPM ความเร็ว
2. **Inkjet Printer:** หัวพิมพ์ (Printhead), กล่องซับหมึก (Maintenance Box), ปริมาตรหมึก ml, ระบบหมึกแท้/เทียบ
3. **เครื่องตัด (Guillotine / Cutter):** ความกว้างหน้าตัด (mm), ความหนาสูงสุด, อายุใบมีด (Cuts), เขียงรองตัด
4. **เครื่องเคลือบ (Laminator):** อุณหภูมิความร้อน (°C), เวลาอุ่นเครื่อง (Warm-up min), ความกว้างม้วน (mm), ลูกกลิ้งความร้อน
5. **เครื่องเข้าเล่ม (Binder):** ชนิดกาว (EVA/PUR), อุณหภูมิหม้อกาว, ความหนาสันเล่ม, ความเร็วเล่ม/ชม.

**แนวทางแก้ไข:**
สร้าง **Sub-Template แยกเป็น 5 ประเภทย่อย** เพื่อให้ผู้ใช้ดาวน์โหลดไฟล์ Excel ที่มีหัวตารางและตัวอย่างข้อมูลตรงสเปกของเครื่องจักรประเภทนั้นๆ 100% ไม่งง ไม่เจอคอลัมน์ขยะ และเมื่อนำเข้า (Import) ระบบจะแปลงเข้าสู่ State ของ `InboundItemFormData` ให้สอดคล้องกับฟอร์มหน้าเว็บทันที

---

## 2. แผนงานประจำเฟส (Feature-Driven Vertical Slicing)

### Phase 1: ขยาย Template Definitions ใน `inboundExcelHelper.ts`
- เพิ่ม 5 Category Sub-templates:
  - `MACHINERY_LASER`: Template เฉพาะเลเซอร์
  - `MACHINERY_INKJET`: Template เฉพาะอิงค์เจ็ต
  - `MACHINERY_CUTTER`: Template เฉพาะเครื่องตัด
  - `MACHINERY_LAMINATOR`: Template เฉพาะเครื่องเคลือบ
  - `MACHINERY_BINDER`: Template เฉพาะเครื่องเข้าเล่ม
- กำหนด Headers, คำอธิบายภาษาลาว/อังกฤษ, และแถวตัวอย่าง Sample Rows ที่สมบูรณ์

### Phase 2: ปรับปรุง `InboundExcelModal.tsx` ให้มี Sub-category Selector
- เมื่อเลือกหมวด "1. เครื่องจักร & เครื่องพิมพ์" จะแสดงแถบแท็บย่อย 5 แท็บ:
  - `Laser Printer (ເລເຊີ)`
  - `Inkjet Printer (ອິ້ງເຈັດ)`
  - `ເຄື່ອງຕັດ (Cutter)`
  - `ເຄື່ອງເຄືອບ (Laminator)`
  - `ເຄື່ອງເຂົ້າເຫຼັ້ມ (Binder)`
- ผู้ใช้สามารถกดดาวน์โหลด Template เฉพาะเจาะจง หรือเลือกประเภทเป้าหมายก่อนอัปโหลดไฟล์ได้

### Phase 3: อัปเดต Parser และ Data Mapping ใน `inboundExcelHelper.ts`
- รองรับการ Map คอลัมน์เฉพาะของทั้ง 5 ประเภทย่อยเข้าสู่ `InboundItemFormData`
- Auto-generate SKU/Code และเซตค่า `machineryTypeCategory` พร้อม Built-in Wear Parts & Technical Specs ให้ตรงชนิด

---

## 3. เกณฑ์การตรวจรับงาน (QA Acceptance Criteria)
- [x] มีตัวเลือก Sub-template เครื่องจักร 5 ประเภทให้ดาวน์โหลด
- [x] ไฟล์ `.xlsx` ของแต่ละประเภทย่อยมีหัวตารางเฉพาะทางที่ถูกต้อง พร้อม Sample Rows
- [x] การอัปโหลดไฟล์ Excel ของแต่ละประเภท ทำการแปลงข้อมูลเข้าสู่ Workspace โดยตั้งค่า `machineryTypeCategory` ถูกต้อง พร้อมพารามิเตอร์เฉพาะทาง
- [x] ไม่มี Unicode Emoji ใน UI
- [x] ผ่าน TypeScript Check (`tsc --noEmit`), Frontend Tests (34/34), และ Production Build

---

## 4. สรุปผลการพัฒนา (Implementation Summary)
- **Files Created/Modified:**
  - [`inboundExcelHelper.ts`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/utils/inboundExcelHelper.ts):
    - เพิ่ม Definition Template ย่อย 5 ตัว: `MACHINERY_LASER`, `MACHINERY_INKJET`, `MACHINERY_CUTTER`, `MACHINERY_LAMINATOR`, `MACHINERY_BINDER`
    - ขยายฟังก์ชัน `parseInboundExcel` ให้ฉลาดในการแยก Map ข้อมูลเฉพาะ เช่น อายุดรัม/Fuser (เลเซอร์), หัวพิมพ์/กล่องซับหมึก (อิงค์เจ็ต), หน้ากว้างตัด/รอบใบมีด/เขียง (เครื่องตัด), อุณหภูมิ/หน้ากว้างม้วน (เครื่องเคลือบ), กาว/ใบกรีดสัน (เครื่องเข้าเล่ม)
  - [`InboundExcelModal.tsx`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/modals/InboundExcelModal.tsx):
    - เมื่อผู้ใช้เลือกการ์ด "1. ເຄື່ອງຈັກ & ເຄື່ອງພິມ" จะแสดงแถบตัวเลือกประเภทย่อย 5 ปุ่ม (Laser, Inkjet, Cutter, Laminator, Binder) ทันที
    - ปุ่มดาวน์โหลดและตัวรับไฟล์จะผูกกับ Sub-Template นั้นๆ โดยตรง
- **Verification Results:**
  - `npx tsc --noEmit`: ผ่าน 0 errors
  - `npm test -- --run`: ผ่านครบ 34/34 unit tests
  - `npm run build`: คอมไพล์ Production Bundle สำเร็จ
