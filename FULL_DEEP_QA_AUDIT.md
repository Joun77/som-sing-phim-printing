# 🔬 MASTER QA DEEP AUDIT & VERIFICATION SPECIFICATION
**Target System:** Som Sing Phim Full-Stack Printing Platform
**Auditing Agent:** Principal QA Architect & Systems Precision Auditor
**Project Structure:**
- Go Backend & DB Migrations: `admin-system/backend/`, `admin-system/migrations/`, `admin-system/schema.sql`
- Admin System Frontend: `admin-system/frontend/`
- Customer Service Frontend: `customer-service/`

---

## 🎯 SECTION 1: SYSTEM ARCHITECTURE & CODEBASE TARGET MAP

### 1.1 Backend & Persistence Layer
- `backend/auth/jwt.go`: Auth flow, Token parsing, Expiration, Role claims (Admin vs Staff).
- `backend/pricing/engine.go`, `rates.go`, `handlers.go`, `engine_test.go`: Dynamic pricing algorithms, Currency conversions (LAK/THB/USD), Markup, Tax, and Cost breakdown calculations.
- `backend/inventory/assets.go`, `offcuts.go`, `spoilage/spoilage.go`: Material inventory management, Offcut scrap registration, Spoilage logging, and Asset status transitions.
- `backend/inbound/inbound.go`: Raw material receiving, Baseline vs Compatible Ink registrations, Paper stock additions.
- `backend/orders/handlers.go`, `models.go`, `pdf.go`: Order creation, PDF generation, State machine transitions (Pending -> In Production -> Completed -> Discharged).
- `migrations/001_master_printer_ink_paper_quotation_spec.sql` ถึง `005_inventory_lots_fifo.sql`: Table definitions, Constraints, Foreign keys, Timestamps, and Lot FIFO tracking.

### 1.2 Frontend State & Component Layers
- `admin-system/frontend/src/store/`: `AppContext.tsx`, `useInventoryStore.ts`, `useOrderStore.ts`, `useAppConfigStore.ts`.
- `admin-system/frontend/src/features/inventory/`: `ColorSlotConfigurator.tsx`, `DynamicSpecForm.tsx`, `PrinterInkComparisonCard.tsx`, `StockDischargeModal.tsx`, `OffcutModal.tsx`.
- `admin-system/frontend/src/features/pricing/`: `QuotationManager.tsx`, `pricingApi.ts`.
- `admin-system/frontend/src/features/orders/`: `CreateOrderPage.tsx`, `CustomerOrders.tsx`, `OrderDetailsPage.tsx`.
- `admin-system/frontend/src/locales/`: `lo.json`, `en.json`, `i18n.ts`.
- `customer-service/src/context/ShopContext.tsx`, `pages/CheckoutPage.tsx`, `utils/pricing.ts`, `utils/currency.ts`.

---

## 🔬 SECTION 2: DEEP AUDIT VULNERABILITY VECTORS

### 2.1 Mathematical Precision & Decimal Precision Guardrails
1. **Floating-Point Errors:**
   - ตรวจสอบการใช้ `float64` ใน Go และ `number` ใน JavaScript/TypeScript
   - ค้นหาจุดที่มีการสูญเสียความแม่นยำ (Precision Loss) เช่น `0.1 + 0.2 != 0.3` หรือการคูณหารอัตราแลกเปลี่ยนหลายขั้นตอน
