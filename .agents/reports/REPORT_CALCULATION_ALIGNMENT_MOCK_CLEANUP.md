# Report: Calculation Alignment, Equipment Precision, Mock Data Purge, DB Templates & Quotation UX Clarification

## 1. ผลการดำเนินงานภาพรวม (Executive Summary)
ทีมงาน Som Sing Phim ได้ดำเนินงานแก้ไขปัญหาความถูกต้องของระบบต้นทุนงานพิมพ์ และปรับปรุงกระบวนการทำงานครบวงจรทั้ง 3 Phase เสร็จสมบูรณ์:
1. **แก้บั๊กคำนวณต้นทุนกระดาษถูกลง 500 เท่า (Double Division Bug):**
   - เพิ่ม `PaperCostIsPerSheet bool` ใน `CalculationRequest` ของ `backend/pricing/engine.go`
   - ยกเลิกการหาร 500 ซ้ำเมื่อได้รับต้นทุนต่อแผ่นแม่ (`cost_per_consumption_unit`) จากคลังสินค้า
   - เพิ่ม Unit Test `TestPaperCostIsPerSheetDirect` ใน `engine_test.go` ผ่าน 100%
2. **ความแม่นยำของสเปกเครื่องจักรและค่าแรงช่างพิมพ์:**
   - ปรับ `CreateOrderPage.tsx` ให้คำนวณค่าเสื่อมและค่าบำรุงรักษาผ่าน `calculateMachineUnitCost` ตามสเปกจริงในตาราง `equipment`
   - ดึงต้นทุนน้ำหมึกดำและหมึกสีจริงที่ผูกกับเครื่องจักร ไม่ใช้ตัวเลขประมาณการ
3. **กำจัด Mock Data ทั้งหมดในระบบติดตามงาน:**
   - นำ Unsplash Mock Array (`SAMPLE_PREVIEWS`) ออกจาก `ArtworkFilesCard.tsx`
   - ในกรณีที่ออเดอร์ยังไม่มีไฟล์จริง แสดงการ์ดสถานะ `"ລໍຖ້າໄຟລ໌ຈາກລູກຄ້າ"` (Pending Artwork) พร้อมปุ่มอัปโหลดจริง
   - ใน `ShopFloorTracker.tsx` ลบวันที่ส่งมอบ `'2026-09-10'`, ลบมัดจำ 50% fallback, และลบค่าสี CMYK ปลอม `(2.5, 2.5, 2.5, 5.0)`
4. **คลายความสับสนระหว่างจำนวนชิ้นงานลูกค้า vs จำนวนแผ่นแม่:**
   - ปรับปรุง `PaperAndCoverSection.tsx` ให้แสดง 3-Step Visual Badge:
     - 1. ຍອດສັ່ງລູກຄ້າ: `X [ໃບ / ຊິ້ນ / ຫົວ / ຮູບ]` (ปรับหน่วยนับตามประเภทงานอัตโนมัติ)
     - 2. ອັດຕາການຕັດ: `Y [ໃບ / ຊິ້ນ / ຫົວ / ຮູບ]` ຕໍ່ 1 ແຜ່ນແມ່
     - 3. ແຜ່ນແມ່ທີ່ຕ້ອງຕັດ: `Z ແຜ່ນແມ່ (+ ເຜື່ອເສຍ S ແຜ່ນ)`
     - พร้อมกล่องสูตร: `⌈ ຈຳນວນຊິ້ນງານ ÷ ອັດຕາຕັດ ⌉ + ເຜື່ອເສຍ = ແຜ່ນແມ່ທັງໝົດ`
5. **ระบบจัดเก็บเทมเพลตใบเสนอราคาลง PostgreSQL:**
   - สร้าง Migration `038_quotation_templates.sql` และลงทะเบียนใน `db.go`
   - สร้าง API `GET/POST/DELETE /api/v1/quotations/templates` ใน `pricing/templates_handler.go`
   - เชื่อมต่อ `QuotationManager.tsx` ให้บันทึกและดึงเทมเพลตกลางจากฐานข้อมูล PostgreSQL

---

## 2. ผลการตรวจสอบและทดสอบ (QA Verification Results)

| รายการทดสอบ | เครื่องมือ / คำสั่ง | ผลลัพธ์ | รายละเอียด |
| :--- | :--- | :---: | :--- |
| **Pricing Engine Tests** | `go test -v ./pricing/...` | **PASS** | ผ่านครบทั้ง 24 การทดสอบ รวมถึง `TestPaperCostIsPerSheetDirect` |
| **All Backend Tests** | `go test ./...` | **PASS** | ทุกโมดูล (orders, inventory, inbound, auth, pricing) ผ่านสมบูรณ์ |
| **Frontend Unit Tests** | `npm test -- --run` | **PASS** | 34/34 tests ผ่านครบ 100% |
| **Frontend TypeScript** | `npm run typecheck` | **PASS** | `tsc --noEmit` 0 errors |
| **Frontend Production Build** | `npm run build` | **PASS** | Vite build สำเร็จใน 415ms |
| **Zero Unicode Emoji** | Code Audit Regex | **PASS** | ใช้ Lucide Icons เท่านั้น |

---

## 3. รายการไฟล์ที่สร้างและแก้ไข (Modified Files)
- **Database & Backend:**
  - `admin-system/migrations/038_quotation_templates.sql` (NEW)
  - `admin-system/backend/db/db.go`
  - `admin-system/backend/pricing/engine.go`
  - `admin-system/backend/pricing/engine_test.go`
  - `admin-system/backend/pricing/templates_handler.go` (NEW)
  - `admin-system/backend/main.go`
- **Frontend:**
  - `admin-system/frontend/src/features/production/components/tracker/ArtworkFilesCard.tsx`
  - `admin-system/frontend/src/features/production/ShopFloorTracker.tsx`
  - `admin-system/frontend/src/features/orders/components/CreateOrderPage.tsx`
  - `admin-system/frontend/src/features/pricing/components/PaperAndCoverSection.tsx`
  - `admin-system/frontend/src/features/pricing/components/QuotationManager.tsx`
