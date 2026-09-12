# รายงานผลการพัฒนาและส่งมอบงาน: ระบบนำเข้าสินค้า คลังสินค้า เครื่องจักร และข้อมูลพื้นฐานระบบ

- **รหัสงาน:** `TASK-2026-09-INBOUND-INVENTORY-EQUIPMENT-INTEGRATION`
- **ผู้ประสานงาน:** `somsing-coordinator`
- **ทีมผู้พัฒนา:** `somsing-formula-analyst`, `somsing-system-analyzer`, `somsing-ui-ux-designer`, `somsing-database-analyst`, `somsing-backend-developer`, `somsing-frontend-developer`, `somsing-security-specialist`, `somsing-delivery-lead`, `somsing-qa-orchestrator`
- **สถานะ:** COMPLETED (ผ่านการทดสอบ 100% ทั้ง Backend & Frontend)
- **วันที่ส่งมอบ:** 2026-09-11

---

## 1. วัตถุประสงค์และปัญหาที่ได้รับการแก้ไข

1. **จัดระเบียบหน้านำเข้าสินค้า (Inbound Procurement Workspace):**
   - รวมและปรับโครงสร้างแบบฟอร์มให้เหลือ **8 หมวดหลักตรงตามเอกสาร Google Doc ของโรงพิมพ์ 100%** (เครื่องจักร 5 ประเภท + วัสดุ 7 หมวด + อะไหล่ซ่อมบำรุง) แทนระบบเดิมที่มี 11 หมวด
2. **ระบบนำเข้าอะไหล่ซ่อมบำรุง (Maintenance & Spare Parts Restocking):**
   - มีหมวดนำเข้าอะไหล่เข้าคลังสินค้าโดยตรง พร้อมระบุเครื่องจักรเป้าหมายที่ผูกไว้ (`assigned_printer_id`)
   - ระบบเบิกเปลี่ยนอะไหล่บนหน้าเครื่องจักร (`QuickSwapConsumableModal.tsx`) ทำการตัดสต็อกในคลังสินค้าจริง และรีเซ็ตมิเตอร์นับรอบของอะไหล่ชิ้นนั้นบนเครื่องจักรกลับเป็น 0
3. **การคำนวณต้นทุนเครื่องจักรแบบ Polymorphic Costing:**
   - **Guillotine Cutter:** ค่าตัดเหมาคงที่ 10,000 LAK ต่อจ็อบ
   - **Laser / Inkjet:** คิดต้นทุนต่อหน้า A4 อิงตามค่าเสื่อม + อะไหล่สิ้นเปลือง + ค่าไฟ 1,700 LAK/kWh
   - **Roll Plotter & Laminator:** คิดต้นทุนต่อเมตร (LAK/m)
   - **Binder:** คิดต้นทุนต่อเล่ม (LAK/book)
4. **การกู้คืนระบบช่องสี OEM Baseline Slots (Bento Grid) ในฟอร์มเครื่องจักร:**
   - นำคอมโพเนนต์ `ColorSlotConfigurator` และ Bento Card สำหรับกำหนด OEM SKU Code, ความจุ (ml/g), และ ISO Yield A4 กลับมาติดตั้งในฟอร์ม Laser และ Inkjet ครบถ้วน

---

## 2. รายละเอียดสถาปัตยกรรมและการปรับปรุงรายโมดูล

### 2.1 Database & Migrations
- **`admin-system/migrations/036_spare_parts_and_wear_part_logs.sql`:**
  - เพิ่มคอลัมน์ `assigned_printer_id VARCHAR(50)` พร้อม Index บนตาราง `materials`
  - สร้างตาราง `machine_wear_part_logs` สำหรับบันทึกประวัติการเปลี่ยนอะไหล่ วันที่ ช่างผู้รับผิดชอบ และมิเตอร์เครื่อง

### 2.2 Backend & Pricing Engine (Go)
- **`admin-system/backend/main.go` & `settings/wear_parts.go`:**
  - เพิ่ม API `POST /api/v1/equipment/:id/install-part` ทำ Database Transaction (`tx.Begin()`) ตัดสต็อก `materials`, รีเซ็ต `machine_wear_parts.current_counter = 0` และลงบันทึกใน `machine_wear_part_logs`
