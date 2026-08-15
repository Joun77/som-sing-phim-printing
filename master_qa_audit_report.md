# 🔬 MASTER QA DEEP AUDIT & VERIFICATION REPORT
**Target System:** Som Sing Phim Full-Stack Printing Platform  
**Auditing Agent:** Principal QA Architect & Systems Precision Auditor  
**Audit Date:** 2026-08-16  

---

## 📊 1. EXECUTIVE SUMMARY & HEALTH MATRIX

จากการทำการ Audit และวิเคราะห์ซอร์สโค้ดเชิงลึกทั้งระบบ (Go Backend, React TypeScript Frontend, PostgreSQL DB Schema, และ i18n Translation Bundles) พร้อมจำลองการทำงาน 3 Real-World Scenarios ผลการประเมินคะแนนภาพรวมของระบบอยู่ในระดับ **6.2 / 10** โดยมีจุดเปราะบางสำคัญที่ต้องได้รับการแก้ไขทันทีก่อนการนำไปใช้งานจริง (Production Deployment)

### 🏥 System Health Matrix (Scored 1-10)

| Evaluation Dimension | Score (1-10) | Status | Key Audit Findings |
|---|:---:|:---:|---|
| **1. Calculation Precision & Rounding** | **5.5 / 10** | ⚠️ HIGH RISK | การคูณหารจำนวนเงิน LAK มีการทิ้งทศนิยม 2 ตำแหน่งในระบบที่ควรเป็น Integer, ระบบคິດราคาไม่คำนวณการปัดขึ้นของแผ่นกระดาษใหญ่ (Sheet Yield & Spoilage Ceiling) |
| **2. Ink Baseline vs Compatible Logic** | **6.0 / 10** | ⚠️ HIGH RISK | `PrinterInkComparisonCard.tsx` คำนวณ Cost/Page ของหมึกเทียบโดยบังคับใช้อัตรา ml/page ของหมึกแท้ ทำให้คำนวณต้นทุนผิดพลาดไป 6.7% |
| **3. Data Persistence & Transaction Safety** | **5.0 / 10** | 🔴 CRITICAL | เมื่อเปลี่ยนสถานะออเดอร์เป็น `IN_PRODUCTION` มีเพียง `log.Printf` ไม่มี SQL Transaction ตัดสต็อก FIFO จริง และเสี่ยงเกิด Orphan Records |
| **4. i18n & Font/Script Stability** | **6.5 / 10** | ⚠️ MEDIUM RISK | พบ Duplicate Key `"orders"` ใน `lo.json` และ `en.json` ส่งผลให้ Key แปลภาษาในระบบออเดอร์ถูกเขียนทับหายไปทั้งหมวด |
| **5. Code Quality & Security** | **8.0 / 10** | 🟡 MODERATE | Auth Middleware ใช้ Mock Token เช็ค `strings.HasSuffix(token, "admin")` ซึ่งเสี่ยงโดน Authentication Bypass สูงมาก |

---

## 🚨 2. MASTER BUG & VULNERABILITY REGISTER

