# 🛠️ SYSTEM REMEDIATION & DEVELOPMENT PLAN
**Project:** Som Sing Phim Full-Stack Printing Platform[cite: 2]  
**Target:** Bug Fixes, Calculation Precision, Architecture Polish & Feature Roadmap[cite: 2]  
**Source Report:** Master QA Deep Audit Report[cite: 2]  

---

## 📌 Phase 1: Critical Core Bug Fixes (ด่วนที่สุด)[cite: 2]

### 1.1 แก้ไขสูตรคำนวณราคากระดาษแผ่นใหญ่ (Paper Pricing Engine)[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/backend/pricing/engine.go` (`#L228-L242`)[cite: 2]
* **ปัญหาเดิม:** คำนวณแบบสเกลพื้นที่เส้นตรงต่อเนื่อง ทำให้ราคากระดาษสำหรับงานพิมพ์สั่งตัดต่ำกว่าความเป็นจริงถึง 99.2% (BUG-003)[cite: 2]
* **แนวทางแก้ไข:**
  1. เพิ่มพารามิเตอร์ขนาดกระดาษแผ่นใหญ่และจำนวนชิ้นงานที่ตัดได้ต่อแผ่น (`CutsPerSheet`)[cite: 2]
  2. คำนวณจำนวนแผ่นใหญ่ที่ต้องใช้จริง: $\text{RequiredSheets} = \lceil \text{Quantity} / \text{CutsPerSheet} \rceil$[cite: 2]
  3. รวมค่าเผื่อเสีย (Spoilage) และปัดเศษขึ้นเป็นจำนวนเต็มแผ่น: $\text{TotalSheets} = \lceil \text{RequiredSheets} \times (1 + \text{SpoilagePct}) \rceil$[cite: 2]
  4. นำ $\text{TotalSheets} \times \text{CostPerLargeSheet}$ เป็นต้นทุนกระดาษจริง[cite: 2]

---

### 1.2 แก้ไขสูตรเปรียบเทียบต้นทุนหมึกเทียบ (Compatible Ink Calculator)[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/frontend/src/features/inventory/components/details/PrinterInkComparisonCard.tsx` (`#L61-L93`)[cite: 2]
* **ปัญหาเดิม:** นำอัตราการใช้หมึกต่อหน้า (ml/page) ของหมึกแท้ OEM ไปบังคับคูณกับหมึกเทียบ ทำให้ต้นทุนต่อแผ่นและ % การประหยัดคลาดเคลื่อน (BUG-002)[cite: 2]
* **แนวทางแก้ไข:**
  * ปรับให้คำนวณจาก Yield จริงของหมึกเทียบที่ลงทะเบียนไว้ใน Inbound:
    ```typescript
    const actualRate = linkedInkItem.yield > 0 
      ? actualVol / linkedInkItem.yield 
      : scaledRateMl;
    const actualCostPerPage = actualCostPerMl * actualRate;
    ```
   [cite: 2]

---

### 1.3 สร้างระบบตัดสต็อกกระดาษและหมึกแบบ FIFO (Production Discharge Transaction)[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/backend/orders/handlers.go` (`#L218-L221`)[cite: 2]
* **ปัญหาเดิม:** เมื่อปรับสถานะงานพิมพ์เป็น `IN_PRODUCTION` มีเพียงแค่คำสั่ง `log.Printf` แต่ไม่มีการหักสต็อกในฐานข้อมูลจริง (BUG-004)[cite: 2]
* **แนวทางแก้ไข:**
  1. สร้าง PostgreSQL Transaction เพื่อตัดสต็อกตามลำดับวันนำเข้า (`received_date ASC`) ในตาราง `inventory_batches`[cite: 2]
  2. ตรวจสอบปริมาณสต็อกคงเหลือก่อนตัด หากไม่เพียงพอให้สั่ง Rollback และคืนค่า Error 400 เพื่อป้องกันสถานะออเดอร์ค้าง[cite: 2]

---

