# รายงานการพัฒนา: ระบบบันทึกและผูกต้นทุนหมึกพิมพ์จริงลงในเครื่องจักร (Equipment Ink Cost Persistence)

**วันที่:** 12 กันยายน 2026  
**ผู้รับผิดชอบ:** @somsing-coordinator & Full-Stack Team  
**สถานะ:** เสร็จสมบูรณ์ (Production Ready & Verified)  

---

## 1. ปัญหาเดิมที่ตรวจพบ (Root Cause Analysis)
1. **ขาดฟิลด์จัดเก็บต้นทุนหมึกจริงในเครื่องจักร:** เดิมโมเดล `Equipment` และ Go struct ไม่มีฟิลด์สำหรับเก็บต้นทุนหมึกต่อแผ่น (`colorInkCost`, `bwInkCost`, `linkedInkCostPerPage`)
2. **การตกไปใช้ค่า Default OEM (15.05 LAK):** ในหน้าจอ `EquipmentDetailsPage.tsx` การคำนวณต้นทุนการพิมพ์ต่อแผ่นเคยพึ่งพาการ Fetch ข้อมูล Inbound และคลังสินค้าหมึกแบบ Dynamic ตลอดเวลา เมื่อข้อมูลยังโหลดไม่เสร็จหรือรหัส SKU ไม่ตรง (เช่น `INB-7677` vs `INK-9826`) ระบบจะ Fallback ไปคิดจากหมึก OEM ดั้งเดิม 4 สี (3.65 + 3.80 + 3.80 + 3.80 = 15.05 LAK หรือปัดเป็น 15 LAK) ซึ่งไม่ถูกต้องตามที่ผู้ใช้ทักท้วง
3. **การสูญหายของผลการคำนวณ 4 สีจริง:** เมื่อช่างพิมพ์หรือผู้ดูแลระบบทำการผูกหมึกใน `PrinterInkComparisonCard.tsx` ได้ต้นทุนหมึกจริง 60.17 LAK (K: 12.67, C: 15.83, M: 15.83, Y: 15.83) ข้อมูลนี้ไม่ถูกบันทึกเข้าฐานข้อมูลถาวรของเครื่องจักร ทำให้เมื่อเปิดหน้าอื่นหรือรีเฟรช ต้นทุนใน Card 3 กลับไปเป็น 15 LAK

---

## 2. โซลูชันสถาปัตยกรรมที่ดำเนินการ (Architectural Implementation)

### 2.1 Backend Persistence (`admin-system/backend/inventory/assets.go`)
- เพิ่มฟิลด์ลงใน `EquipmentItem` Go struct:
  - `ColorInkCost float64`
  - `BwInkCost float64`
  - `LinkedInkCostPerPage float64`
  - `InkCostPerPage float64`
- ปรับปรุง `HandleUpdateAssetV1` เพื่อ Merge และคงค่าฟิลด์ต้นทุนหมึกพิมพ์เหล่านี้เมื่อมีการส่งอัปเดตเครื่องจักร

### 2.2 Shared Type Safety (`types/generated/inventory.ts` & `features/equipment/types.ts`)
- เพิ่ม `colorInkCost`, `bwInkCost`, `linkedInkCostPerPage`, `inkCostPerPage` ใน interface ทั้งสองฝั่ง เพื่อให้ Type Safety ตรงกัน 100% ตามข้อกำหนด `admin-architecture-guard.md`

### 2.3 Calculation Engine (`utils/machineCostCalculator.ts`)
- ปรับปรุง `calculateEquipmentPrintCost` ให้รวมต้นทุนหมึกแต่ละ Slot โดยไม่ปัดเศษก่อนผลรวม เพื่อให้ได้ยอด **60.17 LAK** ที่ตรงกัน 100% กับหน้าจอ `PrinterInkComparisonCard.tsx`
- เพิ่มการคืนค่า `bwRatePerPage` (เช่น 12.67 LAK) และรายละเอียด `inkSlotsBreakdown` สำหรับแต่ละสี
- Export ฟังก์ชันจัดรูปแบบความแม่นยำสูง `formatUnitPrecisionLAK`

### 2.4 Auto-Sync ในการผูกหมึก (`PrinterInkComparisonCard.tsx`)
- เพิ่ม `useEffect` คอยตรวจจับเมื่อมีการคำนวณ `roundedTotalActualCost` สำเร็จ จะทำการเรียก `updateEquipment(printerItem.id, { colorInkCost, bwInkCost, linkedInkCostPerPage, ... })` โดยอัตโนมัติ
- ปรับปรุงปุ่ม `handleSyncToEngine` ให้บันทึกข้อมูลเข้าเครื่องจักรทันที พร้อมแจ้งเตือน Toast สองภาษา (ລາວ / English)

### 2.5 เชื่อมโยง Card 3 & Card 4 โดยตรง (`EquipmentDetailsPage.tsx`)
- Card 3 ดึงต้นทุนหมึกจาก `machine.colorInkCost` และ fallback อย่างมั่นคง ทำให้ได้ตัวเลข **+LAK 60.17 / ໜ້າ A4** เสมอ
- แสดงรายละเอียดแจกแจง 4 สีด้านล่าง: `Black: LAK 12.67 | Cyan: LAK 15.83 | Magenta: LAK 15.83 | Yellow: LAK 15.83`
- Card 4 คำนวณยอดรวมสุทธิสมบูรณ์:
  $$\text{Grand Total} = \text{Depreciation (62 LAK)} + \text{Wear (78 LAK)} + \text{Ink (60.17 LAK)} = \mathbf{200.17\text{ LAK / ໜ້າ}}$$

---

## 3. ผลการทดสอบและตรวจสอบคุณภาพ (Verification & QA Report)

| รายการทดสอบ | ผลลัพธ์ | รายละเอียด |
|---|---|---|
| **Go Backend Build & Tests** | ผ่าน (Pass) | `cd admin-system/backend && go test ./...` สำเร็จทุกแพ็กเกจ (Exit code 0) |
| **Frontend TypeScript Check** | ผ่าน (Pass) | `npx tsc --noEmit` ไม่มี Error ใดๆ (Exit code 0) |
| **Unit Tests (Vitest / tsx)** | ผ่าน (Pass) | ผ่านครบ 27/27 Tests รวมถึงเครื่องจักร Epson L15150 และ Brother MFC-J2740DW |
| **Production Build (Vite)** | ผ่าน (Pass) | `npm run build` สำเร็จเรียบร้อย (358ms) |
| **Formula Integrity Guard** | ผ่าน (Pass) | สูตรครบถ้วน (Depreciation + Wear + Ink) ไม่มีการ Hardcode 15 LAK |