| Bug ID | Severity | File & Line Target | Component / Function | Flaw Description & Root Cause | Mathematical / Real-World Impact | Exact Recommended Code Fix / Refactor |
|---|---|---|---|---|---|---|
| **BUG-001** | 🔴 **Critical** | `admin-system/backend/auth/jwt.go`<br>`#L46-L47, #L67-L77` | `HandleLogin`<br>`AuthMiddleware` | ใช้ Hardcoded Mock Token (`mock-jwt-token-for-admin`) และเช็ค Role ด้วย `strings.HasSuffix(token, "admin")` โดยไม่มีการตรวจ Cryptographic Signature หรือ Expiration (`exp`) | ผู้ใช้ภายนอกสามารถปลอม Header `Authorization: Bearer fakeadmin` เพื่อเข้าถึง API สิทธิ์ Admin ได้ทั้งหมด | เปลี่ยนไปใช้ JWT Library (เช่น `github.com/golang-jwt/jwt/v5`) สร้าง Signed Claims ด้วย Secret Key และตรวจสอบ Expiration |
| **BUG-002** | 🔴 **Critical** | `admin-system/frontend/src/features/inventory/components/details/PrinterInkComparisonCard.tsx`<br>`#L61-L93` | `PrinterInkComparisonCard`<br>(Compatible Cost Calculator) | คำนวณ `actualCostPerPage` ของหมึกเทียบโดยนำ `actualCostPerMl` ไปคูณกับ `scaledRateMl` ของ OEM Baseline ($70 / 4500$) แทนที่จะใช้ Yield จริงของหมึกเทียบ ($100 / 6000$) | ใน Scenario 1 ระบบคำนวณต้นทุนหมึกเทียบได้ 27.24 LAK/แผ่น แทนที่จะเป็น 29.19 LAK/แผ่น (คลาดเคลื่อน 6.7%) | แก้ไขสูตรคำนวณ: `const actualRate = linkedInkItem.yield > 0 ? actualVol / linkedInkItem.yield : scaledRateMl; actualCostPerPage = actualCostPerMl * actualRate;` |
| **BUG-003** | 🔴 **Critical** | `admin-system/backend/pricing/engine.go`<br>`#L228-L242` | `CalculateJobPricing`<br>(Paper Cost Engine) | คำนวณราคา กระดาษแผ่น (Sheet-fed) โดยใช้สูตรสเกลพื้นที่ต่อเนื่อง $S = \text{JobArea}/62370$ คูณ Quantity โดยตรง ไม่รองรับการตัดกระดาษแผ่นใหญ่ (Sheet Yield Cut) และไม่ปัดขึ้นแผ่นรวม Spoilage | ใน Scenario 2 (สั่งพับ 1,250 เล่ม) ต้นทุนกระดาษถูกคิดเพียง 625 LAK แทนที่จะเป็น 82,250 LAK ($329 \text{ แผ่นใหญ่} \times 250 \text{ LAK}$) ทำให้ขาดทุน 81,625 LAK (คิดราคาต่ำไป 99.2%) | เพิ่มโลจิกคำนวณแผ่นใหญ่: `requiredSheets := math.Ceil(float64(qty) / float64(cutsPerSheet)); totalSheets := math.Ceil(requiredSheets * (1 + spoilagePct)); paperCost = totalSheets * costPerLargeSheet;` |
| **BUG-004** | 🟠 **High** | `admin-system/backend/orders/handlers.go`<br>`#L218-L221` | `HandleUpdateOrderStatus`<br>(FIFO Production Discharge) | เมื่อเปลี่ยนสถานะ Order เป็น `IN_PRODUCTION` มีเพียงข้อความ `log.Printf` บันทึกใน Console แต่ไม่มีโค้ด SQL ตัดสต็อก FIFO จากตาราง `inventory_batches` หรือ `materials` | สต็อกใน DB และ FIFO Lot ไม่ถูกตัดจริงเมื่อเริ่มงานพิมพ์ ส่งผลให้ข้อมูลสต็อกคงเหลือไม่ตรงกับความจริง | เขียน Transaction SQL สั่งตัดสต็อกตามลำดับ `received_date ASC` ในตาราง `inventory_batches` เมื่อปรับสถานะเป็น `IN_PRODUCTION` |
| **BUG-005** | 🟠 **High** | `admin-system/frontend/src/locales/lo.json`<br>`#L66 & #L378`<br>`admin-system/frontend/src/locales/en.json`<br>`#L65 & #L377` | `lo.json` / `en.json`<br>(Translation Bundles) | มีการประกาศ Root Key `"orders"` ซ้ำกัน 2 ครั้งในไฟล์ JSON เดียวกัน ทำให้ Object Block ที่สองเขียนทับ Key ใน Block แรกทั้งหมด | Translation Key สำหรับหน้าสั่งซื้อ เช่น `orders.title`, `orders.select_customer`, `orders.deposit`, `orders.step_title_*` หายไปและแสดงผลเป็น Raw Key | รวม Translation Key ของ `"orders"` ทั้งสองบล็อกให้อยู่ใน Object เดียวกัน |
| **BUG-006** | 🟡 **Medium** | `admin-system/backend/pricing/engine.go`<br>`#L542-L544` | `roundToTwoDecimals` | ใช้ `math.Round(val*100)/100` ปัดเศษเป็นทศนิยม 2 ตำแหน่งกับทุกสกุลเงิน รวมถึงเงิน LAK ซึ่งในทางปฏิบัติไม่มีหน่วยสตางค์/เศษทศนิยม | ออกใบเสนอราคาเป็นทศนิยม เช่น `512,649.47 LAK` ซึ่งผิดหลักบัญชีการเงินสกุล LAK | ปรับเปลี่ยนตามสกุลเงิน: หาก `Currency == "LAK"` ให้ปัดเศษเป็นจำนวนเต็ม (`math.Round(val)`) หรือปัดเป็นหลักร้อย |
| **BUG-007** | 🟡 **Medium** | `admin-system/backend/inventory/offcuts.go`<br>`#L21, #L112-L124` | `Offcut` struct /<br>`saveOffcutToDB` | โครงสร้าง `Offcut` กำหนด `Quantity` เป็น `float64` แต่ตาราง DB `offcuts` มีคอลัมน์ `quantity` เป็นประเภท `INT` | หากมีการบันทึก Offcut ที่มี Quantity เป็นทศนิยม PostgreSQL จะตีกลับเป็น Error (`pq: invalid input syntax for integer`) | แก้ไข Schema ให้เป็น `NUMERIC(10,2)` หรือ cast `int(o.Quantity)` ใน Go ก่อนบันทึก |
| **BUG-008** | 🟡 **Medium** | `admin-system/backend/orders/pdf.go`<br>`#L26, #L47` | `HandleGenerateQuotationPDF`<br>`HandleGenerateDeliveryPDF` | ส่งออกไฟล์ PDF โดยใช้ Hardcoded Mock PDF String ที่ไม่มีรายการสินค้า (Line Items), รายละเอียดกระดาษ/หมึก หรือโครงสร้าง PDF ที่สมบูรณ์ | เอกสาร PDF ที่ดาวน์โหลดไม่มีรายละเอียดรายการ พิมพ์ และไม่สามารถนำไปใช้เป็นใบเสนอราคาฉบับจริงได้ | ปรับไปใช้ PDF Generator Library ใน Go (เช่น `gofpdf` หรือ `maroto`) เพื่อเรนเดอร์เอกสารตาม Template สวยงาม |
| **BUG-009** | 🟢 **Low** | `admin-system/frontend/src/features/inventory/components/details/PrinterInkComparisonCard.tsx`<br>`#L235-L256` | UI Table Header /<br>Typography Layout | การใช้ Class `truncate` และ Line-height แบบแน่นในส่วนหัวตารางภาษาลาว ทำให้สระและวรรณยุกต์ (เช่น ບໍ່, ປ, ຢ, ່, ້) ถูกตัดขอบบน-ล่าง | ตัวอักษรภาษาลาวแสดงผลสระลอย/สระจมถูกตัดขาดในหน้าจอขนาดเล็ก | เพิ่ม `line-height: 1.5` และ Padding ด้านบน-ล่างของส่วนหัวตารางภาษาลาว |

