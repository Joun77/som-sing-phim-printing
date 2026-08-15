# 📋 Task Plan: Frontend Refinement, Dynamic Pricing Hook & Strict EN/LO Localization

เอกสารสั่งงานสำหรับ Google Antigravity เพื่อดำเนินการปรับปรุงสถาปัตยกรรมระบบขั้นสูง เชื่อมโยง Pricing Engine และจัดระเบียบระบบภาษา (English & Lao) ให้ได้มาตรฐาน Production-Grade

---

## 🎯 วัตถุประสงค์หลัก (Objectives)
1. **Strict Localization (EN & LO Only):** กวาดล้างข้อความ Hardcoded ใน UI และข้อมูล Mock ให้รองรับเฉพาะภาษาลาว (`lo`) และภาษาอังกฤษ (`en`) ผ่าน `i18n` 100%
2. **Backend Pricing API Integration:** ปรับ `ItemSpecConfigurator` ใน Frontend ให้เรียกคำนวณราคาผ่าน Go Backend API (`/api/v1/pricing/calculate`)
3. **Modular State Management:** ทยอยแยก `AppContext.tsx` ไปเป็น Zustand Stores แบบแยกตามโดเมน (`useOrderStore`, `useInventoryStore`, ฯลฯ)
4. **Generic Spec Component Unification:** รวมฟอร์มและหน้ารายละเอียดสเปคที่ซ้ำซ้อนใน `inventory` ให้เป็น Dynamic Component เดียว

---

## 🚦 กฎการทำงานแบบ Strict Execution (Agent Operating Rules)
- 🛑 **ห้ามข้ามขั้นตอน (Strict Sequential Execution):** ต้องทำทีละ Phase ตามลำดับ
- 🛑 **หยุดรอคำสั่ง (Pause & Confirm):** เมื่อจบแต่ละ Phase ต้องหยุดทำงานและขึ้นเครื่องหมาย `🛑 [WAIT FOR USER]` เพื่อรอการอนุมัติก่อนเริ่ม Phase ถัดไป
- 🛑 **รายงานผลการเปลี่ยนแปลง (Progress Report):** ทุกครั้งที่ทำเสร็จในแต่ละ Phase ต้องสรุปไฟล์ที่แก้ไข รายการที่ปรับปรุง และผลการทดสอบ

---

## 📌 แผนการดำเนินงานรายเฟส (Phased Implementation Plan)

### 🔹 Phase 1: Language Audit & Strict EN/LO Localization
**เป้าหมาย:** ตรวจสอบและทำให้ระบบรองรับเฉพาะภาษาลาวและอังกฤษอย่างสมบูรณ์
1. สแกนไฟล์ทั้งหมดใน `admin-system/frontend/src/` เพื่อหาข้อความ Hardcoded (ทั้งภาษาไทย และข้อความดิบที่ไม่ได้ผ่าน `t()`)
2. อัปเดตคีย์การแปลใน `src/locales/lo.json` และ `src/locales/en.json` ให้ครอบคลุมทุกหน้า ทุกปุ่ม ทุกหัวตาราง และ Modal
3. ปรับ Mock Data (`sampleInboundData.ts` ฯลฯ) ให้ใช้ภาษาลาวและอังกฤษเท่านั้น
4. **Verification:** รันแอปพลิเคชัน ทดสอบสลับภาษา `lo` ↔ `en` ตรวจสอบว่าไม่มีภาษาอื่นหลุดรอดมา และไม่มีข้อความแสดงเป็น Key หลุดออกมา
🛑 `[WAIT FOR USER APPROVAL FOR PHASE 2]`

---

### 🔹 Phase 2: Connect `ItemSpecConfigurator` with Go Backend Pricing API
**เป้าหมาย:** ให้ Frontend คำนวณราคาผ่าน Go Pricing Engine เป็น Single Source of Truth
1. สร้าง API Client/Service function ใน `src/features/pricing/api/pricingApi.ts` เพื่อเรียก `POST /api/v1/pricing/calculate`
2. ปรับปรุง `src/features/orders/components/ItemSpecConfigurator.tsx`:
   - ส่งพารามิเตอร์ `Quantity`, `SetupCost`, `FinishingCost`, `BaseProfitPct`, และสเปคกระดาษ/หมึก ไปยัง Backend
   - แสดงผลลัพธ์ `FactorS`, `UnitCost`, `TotalCost`, `SellingPrice`, `UnitPrice` ที่ได้รับจาก Backend
   - เพิ่ม Debounce ในการเรียก API เมื่อผู้ใช้พิมพ์เปลี่ยนค่าตัวเลข
3. **Verification:** ทดสอบกรอกสเปค 1 แผ่น (เช็กค่า SetupCost), 500 แผ่น (เช็ก Volume Discount 10%), 1000+ แผ่น (เช็ก Volume Discount 20%)
🛑 `[WAIT FOR USER APPROVAL FOR PHASE 3]`

---

### 🔹 Phase 3: Modularize Global Store (Zustand Migration)
**เป้าหมาย:** ลดภาระ Rerender ของแอปจาก `AppContext.tsx` ขนาดใหญ่
1. ติดตั้ง/ตรวจสอบ Library `zustand` ใน `admin-system/frontend`
2. แยก Stores ออกเป็น:
   - `src/store/useInventoryStore.ts` (จัดการ Items, Inbound, Lots)
   - `src/store/useOrderStore.ts` (จัดการ Orders, Quotations, Production Status)
   - `src/store/useAppConfigStore.ts` (จัดการ Currency Rates, Theme, System Settings)
3. ปรับให้ Components ในแต่ละ Feature ดึง State เฉพาะ Store ที่เกี่ยวข้อง
4. **Verification:** ทดสอบ CRUD ข้อมูลสต็อก และการเปลี่ยนสถานะใน Production Board ต้องอัปเดตเรียลไทม์โดยหน้าจออื่นไม่ Rerender ซ้ำซ้อน
🛑 `[WAIT FOR USER APPROVAL FOR PHASE 4]`

---

### 🔹 Phase 4: Consolidate Spec Details & Forms into Generic Components
**เป้าหมาย:** ลด Component Duplication ในฟีเจอร์ `inventory`
1. รวม `PaperSpecDetail`, `InkSpecDetail`, `PrinterSpecDetail`, `GenericSpecDetail` เข้าสู่ `DynamicSpecDetail.tsx`
2. รวม `PaperForm`, `InkSetForm`, `FinishingForm` เข้าสู่ `DynamicSpecForm.tsx` โดยเรนเดอร์ Field ตาม `categoryType`
3. ลบไฟล์ที่ซ้ำซ้อนออก และอัปเดต `index.ts` ใน `src/features/inventory/`
4. **Verification:** ทดสอบเปิดดูและแก้ไขสเปคของ กระดาษ, หมึก, และเครื่องจักร ว่าแสดงผลฟิลด์ถูกต้องครบถ้วน
🛑 `[WAIT FOR USER APPROVAL FOR FINAL REPORT]`

---

## 📊 Phase 5: Final Verification & Summary Report
- [ ] รัน TypeScript Typecheck (`tsc --noEmit`) และ Build Check (`npm run build`)
- [ ] รัน Go Backend Tests (`go test ./...`)
- [ ] สร้างไฟล์รายงานสรุปผล `refactor_phase2_summary_report.md` สรุปรายการไฟล์ที่สร้าง แก้ไข และลบทั้งหมด พร้อมคำแนะนำในการ Deploy