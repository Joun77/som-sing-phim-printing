# รายงานการพัฒนา: เชื่อมโยง Master Data กระดาษและปรับปรุงระบบหน่วยนับการนำเข้า/เติมสต็อก (Inbound Paper Units & Master Data Integration)

## 1. ข้อมูลสรุปการดำเนินงาน (Executive Summary)
- **สถานะ:** เสร็จสมบูรณ์ (Completed & Tested 100%)
- **ระบบที่เกี่ยวข้อง:**
  - `admin-system/frontend/src/features/inbound/components/InboundManagement.tsx`
  - `admin-system/frontend/src/features/inbound/components/forms/PaperSpecsForm.tsx`
  - `admin-system/frontend/src/features/inbound/components/modals/RestockBatchModal.tsx`

---

## 2. ปัญหาเดิมและวิธีแก้ไข (Problems & Solutions)

### ปัญหาที่ 1: ตารางสินค้านำเข้าแสดงหน่วยกระดาษสำเร็จรูปเป็น "ມ້ວນ" (Roll) ผิดพลาด
- **สาเหตุ:** ใน `InboundManagement.tsx` โค้ดเดิมตรวจสอบเงื่อนไข `paperFormat === 'sheet'` แต่ในระบบกระดาษแผ่นตัดสำเร็จรูปค่าถูกเก็บเป็น `'cut_sheet'` หรือ `'parent_sheet'` ทำให้เงื่อนไขหลุดไปที่ fallback `else` ซึ่งแสดงคำว่า `ມ້ວນ`
- **การแก้ไข:**
  - ปรับปรุงการ mapping ข้อมูลจาก PostgreSQL DB ใน `dbRows` ให้ตรวจสอบ `cut_sheet`, `parent_sheet`, `sheet` และคืนค่าหน่วยที่ถูกต้อง (`ຣີມ` หรือ `ແພັກ`)
  - อัปเดต Column Renderer ในตาราง Inbound ให้แสดงผล `{rawQty} {packUnit} ({totalSheets} ແຜ່ນ @ {sheetsPerPack} ແຜ່ນ/{packUnit})` อย่างแม่นยำ

### ปัญหาที่ 2: ประเภทเนื้อกระดาษในฟอร์มนำเข้าไม่ได้เชื่อมต่อกับ Master Data
- **สาเหตุ:** `PaperSpecsForm.tsx` มีแท็กแสดง "Master Data Integrated" แต่ตัวเลือกประเภทกระดาษ (`paper_type`) ยังใช้ Hardcoded `<option>` 9 รายการ
- **การแก้ไข:**
  - เรียกใช้ Hook `useLookups('paper_type', true)` จาก `@features/master-data`
  - แปลงข้อมูลเป็น `paperTypeOptions` พร้อมซิงก์ค่า GSM เริ่มต้นและค่าผิวสัมผัสอัตโนมัติ
  - รองรับทั้งการแสดงผลภาษาลาวและอังกฤษตามสิทธิ์ Master Data

### ปัญหาที่ 3: ฟอร์มเติมสต็อกเดิม (Restock Batch Modal) ไม่มีหน่วยจัดซื้อและการคูณแผ่น
- **สาเหตุ:** ใน `RestockBatchModal.tsx` ผู้ใช้สามารถกรอกได้เฉพาะตัวเลข Qty แต่ไม่มีให้ระบุหน่วยจัดซื้อว่าเป็น ຣີມ, ແພັກ, ລັງ หรือ ແຜ່ນ
- **การแก้ไข:**
  - นำเข้า `useLookups('unit_of_measure', true)`
  - ปรับโครงสร้าง State `selectedMap` ให้จัดเก็บ `purchaseUnit` และ `multiplier`
  - เพิ่ม Dropdown ในแถวตารางสินค้ากระดาษ ให้เลือก:
    - `ຣີມ (500 ແຜ່ນ)` -> Multiplier = 500
    - `ແພັກ (100 แผ่น หรือตามสเปก)` -> Multiplier = 100 / sheetsPerPack
    - `ລັງ / ກ່ອງ (2,500 ແຜ່ນ)` -> Multiplier = 2,500
    - `ແຜ່ນ (1 ແຜ່ນ)` -> Multiplier = 1
    - `ກຳນົດເອງ (Custom)` -> ผู้ใช้สามารถกำหนดตัวคูณได้เอง
  - แสดงผลคำนวณจำนวนแผ่นรวมแบบ Real-time: `= X,XXX ແຜ່ນ (@ XXX ແຜ່ນ/ຫົວໜ່ວຍ)`
  - แสดงราคาต้นทุนเฉลี่ยต่อแผ่นโดยประมาณ: `≈ XX.XX LAK / ແຜ່ນ`
  - นำค่า `data.multiplier` ไปใช้คำนวณตัดสต็อกและบันทึก Inbound Log อย่างถูกต้อง

---

## 3. สรุปผลการทดสอบ (Verification & QA Results)
- [x] **Frontend Production Build (`npm run build`):** ผ่าน 100% (2,289 modules transformed, 0 errors)
- [x] **Frontend Unit Tests (`npm test`):** ผ่านครบ 34/34 tests, 7 suites, 0 failures
- [x] **Backend Tests (`go test ./...`):** ผ่านครบทุกโมดูล (orders, inventory, finance, preflight, etc.)
- [x] **UI/UX Consistency:** ใช้ภาษาลาว 100% ในป้ายกำกับสำหรับผู้ใช้งาน และไม่ใช้ Unicode Emojis (ใช้ Lucide Icons ตามมาตรฐานระบบ)