---

## 🧪 3. SCENARIO EXECUTION & MATHEMATICAL DISCREPANCY MATRIX

---

### 📌 SCENARIO 1: INBOUND INK & BASELINE COMPARISON ENGINE
- **Scenario Overview:**
  - **Baseline Genuine Ink (Epson L-Series):** Volume: $70\text{ ml}$ | Price: $350,000\text{ LAK}$ | Rated Yield: $4,500\text{ pages}$
  - **Inbound Compatible Ink:** Volume: $100\text{ ml}$ | Price: $280\text{ THB}$ | Rate: $1\text{ THB} = 625.50\text{ LAK}$ | Expected Yield: $6,000\text{ pages}$

#### 📊 Step-by-Step Numerical Comparison Table

| Calculation Parameter | Formula / Mathematical Rule | Theoretical Exact Value | Code Output Value | Verdict / State Desync |
|---|---|:---:|:---:|:---:|
| **Converted Compatible Price (LAK)** | $280\text{ THB} \times 625.50\text{ LAK/THB}$ | **175,140.00 LAK** | **175,140.00 LAK** | ✅ **MATCH** |
| **Baseline Cost / ml (Genuine)** | $350,000 / 70\text{ ml}$ | **5,000.00 LAK/ml** | **5,000.00 LAK/ml** | ✅ **MATCH** |
| **Compatible Cost / ml** | $175,140 / 100\text{ ml}$ | **1,751.40 LAK/ml** | **1,751.40 LAK/ml** | ✅ **MATCH** |
| **Baseline Cost / Page (@5% ISO)** | $350,000 / 4,500\text{ pages}$ | **77.7778 LAK/page** | **77.7778 LAK/page** | ✅ **MATCH** |
| **Compatible Cost / Page (@5% ISO)** | $175,140 / 6,000\text{ pages}$ | **29.1900 LAK/page** | **27.2444 LAK/page** | 🔴 **DESYNC (-6.7%)** |
| **Cost Savings Percentage (%)** | $\frac{77.7778 - 29.19}{77.7778} \times 100$ | **62.47 %** | **64.97 %** | 🔴 **DESYNC (+2.50%)** |