- **`admin-system/backend/pricing/engine.go`:**
  - กำหนดค่าไฟมาตรฐาน `StandardElectricityRateLAK = 1700.0`
  - กำหนดค่าตัดเหมา `GuillotineFlatCuttingFeeLAK = 10000.0`
  - ตรรกะคำนวณ Imposition แผ่นใหญ่ $31 \times 43"$ และ $24 \times 35"$ พร้อมขอบตัดเสีย
  - ตรรกะคำนวณต้นทุนแผ่นบอร์ดแข็งต่อตารางเมตร ($1220 \times 2440\text{ mm} = 2.97\text{ m}^2$)

### 2.3 Frontend UI/UX (React + TypeScript)
- **`admin-system/frontend/src/features/inventory/components/StockTable.tsx`:**
  - แก้ไขการ Destructure prop `onIssuePart` ใน `StockTable` ป้องกัน TypeScript Error
- **`admin-system/frontend/src/features/inbound/components/ImportForm.tsx`:**
  - ปรับการคำนวณ Live Calculation สำหรับเครื่องจักรให้ใช้ `machineExpectedLife`
  - ปรับปรุงฟังก์ชัน `transformItemToPayload` ให้แมปสเปกของเครื่องจักร unified `MACHINERY` ทั้ง 5 ประเภท และตัดโค้ดเก่าที่ตกค้าง
- **`admin-system/frontend/src/features/inbound/components/forms/BatchSidebar.tsx`:**
  - แก้ไข fallback label ในแถบรายการสินค้าให้ใช้ `machineModel` และ `machineBrand`
- **`admin-system/frontend/src/features/inbound/components/forms/OtherSpecsForms.tsx`:**
  - ติดตั้งคอมโพเนนต์ `ColorConfigBentoSection` นำ `ColorSlotConfigurator` และชุดการ์ด Bento OEM Baseline Slots กลับมาแสดงผลในฟอร์ม Laser และ Inkjet
- **`admin-system/frontend/src/features/inventory/components/details/DynamicSpecDetail.tsx`:**
  - แสดงผลสเปกละเอียดครบทั้ง 8 หมวด + อะไหล่ซ่อมบำรุง
- **`admin-system/frontend/src/features/equipment/components/details/EquipmentDetailsPage.tsx`:**
  - แดชบอร์ดติดตามสภาพอะไหล่ 5 ชิ้น พร้อม Progress Bar แสดงสถานะสี (เขียว/ส้ม/แดง)
  - เชื่อมต่อ `QuickSwapConsumableModal.tsx` ตัดสต็อกคลังจริง

---

## 3. ผลการทดสอบและมาตรการควบคุมคุณภาพ (QA Verification Results)

| การทดสอบ | คำสั่งทดสอบ | ผลการตรวจสอบ | ผลลัพธ์ |
| :--- | :--- | :--- | :---: |
| **Backend Go Unit Tests** | `go test ./...` | ผ่านทุกแพ็กเกจ (auth, cache, catalog, dashboard, finance, inventory, orders, preflight, pricing, spoilage, suppliers) | PASS (100%) |
| **Frontend TypeScript Check** | `npm run typecheck` (`tsc --noEmit`) | 0 Type Errors ทั่วทั้งโปรเจกต์ | PASS (0 Error) |
| **Frontend Production Build** | `npm run build` (`vite build`) | ผ่านการแปลงและ Bundle 2,288 Modules สมบูรณ์ | PASS (0 Error) |
| **Frontend Unit Tests** | `npm run test` | ผ่านทั้ง 14 ชุดทดสอบ (costCalculator, impositionPdf, machineCost, zipDownloader) | PASS (14/14) |
| **Stock Deduction Transaction** | API Verification | ตัดสต็อกอะไหล่ใน `materials` และรีเซ็ต `current_counter = 0` ใน `machine_wear_parts` พร้อมบันทึกลง `machine_wear_part_logs` | PASS (100%) |
