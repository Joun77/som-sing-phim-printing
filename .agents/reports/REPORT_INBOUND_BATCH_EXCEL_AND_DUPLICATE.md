# Task: ปรับปรุงระบบ Inbound Batch - แก้ไขจำนวนหมวดหมู่, เพิ่มปุ่มคัดลอก และระบบนำเข้า/ส่งออก Excel (Excel Template & Bulk Inbound)

## 1. ปัญหาและวัตถุประสงค์ (Problem & Objective)
- **ปัญหาที่พบ:**
  1. ข้อความในหน้าต่างเลือกหมวดหมู่ (`BatchSidebar.tsx`) เขียนว่า `(11 ໝວດ)` แต่เนื้อหาจริงมี 9 การ์ดหมวดหมู่ ทำให้ผู้ใช้สับสน
  2. ในแถบรายการสินค้าทางซ้ายของ Inbound Workspace ขาดปุ่ม **คัดลอก (Duplicate/Copy)** ทำให้กรณีที่นำเข้าสินค้าสเปกใกล้เคียงกัน (เช่น กระดาษยี่ห้อเดิม เปลี่ยนแค่แกรม) ต้องมากรอกใหม่ตั้งแต่ต้น
  3. ยังไม่มีระบบ **Excel Template Export** ให้ดาวน์โหลดแบบฟอร์มที่ตรงตามสเปกของแต่ละหมวดหมู่
  4. ยังไม่มีระบบ **Excel Bulk Upload / Import** ทำให้การสั่งซื้อล็อตใหญ่ (10–100+ รายการ) ไม่สามารถนำเข้าได้ในรอบเดียว

- **ผลลัพธ์ที่ต้องการ:**
  1. ปรับแก้ข้อความหัวข้อและปุ่มใน `BatchSidebar.tsx` ให้เป็น `9 ໝວດ` (หรือแสดงตัวเลขจริงตาม `CATEGORY_MENU_OPTIONS.length`)
  2. เพิ่มปุ่ม **Copy (Duplicate Item)** ในการ์ดรายการฝั่งซ้ายของ `BatchSidebar.tsx` เมื่อกดแล้วจะโคลนสเปกของรายการนั้นมาเป็นรายการใหม่ทันที
  3. เพิ่มระบบ **ดาวน์โหลด Excel Template แยกตามหมวดหมู่** (มี Header ภาษาลาว/อังกฤษ, คำอธิบาย, และแถวตัวอย่าง Sample Data)
  4. เพิ่มระบบ **ອັບໂຫລດ Excel (Bulk Upload)** ที่สามารถอ่านไฟล์ `.xlsx` และแปลงข้อมูล 10–100+ แถวมาเติม (Append) เข้าสู่ Inbound Batch ทันที พร้อมให้ผู้ใช้ตรวจทานยอดรวมก่อนกดยืนยันบันทึก

---

## 2. แผนงานประจำเฟส (Feature-Driven Phasing)

### Phase 1: ปรับแก้จำนวนหมวดหมู่ & เพิ่มปุ่ม Duplicate ใน Batch Sidebar
- 🎨 **UX/UI & Frontend:**
  - `BatchSidebar.tsx`:
    - ปรับตัวเลขหัวข้อและปุ่มจาก "11 ໝວດ" เป็น "9 ໝວດ" (ดึงจาก `CATEGORY_MENU_OPTIONS.length`)
    - เพิ่มปุ่มไอคอน `Copy` (Lucide Icons) ไว้ข้างปุ่มถังขยะ `Trash2`
    - เชื่อมต่อฟังก์ชัน `onDuplicateItem(idx)` ใน `ImportForm.tsx` เพื่อ Clone ไอเทมพร้อมตั้งชื่อ `(Copy)` และสร้าง SKU ชั่วคราว