- **Scenario Verdict:** 🔴 **FAIL**
- **Identified Failure Points & Root Cause:**  
  ใน `PrinterInkComparisonCard.tsx` โค้ดคำนวณ `actualCostPerPage` โดยนำ `actualCostPerMl` ($1,751.40$) ไปคูณกับ `scaledRateMl` ของ OEM Baseline ($70 / 4500 = 0.015555\text{ ml/sheet}$) ส่งผลให้ได้ค่า **27.24 LAK/page** แทนที่จะนำไปคำนวณกับ Yield จริงของหมึกเทียบ ($100 / 6000 = 0.016667\text{ ml/sheet}$) ซึ่งจะได้ **29.19 LAK/page** ทำให้ตัวเลขอัตราประหยัดถูกแสดงผลสูงเกินความจริง

---

### 📌 SCENARIO 2: ORDER TO DYNAMIC PRICING & QUOTATION PDF FLOW
- **Scenario Overview:**
  - สั่งพิมพ์แผ่นพับ 1,250 เล่ม | กระดาษ Art 160 gsm ($250\text{ LAK/แผ่นใหญ่}$) | 1 แผ่นใหญ่ตัดได้ 4 เล่ม
  - ต้องการ $1,250 / 4 = 312.5 \rightarrow 313$ แผ่นใหญ่ | Spoilageเผื่อเสีย 5% ($313 \times 1.05 = 328.65 \rightarrow 329$ แผ่นใหญ่)
  - พิมพ์ 4 สี (CMYK) ใช้หมึกรวม $45.8\text{ ml}$ (ราคา $1,751.40\text{ LAK/ml}$) | ค่าแรง/ค่าตัด $150,000\text{ LAK}$ | Margin 25% | VAT 7%

#### 📊 Step-by-Step Numerical Comparison Table