### 1.4 ปรับปรุงระบบความปลอดภัย Authentication (Signed JWT)[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/backend/auth/jwt.go` (`#L46-L47, #L67-L77`)[cite: 2]
* **ปัญหาเดิม:** ใช้ Mock Token และตรวจสอบสิทธิ์แอดมินเพียงแค่เช็คคำลงท้าย `"admin"` ซึ่งเสี่ยงต่อการถูก Bypass (BUG-001)[cite: 2]
* **แนวทางแก้ไข:**
  1. ใช้ Library `golang-jwt/jwt/v5` สร้าง Cryptographic Signed Token ด้วย Secret Key จาก Environment Variable[cite: 2]
  2. ตรวจสอบ Valid Claims, Role (`admin` / `staff`) และวันหมดอายุ (`exp`) ใน `AuthMiddleware`[cite: 2]

---

## 🟡 Phase 2: Data Integrity, Schema & i18n Fixes (ความถูกต้องของระบบและภาษา)[cite: 2]

### 2.1 รวม Key ภาษาที่ซ้ำซ้อนใน i18n[cite: 2]
* **ไฟล์เป้าหมาย:** 
  * `admin-system/frontend/src/locales/lo.json` (`#L66, #L378`)[cite: 2]
  * `admin-system/frontend/src/locales/en.json` (`#L65, #L377`)[cite: 2]
* **แนวทางแก้ไข:** รวมบล็อก `"orders"` ทั้งสองจุดให้อยู่ภายใต้อ็อบเจกต์เดียวกันเพื่อไม่ให้เกิดการเขียนทับ (Overwrite) ของคำแปลหน้าสั่งซื้อ[cite: 2]

### 2.2 ปรับกฎการปัดเศษสกุลเงินกีบ (LAK Rounding Rules)[cite: 2]
* **ไฟล์เป้าหมาย:** 
  * `admin-system/backend/pricing/engine.go` (`#L542-L544`)[cite: 2]
  * `customer-service/src/utils/currency.ts` (`#L35`)[cite: 2]
* **แนวทางแก้ไข:** เพิ่มเงื่อนไขตรวจสอบสกุลเงิน หากเป็น `LAK` ให้ปัดเศษเป็นจำนวนเต็ม (`math.Round(val)` / `Math.round(val)`) ห้ามมีทศนิยม[cite: 2]

### 2.3 แก้ไข Data Type ตาราง Offcuts ใน Database[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/backend/inventory/offcuts.go` (`#L21, #L112-L124`)[cite: 2]
* **แนวทางแก้ไข:** ปรับ Schema ของคอลัมน์ `quantity` ในตาราง `offcuts` ให้เป็น `NUMERIC(10,2)` หรือทำการแปลงประเภทข้อมูล (`type cast`) ใน Go ให้ตรงกับ DB[cite: 2]

---

## 🎨 Phase 3: UI/UX & Output Enhancements (การแสดงผลและเอกสาร)[cite: 2]

### 3.1 ปรับแต่งระยะบรรทัดฟอนต์ภาษาลาว (Lao Typography Polish)[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/frontend/src/features/inventory/components/details/PrinterInkComparisonCard.tsx` (`#L235-L256`)[cite: 2]
* **แนวทางแก้ไข:** นำคลาส `truncate` ออกจากส่วนหัวตาราง และเพิ่ม `leading-relaxed py-3.5` เพื่อป้องกันปัญหาสระและวรรณยุกต์ภาษาลาวตกขอบ[cite: 2]

### 3.2 พัฒนาระบบสร้างเอกสารใบเสนอราคา PDF จริง[cite: 2]
* **ไฟล์เป้าหมาย:** `admin-system/backend/orders/pdf.go` (`#L26, #L47`)[cite: 2]
* **แนวทางแก้ไข:** เชื่อมต่อ Go PDF Generator Library (เช่น `maroto` หรือ `gofpdf`) เพื่อสร้างใบเสนอราคาและใบส่งของที่มีรายการ Line Items, ภาษี VAT และยอดเงินตรงตามจริง[cite: 2]

---

## 🧪 Verification & Testing Commands (คำสั่งสำหรับตรวจสอบหลังแก้ไข)[cite: 2]

```bash
# 1. ทดสอบระบบคำนวณและ Order Handling ฝั่ง Backend
cd admin-system/backend
go test -v ./pricing/...
go test -v ./orders/...

# 2. ตรวจสอบความถูกต้องของ Type และ Build Frontend
cd ../frontend
npm run typecheck
npm run build

# 3. ตรวจสอบฝั่ง Customer Service Frontend
cd ../../customer-service
npm run typecheck
npm run build