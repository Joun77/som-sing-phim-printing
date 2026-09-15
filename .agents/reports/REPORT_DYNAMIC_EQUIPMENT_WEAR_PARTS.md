# Som Sing Phim - Dynamic Equipment Wear Parts & Cost Calculation Report

**Date:** 2026-09-13  
**Status:** Completed  
**Author:** Som-Zing Coordinator & Engineering Team  
**Task Reference:** `.agents/tasks/TASK_DYNAMIC_EQUIPMENT_WEAR_PARTS.md`

---

## 1. Executive Summary
ระบบจัดการเครื่องจักรและอุปกรณ์ (Machinery Management) ในหน้ารายละเอียดเครื่องจักร (`EquipmentDetailsPage.tsx`) ได้รับการปรับปรุงโครงสร้างจากเดิมที่จำกัดเฉพาะชุดอะไหล่ 5 รายการของเครื่องพิมพ์ ให้กลายเป็น **Dynamic Equipment Wear Parts System** อย่างสมบูรณ์:
1. **Dynamic By Machinery Category:** อะไหล่สิ้นเปลืองเริ่มต้นจะดึงสเปกจริงจาก Inbound และแยกตามประเภทเครื่องจักรโดยอัตโนมัติ:
   - **Laser Printer:** 5 ชิ้น (Drum Unit, Fuser Unit, Transfer Belt, Pickup Roller, Waste Toner Box) - หน่วยนับ `Pages`
   - **Inkjet Printer:** 4 ชิ้น (Maintenance Box, Pickup Roller, Carriage Belt, Printhead) - หน่วยนับ `Pages`
   - **Guillotine Cutter:** 3 ชิ้น (Sharpening Cost, Blade Replacement, Cutting Stick) - หน่วยนับ `Cuts` (ฮอบตัด)
   - **Laminator:** 2 ชิ้น (Silicone Heating Roller, Teflon/Anti-static Blade) - หน่วยนับ `Meters` (ແມັດ)
   - **Book Binder:** 2 ชิ้น (Milling Cutter Teeth Blade, Hot-Melt Tank & Scraper) - หน่วยนับ `Books` (ຫົວ)
2. **Full Dynamic CRUD Operations:** ผู้ใช้สามารถ:
   - **ເພີ່ມອະໄຫຼ່ໃໝ່ (Add Part):** เพิ่มอะไหล่ชิ้นที่ 6, 7 หรืออะไหล่เฉพาะทางได้ไม่จำกัด พร้อมระบุชื่อ (EN/LO), ราคาซื้อ, อายุการใช้งาน และหน่วยนับ
   - **ແກ້ໄຂອະໄຫຼ່ (Inline Edit):** แก้ไขชื่อ ราคา และอายุการใช้งานได้ทันทีในตาราง พร้อมคำนวณ Wear Cost Per Unit แบบเรียลไทม์
   - **ລຶບອະໄຫຼ່ (Delete Part):** ลบอะไหล่ที่ไม่ต้องการ พร้อมกล่องยืนยัน และระบบจะคำนวณอัตราสึกหรอรวมและต้นทุนต่อหน่วยใหม่ทันที
   - **ປ່ຽນອະໄຫຼ່ໃໝ່ (Replace Part):** รีเซ็ตอายุการใช้งานของอะไหล่ชิ้นนั้นเมื่อมีการเปลี่ยนอะไหล่จริง
3. **Dynamic Formula Consistency:**
   $$\text{Machine Wear Rate} = \sum_{i=1}^n \frac{\text{Cost}_i}{\text{Lifespan}_i}$$
   $$\text{Net Machine Cost Per Unit} = \text{Depreciation} + \text{Wear Rate}$$
   ระบบ `calculateMachineWearPartsRate` และ `getEquipmentAccurateCost` จะตรวจเช็ค `eq.components` เป็นอันดับแรก หากมีรายการอะไหล่จะคำนวณรวมโดยตรง ทำให้รองรับการเพิ่มหรือลบอะไหล่ได้อย่างแม่นยำ 100%

---

## 2. Verification & Automated Test Results

### 2.1 Frontend Unit Tests (37/37 Passed)
```bash
npm test -- --run
```
- costCalculator Unit Tests: 4 passed
- Detail Views Verification & Spec Alignment Tests: 9 passed
- CustomDimensionInput Unit & Dimension Utilities: 3 passed
- impositionPdfGenerator Unit Tests: 1 passed
- machineCostCalculator Unit Tests: 13 passed (including dynamic wear parts test with Cutter add/delete parts & custom parts)
- Stock Discharge & Searchable Combobox Unit Tests: 5 passed
- zipDownloader Unit Tests: 2 passed
- **Total: 37 passed, 0 failed**

### 2.2 TypeScript Typecheck (0 Errors)
```bash
npm run typecheck
# tsc --noEmit (Exit code 0)
```

### 2.3 Backend Tests (Go)
```bash
go test ./...
# All packages passed (Exit code 0)
```

---

## 3. Delivery Package Files
- `admin-system/frontend/src/features/equipment/types.ts`: ปรับปรุง `EquipmentComponent` ให้มี `id`, `name`, `nameLo`, `cost`, `lifeVal`, `unitLabel`, `usage`, `threshold`, `costPerUnit`
- `admin-system/frontend/src/types.ts`: เพิ่ม `updateEquipmentComponents` ลงใน `AppContextValue`
- `admin-system/frontend/src/utils/machineCostCalculator.ts`: อัปเดต `calculateMachineWearPartsRate` และ `getEquipmentAccurateCost` ให้รองรับ Dynamic `components` และ `totalLifespanUnits`
- `admin-system/frontend/src/store/AppContext.tsx`: แมป Inbound เครื่องจักรเข้าสู่ `components` อัตโนมัติ พร้อมฟังก์ชัน `updateEquipmentComponents` ซิงก์ LocalStorage & Backend API
- `admin-system/frontend/src/features/equipment/components/details/EquipmentDetailsPage.tsx`: เพิ่ม Add / Edit / Delete Wear Parts พร้อม UI แบบ Dynamic คลีน ไร้ Unicode Emojis
- `admin-system/frontend/src/utils/machineCostCalculator.test.ts`: เพิ่ม Unit Test ทดสอบการคำนวณ Wear Rate แบบ Dynamic