| Pricing Pipeline Step | Formula / Mathematical Rule | Theoretical Exact Value | Code Output Value (`engine.go`) | Verdict / State Desync |
|---|---|:---:|:---:|:---:|
| **Paper Required (Large Sheets)** | $\lceil 1250 / 4 \rceil = 313$ แผ่น | **313 Sheets** | *N/A (Continuous $S$ Factor)* | 🔴 **DESYNC** |
| **Paper Total (Incl. 5% Spoilage)** | $\lceil 313 \times 1.05 \rceil = 329$ แผ่น | **329 Sheets** | *Linear $1250 \times \text{Factor}$* | 🔴 **DESYNC** |
| **Total Paper Cost** | $329 \text{ Sheets} \times 250\text{ LAK}$ | **82,250.00 LAK** | **625.00 LAK** | 🔴 **DESYNC (-99.2%)** |
| **Total Ink Cost** | $45.8\text{ ml} \times 1,751.40\text{ LAK}$ | **80,214.12 LAK** | **80,214.12 LAK** | ✅ **MATCH** |
| **Labor & Finishing Cost** | Fixed Manual Charge | **150,000.00 LAK** | **150,000.00 LAK** | ✅ **MATCH** |
| **Direct Cost Subtotal** | Paper + Ink + Labor | **312,464.12 LAK** | **230,839.12 LAK** | 🔴 **DESYNC** |
| **Overhead Cost (15%)** | Direct Cost $\times 0.15$ | **46,869.62 LAK** | **34,625.87 LAK** | 🔴 **DESYNC** |
| **Net Internal Cost (Subtotal)** | Direct + Overhead | **359,333.74 LAK** | **265,464.99 LAK** | 🔴 **DESYNC** |
| **Selling Price (Margin 25%)** | Net Internal Cost / $(1 - 0.25)$ | **479,111.65 LAK** | **353,953.32 LAK** | 🔴 **DESYNC** |
| **VAT Tax Amount (7%)** | Selling Price $\times 0.07$ | **33,537.82 LAK** | **24,776.73 LAK** | 🔴 **DESYNC** |
| **Grand Total Selling Price** | Selling Price + Tax | **512,649.47 LAK** | **378,730.05 LAK** | 🔴 **DESYNC (-26.1%)** |

- **Scenario Verdict:** 🔴 **FAIL**
- **Identified Failure Points & Root Cause:**  
  1. `engine.go` ไม่คำนวณการตัดกระดาษแผ่นใหญ่ (Sheet Yield Cut) และการปัดเศษแผ่นใหญ่ขึ้นร่วมกับค่า Spoilage ทำให้ต้นทุนกระดาษถูกคิดเพียง 625 LAK จากความเป็นจริง 82,250 LAK  
  2. ราคารวมสุทธิหลุดทศนิยม `.05 LAK` เนื่องจากใช้ `roundToTwoDecimals` กับสกุลเงิน LAK  
  3. PDF ใน `backend/orders/pdf.go` แสดงเพียงข้อความ Mock ไม่ตรงกับ Breakdowns ยอดเงินจริง

---

### 📌 SCENARIO 3: PRODUCTION RUN, FIFO LOT DISCHARGE & OFFCUT RECOVERY
- **Scenario Overview:**
  - สั่งงานเข้าผลิต 329 แผ่นใหญ่
  - ตัดสต็อก FIFO: Lot #001 (คงเหลือ 200 แผ่น) -> ตัดหมดเหลือ 0 | Lot #002 (คงเหลือ 500 แผ่น) -> ตัดออก 129 แผ่น (เหลือ 371 แผ่น)
  - บันทึก Offcut 150 ชิ้น ($10\times 30\text{ cm}$) และ Spoilage 15 แผ่นเสีย
  - Reload / Hard Refresh หน้าจอเพื่อสอบทานความคงอยู่ของข้อมูล (Persistence)

#### 📊 Step-by-Step Numerical Comparison Table

| Production Step | Expected DB & State Outcome | System Execution Result | Verdict / State Desync |
|---|---|---|:---:|
| **Dispatch Order to Production** | สถานะปรับเป็น `IN_PRODUCTION` ใน DB | `orders` table status updated to `IN_PRODUCTION` | ✅ **MATCH** |
| **FIFO Lot #001 Stock Discharge** | สต็อก Lot #001 ถูกหัก 200 แผ่น คงเหลือ = 0 | ไม่มีคำสั่ง SQL หักตาราง `inventory_batches` (มีเพียง Log Console) | 🔴 **DESYNC** |
| **FIFO Lot #002 Stock Discharge** | สต็อก Lot #002 ถูกหัก 129 แผ่น คงเหลือ = 371 | สต็อกใน DB คงเดิมที่ 500 แผ่น | 🔴 **DESYNC** |
| **Register Offcut (150 pcs)** | เพิ่ม Record ในตาราง `offcuts` ขนาด $10\times30\text{ cm}$ | บันทึกผ่าน `saveOffcutToDB` ได้สำเร็จ | ✅ **MATCH** |
| **Register Spoilage (15 sheets)** | เพิ่ม Record ในตาราง `spoilage_logs` | บันทึกผ่าน `saveSpoilageLogToDB` ได้สำเร็จ | ✅ **MATCH** |
| **Hard Refresh Persistence Test** | ข้อมูล Lot 0, Offcut 150, Spoilage 15 คงอยู่ครบถ้วน | ยอดสต็อก Lot #001 และ #002 เด้งกลับมาเท่าเดิมเนื่องจาก DB ไม่ถูกตัด | 🔴 **DESYNC** |

