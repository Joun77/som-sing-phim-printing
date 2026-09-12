# รายงานการปรับปรุงโครงสร้างต้นทุนการพิมพ์และถอดแยกคอมโพเนนต์ใบเก็บเงิน/ใบรับเงิน (Report: Quotation Direct Print & Customer Modal Decoupling)

**วันที่:** 2026-09-11  
**ผู้รับผิดชอบ:** Som Sing Coordinator & Engineering Team  
**สถานะ:** ผ่านการตรวจรับ 100% (Passed QA Acceptance Criteria)

---

## 1. สรุปผลการดำเนินงาน (Executive Summary)

1. **แก้ไขความถูกต้องของต้นทุนการพิมพ์ (Print & Ink Cost Engine) ซิงก์ LAK 155:**
   - **ตัดค่าไฟฮาร์ดโค้ด 40 LAK:** ลบตรรกะ `electricityCost += Math.round(allocPages * sideFactor * 40)` ใน `QuotationManager.tsx` และ `ItemSpecConfigurator.tsx`
   - **ซิงก์ต้นทุนการพิมพ์รวมให้ตรงกับหน้าเลือกเครื่องพิมพ์ (ຕົ້ນທຶນພິມລວມ: LAK 155 /ໜ້າ):**
     - เรตเครื่องจักร/อะไหล่ (`netCostPerUnit` / `wearAllowancePerUnit`): **LAK 78**
     - เรตน้ำหมึกมาตรฐาน ISO 5% (`linkedInkRatePerPage`): **LAK 77**
     - ต้นทุนการพิมพ์รวม (`finalCostPerPage`): **LAK 155** (`78 + 77 = 155`)
   - **เชื่อมโยงฟังก์ชันคำนวณ:** ใน `calculateItemFinancials`, `computeChannel`, `ManualPrinterAllocator` และ `availablePrinters` ให้ดึงข้อมูลผ่าน `calculateEquipmentPrintCost` ตัวเดียวกับ `PrinterSelectorModal` ทำให้ตัวเลขตรงกัน 100%
   - **ปรับปรุงป้ายกำกับ UI:** ปรับข้อความ 3. จอมแสดงผลจาก "ຈັກພິມ & ໄຟຟ້າ" เป็น "3. ເຄື່ອງຈັກ & ອາໄຫຼ່ (Machine Overhead)" และแสดง "ຕົ້ນທຶນພິມລວມ: LAK 155 / ແຜ່ນ"

2. **ถอดแยก `QuotationCustomerModal.tsx` ออกจาก `QuotationManager.tsx`:**
   - ถอด `import { QuotationCustomerModal }` และ `import { QuotationCustomerView }` ออกจาก `QuotationManager.tsx`
   - ลบ State `isCustomerModalOpen` และตัด JSX Modal ออกจากหน้าจอ
   - ปรับ Action Buttons ในขั้นตอนสุดท้ายให้กระชับ ชัดเจน:
     - `ຢືນຢັນສັ່ງຜະລິດ (Confirm Order)` เป็นปุ่มหลัก (Primary Button)
     - `ບັນທຶກໃບສະເໜີລາຄາ (Save Quotation)` เป็นปุ่มรอง

---

## 2. ผลการตรวจสอบและทดสอบระบบ (Verification Results)

| รายการตรวจสอบ | ผลลัพธ์ | รายละเอียด |
| :--- | :---: | :--- |
| **Unit Tests (Vitest/Node)** |  **ผ่าน 100%** | ผ่าน 26/26 tests (`costCalculator`, `machineCostCalculator`, `detailViewsVerification`, ฯลฯ) |
| **TypeScript Typecheck** |  **ผ่าน 100%** | `npx tsc --noEmit` ผ่าน 0 errors |
| **Production Build** |  **ผ่าน 100%** | `npm run build` ผ่านสมบูรณ์ (372ms) |
| **Emoji Audit** |  **ผ่าน 100%** | ใช้ Lucide React Icons เท่านั้น ไม่มี Unicode Emoji ใน UI |

---

## 3. ไฟล์ที่มีการแก้ไข (Modified Files)
- [QuotationManager.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/QuotationManager.tsx)
- [ManualPrinterAllocator.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/orders/components/ManualPrinterAllocator.tsx)
- [ItemSpecConfigurator.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx)
- [CreateOrderPage.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/orders/components/CreateOrderPage.tsx)
- [TASK_QUOTATION_PRINT_COST_SYNC.md](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/tasks/TASK_QUOTATION_PRINT_COST_SYNC.md)