### Phase 2: ระบบดาวน์โหลด Excel Template แยกตามหมวดหมู่ (Excel Template Export)
- 🎨 **Frontend & Utility:**
  - สร้างโมดูล `inboundExcelTemplates.ts`:
    - กำหนด Column Schema สำหรับหมวดสำคัญ: กระดาษ (Paper), หมึก (Ink), ฟิล์มเคลือบ (Lamination), อุปกรณ์เข้าเล่ม (Binding), อะไหล่ (Spare Parts), ฯลฯ
    - มีแถวตัวอย่าง (Sample Row) ชี้แนะวิธีการกรอก เช่น ขนาด A4/A3, แกรม 80, หน่วย ຣີມ, ตัวคูณ 500
    - ฟังก์ชัน `downloadInboundTemplate(categoryId: string)` สร้างไฟล์ `.xlsx` โดยใช้ Library `xlsx`

### Phase 3: ระบบอัปโหลดและแปลงข้อมูล Excel เข้าสู่ Inbound Batch (Excel Bulk Import)
- 🎨 **Frontend & Modal:**
  - สร้าง `ExcelImportModal.tsx` หรือปุ่ม Upload Excel ใน `BatchSidebar.tsx`:
    - ผู้ใช้เลือกไฟล์ `.xlsx` -> ระบบ Parse แถวข้อมูล
    - ทำ Data Mapping ตรวจสอบคอลัมน์ และแปลงเป็น `InboundItemFormData`
    - Append รายการใหม่ทั้งหมดเข้าสู่รายการ `items` ใน `ImportForm.tsx`
    - แสดงข้อความแจ้งเตือนสรุปจำนวนรายการที่นำเข้าสำเร็จ เช่น `ນຳເຂົ້າສຳເລັດ 100 ລາຍການ`

---

## 3. เกณฑ์การตรวจรับงาน (QA Acceptance Criteria)
- [x] หัวข้อ Modal เลือกหมวดหมู่แสดง `9 ໝວດ` ตรงกับการ์ดจริง
- [x] มีปุ่ม Copy ในการ์ดรายการฝั่งซ้าย กดแล้วโคลนข้อมูลสเปกเดิมทันทีพร้อมต่อท้ายชื่อ `(ສຳເນົາ)`
- [x] ดาวน์โหลดไฟล์ Template `.xlsx` ได้แยกตามหมวดหมู่ พร้อมมีหัวตารางและข้อมูลตัวอย่าง
- [x] อัปโหลดไฟล์ Excel เข้ามาแล้ว ข้อมูลถูกแปลงเป็น Batch Items และเพิ่มเข้าไปในรายการทันที
- [x] ไม่มีการใช้ Unicode Emoji ใน UI (ใช้เฉพาะ Lucide Icons)
- [x] ยอดรวม Grand Total คำนวณถูกต้องตามรายการที่ Import เข้ามา
- [x] ผ่านการทดสอบ Vitest, TypeScript (0 errors) และ Production Build

---

## 4. สรุปผลการดำเนินงาน (Implementation Summary)
- **Files Created/Modified:**
  - [`inboundExcelHelper.ts`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/utils/inboundExcelHelper.ts): ตัวช่วยดาวน์โหลด Excel Template พร้อม Auto column widths และตัวแปลงไฟล์ Excel เข้า InboundItemFormData
  - [`InboundExcelModal.tsx`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/modals/InboundExcelModal.tsx): Modal 2 แถบ (ดาวน์โหลด Template และอัปโหลด Bulk Import พร้อมแสดงจำนวน Preview)
  - [`BatchSidebar.tsx`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/forms/BatchSidebar.tsx): ปรับแก้จาก 11 หมวด เป็น 9 หมวด, เพิ่มปุ่มคัดลอก (Copy) ข้างถังขยะ, เพิ่มปุ่มเปิด Excel Modal
  - [`ImportForm.tsx`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/ImportForm.tsx): เชื่อมต่อ `handleDuplicateItemTab` และ `handleBulkAddItems` สำหรับการโคลนและนำเข้าแบบกลุ่ม
- **Build & Tests:**
  - `npx tsc --noEmit`: ผ่าน 0 errors
  - `npm test -- --run`: ผ่าน 34/34 tests
  - `npm run build`: ผ่านการคอมไพล์สำเร็จ
  - `go test ./...`: ผ่านทุกแพ็กเกจTests (`npm test`) ผ่าน 100%