2. **Rounding Mode Consistency:**
   - ตรวจสอบว่าระบบใช้ Rounding Rule ใด (Half Up, Half Even / Banker's Rounding, Truncate)
   - ตรวจสอบความสอดคล้องของการปัดเศษระหว่าง Go Backend กับ TS Frontend ว่าผลลัพธ์สุดท้ายต้องตรงกัน 100% ถึงหลักหน่วย
3. **Multi-Currency Unit Handling:**
   - การแปลงค่าเงิน (LAK เป็นจำนวนเต็มไม่มีทศนิยม, THB/USD มีทศนิยม 2 ตำแหน่ง)
   - การตัดเศษส่วนลด, ภาษี (VAT), และ Margin Markup

### 2.2 Genuine Baseline vs. Compatible Ink Management Engine
1. **Baseline Invariance:**
   - สเปกหมึกแท้ (Volume ml, Yield Pages, Baseline Price) ต้องถูกบันทึกเป็น Reference Data ใน DB และห้ามถูก Overwrite เมื่อมีการเพิ่มหมึกเทียบใน Inbound
2. **Comparison Formulas:**
   - $\text{Cost per ml (Baseline)} = \frac{\text{Baseline Cost}}{\text{Baseline Volume (ml)}}$
   - $\text{Cost per ml (Compatible)} = \frac{\text{Inbound Converted Cost}}{\text{Inbound Volume (ml)}}$
   - $\text{Cost per Page} = \frac{\text{Cost per ml} \times \text{Volume per Page at 5\% Coverage}}{1}$
   - $\text{Cost Savings (\%)} = \frac{\text{Cost per Page (Baseline)} - \text{Cost per Page (Compatible)}}{\text{Cost per Page (Baseline)}} \times 100$
3. **Slot-by-Slot Isolation:**
   - การคำนวณแยกตามสล็อตสี (Cyan, Magenta, Yellow, Black / Custom Spot Colors) ต้องไม่นำปริมาณหรือต้นทุนมาปนกันข้าม Slot

### 2.3 Data Persistence & Full-Stack Lifecycle
1. **Network Disconnect & Refresh Resilience:**
   - ตรวจสอบว่าข้อมูลในฟอร์มและตารางคงอยู่หลังกด Hard Refresh (`Ctrl + F5`)
   - ตรวจสอบการจัดการ LocalStorage / SessionStorage เทียบกับการดึงข้อมูลล่าสุดจาก PostgreSQL API
2. **ACID Transaction & Rollback:**
   - ตรวจสอบว่าเมื่อตัดสต็อกไม่สำเร็จ (เช่น สต็อกไม่พอ) ระบบต้อง Rollback คำสั่งซื้อทันที ไม่ปล่อยให้เกิด Orphan Records

### 2.4 Localization (i18n) & UI/UX Rendering
1. **Translation Integrity:**
   - สแกนหา Missing Keys หรือ Fallback ที่แสดงผลเป็น Key ดิบ (เช่น `inventory.slot_config_error`)
2. **Typography & Script Layout:**
   - ตรวจสอบวรรณยุกต์และสระภาษาลาว/ไทย (ບໍ່, ປ, ຢ, ່, ້, ໊, ໋) ว่าไม่เกิดปัญหาสระลอย สระจม หรือบรรทัดตัดขาดกลางคำในตารางและ Modal

---

## 🧪 SECTION 3: 3 REAL-WORLD STEP-BY-STEP SIMULATION TESTS

### 📌 SCENARIO 1: INBOUND INK & BASELINE COMPARISON ENGINE
- **Execution Steps:**
  1. **Register Baseline:** Admin ตั้งค่าเครื่องพิมพ์ "Epson L-Series" กำหนด Genuine Ink Baseline:
     - Volume: $70\text{ ml}$ | Price: $350,000\text{ LAK}$ | Rated Yield: $4,500\text{ pages}$
  2. **Inbound Compatible Ink:** บันทึกการนำเข้าหมึกเทียบจากต่างประเทศ:
     - Volume: $100\text{ ml}$ | Price: $280\text{ THB}$ | Exchange Rate: $1\text{ THB} = 625.50\text{ LAK}$ | Expected Yield: $6,000\text{ pages}$
  3. **Verification Points:**
     - ตรวจสอบค่าแปลงเงิน: $280 \times 625.50 = 175,140\text{ LAK}$
     - Cost/ml หมึกแท้: $350,000 / 70 = 5,000\text{ LAK/ml}$
     - Cost/ml หมึกเทียบ: $175,140 / 100 = 1,751.40\text{ LAK/ml}$
     - Cost/Page หมึกแท้: $350,000 / 4,500 \approx 77.7778\text{ LAK/page}$
     - Cost/Page หมึกเทียบ: $175,140 / 6,000 = 29.19\text{ LAK/page}$
     - Savings: $\frac{77.7778 - 29.19}{77.7778} \times 100 \approx 62.47\%$
     - **Audit Check:** ตรวจสอบว่า `PrinterInkComparisonCard.tsx` และ Backend API แสดงผลตัวเลขและทศนิยมตรงตามการคำนวณนี้หรือไม่

### 📌 SCENARIO 2: ORDER TO DYNAMIC PRICING & QUOTATION PDF FLOW
- **Execution Steps:**
  1. **Order Input:** ลูกค้าสั่งพิมพ์แผ่นพับ 1,250 เล่ม ผ่าน `customer-service/src/pages/CheckoutPage.tsx`:
     - กระดาษ Art 160 gsm ($250\text{ LAK/แผ่นใหญ่}$)
     - 1 แผ่นใหญ่ตัดได้ 4 แผ่นพับ (ต้องการ $312.5 \rightarrow$ ปัดขึ้นเป็น 313 แผ่นใหญ่)
     - ค่า Spoilage เผื่อเสีย 5% ($313 \times 1.05 = 328.65 \rightarrow$ ปัดขึ้นเป็น 329 แผ่น)
     - พิมพ์ 4 สี (CMYK) หมึกใช้รวม $45.8\text{ ml}$
     - ค่าแรงและค่าตัดตกแต่ง (Labor Mode) $150,000\text{ LAK}$
     - Margin กำไร 25% + VAT 7%
  2. **Audit Verification:**
     - ตรวจสอบ `backend/pricing/engine.go` เทียบกับ `QuotationManager.tsx`
     - ตรวจสอบว่ายอดรวมก่อนภาษี, ภาษี, และยอดสุทธิ ไม่เกิดปัญหาทศนิยมปัดเศษผิดพลาด
     - ตรวจสอบว่าใน `backend/orders/pdf.go` ข้อมูลราคาและรายการวัสดุตรงกับหน้าจอ 100%

### 📌 SCENARIO 3: PRODUCTION RUN, FIFO LOT DISCHARGE & OFFCUT RECOVERY
- **Execution Steps:**
  1. **Dispatch:** สั่งงานพิมพ์เข้า `ProductionBoard.tsx`
  2. **Discharge Stock:** ดำเนินการตัดสต็อกแบบ FIFO:
     - ตัดกระดาษจาก Lot #001 (คงเหลือ 200 แผ่น) และ Lot #002 (ตัดเพิ่มอีก 129 แผ่น)
     - ตัดหมึกพิมพ์รายสล็อตตาม ml จริง
  3. **Register Scrap & Offcuts:**
     - มีกระดาษขอบตัดเหลือ 150 ชิ้น ขนาด $10\times 30\text{ cm}$ บันทึกผ่าน `OffcutModal.tsx`
     - มีงานพิมพ์เสีย 15 แผ่น บันทึกเข้า `spoilage.go`
  4. **Persistence & Refresh Test:**
     - ทำการ Reload/Hard Refresh หน้าต่างเว็บ
     - ตรวจสอบว่าสต็อก Lot #001 ต้องกลายเป็น 0, Lot #002 ถูกหักถูกต้อง, และมีรายการ Offcut ใหม่ปรากฏในระบบอย่างถาวร

---

## 📑 SECTION 4: REQUIRED DETAILED BUG REPORT STRUCTURE

กรุณาสรุปรายงานผลการ Audit ทั้งหมดออกมาตามโครงสร้างมาตรฐานดังนี้:

### 1. Executive Summary & Health Matrix
- ตารางประเมินคะแนนระบบ (1-10) ในหมวด:
  - Calculation Precision & Rounding
  - Ink Baseline vs Compatible Logic
  - Data Persistence & Transaction Safety
  - i18n & Font/Script Stability
  - Code Quality & Security

### 2. Master Bug & Vulnerability Register
| Bug ID | Severity (Critical / High / Medium / Low) | File & Line Target | Component / Function | Flaw Description & Root Cause | Mathematical / Real-World Impact | Exact Recommended Code Fix / Refactor |
|---|---|---|---|---|---|---|

### 3. Scenario Execution & Mathematical Discrepancy Matrix
- แจกแจงผลการทดสอบของ Scenario 1, 2, และ 3:
  - **Verdict:** [PASS] / [FAIL] / [WARNING]
  - **Step-by-Step Numerical Table:** (แสดงค่า Code Output vs Mathematical Exact Value)
  - **Identified Failure Points & State Desyncs**

### 4. Linguistic & UI/UX Flaws Table
| File Path | Language / Component | Issue Type (Missing Key / Mistranslation / Script Cutoff) | Current Text / State | Proposed Correct Text / Layout Fix |
|---|---|---|---|---|

### 5. Prioritized Remediation Roadmap & Verification Checklist
- ลำดับขั้นตอนการแก้ไขตั้งแต่ Critical Fixes ไปจนถึง UI Polish พร้อมคำสั่งสำหรับรัน Test ซ้ำ