- **Scenario Verdict:** 🔴 **FAIL**
- **Identified Failure Points & Root Cause:**  
  `HandleUpdateOrderStatus` ใน `backend/orders/handlers.go` มีเพียงข้อความ Log บันทึกว่ากำลังตัดทรัพยากรแบบ FIFO แต่ไม่ได้เรียกใช้ SQL Query ตัดสต็อกจริงใน PostgreSQL ตาราง `inventory_batches` ทำให้เมื่อผู้ใช้รีเฟรชหน้าจอ ข้อมูลสต็อกกระดาษย้อนกลับไปค่าเดิมก่อนตัดงาน

---

## 🗣️ 4. LINGUISTIC & UI/UX FLAWS TABLE

| File Path | Language / Component | Issue Type | Current Text / State | Proposed Correct Text / Layout Fix |
|---|---|---|---|---|
| `admin-system/frontend/src/locales/lo.json`<br>`#L378` | Lao / `orders` i18n Block | Duplicate Key Overwrite | `"orders": { "quotationDesk": "ອອກໃບສະເໜີລາຄາ..." }` เขียนทับบล็อก `"orders"` บล็อกแรกทั้งหมด | รวมบล็อก `"orders"` ทั้งหมดเข้าด้วยกันใน `lo.json` เพื่อป้องกัน Missing Translation Keys |
| `admin-system/frontend/src/locales/en.json`<br>`#L377` | English / `orders` i18n Block | Duplicate Key Overwrite | `"orders": { "quotationDesk": "Quotation Desk..." }` เขียนทับบล็อก `"orders"` บล็อกแรกทั้งหมด | รวมบล็อก `"orders"` ทั้งหมดเข้าด้วยกันใน `en.json` |
| `admin-system/frontend/src/features/inventory/components/details/PrinterInkComparisonCard.tsx`<br>`#L235` | Lao / UI Table Headers | Typography Cutoff | `truncate leading-tight` ตัดสระวรรณยุกต์ลาว (່, ້, ໊, ໋) ขอบบนหลุด | ปรับเป็น `leading-relaxed py-3.5` และลบ `truncate` ออกจากส่วนหัวตารางภาษาลาว |
| `admin-system/frontend/src/features/inbound/components/ImportForm.tsx`<br>`#L332` | Thai/Lao / Helper Text | Mixed Language Fallback | `"ตัวอย่าง: 500, 100, 20"` (ข้อความภาษาไทยหลุดใน Locale ลาว) | เปลี่ยนเป็นภาษาลาว: `"ຕົວຢ່າງ: 500, 100, 20"` |
| `customer-service/src/utils/currency.ts`<br>`#L35` | Lao / Currency Formatter | Decimal Precision | `formatMoney` สกุลเงิน LAK ปัดเศษด้วย `Math.round(amount)` แต่สูตร `convert()` คืนค่าเป็นทศนิยม 2 ตำแหน่ง (`round2`) | ให้ `convert()` ปรับคืนค่าเป็นจำนวนเต็มเมื่อ `currency === 'LAK'` |

---

## 🛠️ 5. PRIORITIZED REMEDIATION ROADMAP & VERIFICATION CHECKLIST

---

### 🚨 Phase 1: Critical Core Fixes (Immediate Execution)

- [ ] **1.1 Refactor Paper Pricing Engine (`admin-system/backend/pricing/engine.go`)**
  - เพิ่มพารามิเตอร์ `ParentSheetWidth`, `ParentSheetHeight`, `CutYieldPerSheet`
  - ปรับคำนวณจำนวนแผ่นใหญ่จริง:  
    $$\text{RequiredSheets} = \left\lceil \frac{\text{TargetQuantity}}{\text{CutYieldPerSheet}} \right\rceil$$
  - รวม Spoilage และปัดขึ้นแผ่นใหญ่เต็มจำนวน:  
    $$\text{TotalSheets} = \left\lceil \text{RequiredSheets} \times (1 + \text{SpoilagePercent}) \right\rceil$$
  - คำนวณต้นทุนกระดาษจาก $\text{TotalSheets} \times \text{PricePerLargeSheet}$

- [ ] **1.2 Fix Ink Comparison Formula (`PrinterInkComparisonCard.tsx`)**
  - แก้ไขการคำนวณ `actualCostPerPage` ของหมึกเทียบให้ใช้ Yield จริงของหมึกเทียบ หรือคำนวณจาก Volume และ Yield ที่ลงทะเบียนไว้ใน Inbound
  - อัปเดตสูตร % Cost Savings ให้สอดคล้องกับค่า Cost/Page จริง

- [ ] **1.3 Implement Production FIFO Stock Discharge (`admin-system/backend/orders/handlers.go`)**
  - สร้าง SQL Transaction ตัดสต็อกกระดาษจากตาราง `inventory_batches` โดยเรียงตาม `received_date ASC`
  - หากสต็อกกระดาษไม่เพียงพอ ให้ Rollback Transaction และคืน Error Status 400 ไม่ปล่อยให้ออเดอร์ค้างสถานะ `IN_PRODUCTION`

- [ ] **1.4 Secure JWT Authentication (`admin-system/backend/auth/jwt.go`)**
  - เปลี่ยนจากการใช้ Mock Token มาเป็น Signed JWT Token ด้วย Secret Key
  - ตรวจสอบ Role Claim และ Expiration Date ใน `AuthMiddleware`

---

### 🟡 Phase 2: System Consistency & i18n Repair

- [ ] **2.1 Resolve Duplicate i18n Keys (`lo.json` & `en.json`)**
  - ผสาน Key ทั้งหมดภายใต้ Root `"orders"` ใน `lo.json` และ `en.json` ป้องกันการเขียนทับ
  - ตรวจสอบและแปลข้อความภาษาไทยที่หลุดอยู่ใน Helper Text ให้เป็นภาษาลาวสมบูรณ์

- [ ] **2.2 Fix LAK Currency Rounding Rule (`engine.go` & `currency.ts`)**
  - ปรับฟังก์ชันการปัดเศษใน Go Backend และ TS Frontend: หากเป็นสกุลเงิน `LAK` ให้ปัดเศษเป็นจำนวนเต็มเท่านั้น (`math.Round(val)`)

- [ ] **2.3 Fix Offcut DB Schema Type Alignment**
  - ปรับ Schema คอลัมน์ `quantity` ในตาราง `offcuts` ให้รองรับ `NUMERIC(10,2)` หรือ cast ค่าใน Go Backend ให้ถูกต้อง

---

### 🎨 Phase 3: UI/UX & PDF Document Polish

- [ ] **3.1 Lao Typography Line-Height Adjustment**
  - เพิ่ม Padding ด้านบนและด้านล่างของ Table Header และ Form Labels เพื่อไม่ให้วรรณยุกต์ภาษาลาวถูกตัดขอบ

- [ ] **3.2 Professional PDF Generation (`admin-system/backend/orders/pdf.go`)**
  - พัฒนาการสร้างไฟล์ PDF จริง โดยเรนเดอร์ Line Items, รายละเอียดกระดาษ, น้ຳໝຶກ, ค่าแรง และภาษี VAT อย่างครบถ้วน

---

### 🧪 Automated & Manual Verification Commands

```bash
# 1. Run Backend Unit & Engine Tests
cd admin-system/backend
go test -v ./pricing/...
go test -v ./orders/...

# 2. Run Database Migrations Check
cd ../migrations
# Verify goose migration status

# 3. Run Frontend Typecheck & Build Verification
cd ../frontend
npm run build
```
