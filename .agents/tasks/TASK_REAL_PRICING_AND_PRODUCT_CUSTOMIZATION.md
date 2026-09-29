# Task: Real Machinery Pricing Engine Alignment & Dynamic Product Customization

## 1. ปัญหาและวัตถุประสงค์ (Problem & Objective)
- **ปัญหาที่พบ:**
  1. ราคาสินค้าหน้าเว็บยังคำนวณแบบ Flat Add-on (`basePrice + sum(opt.add)`) ไม่ได้ดึงต้นทุนเครื่องพิมพ์จริง (Depreciation, Maintenance, Click rate) และค่าหมึก/กระดาษจริงจาก Pricing Engine ของ Go Backend
  2. ยังไม่มีระบบ **Baseline Coverage & Floor Threshold**: ต้องการให้มีราคาฐาน (Floor Price) ที่ครอบคลุมค่า Coverage เริ่มต้น หากต้นทุนจริงไม่เกินก็ใช้ราคาฐาน แต่ถ้างานลูกค้ามี Coverage หรือต้นทุนสูงเกินเกณฑ์ ให้ปรับคิดตามราคาจริง
  3. คลังวัตถุดิบ (Raw Materials) ยังขาดการแยกหมวดหมู่ที่ชัดเจนระหว่าง `PAPER` และ `STICKER` และแบบฟอร์มสเปกวัตถุดิบยังไม่เป็น Universal Standard เดียวกัน
  4. เครื่องตัดและงานหลังพิมพ์ (Post-Press Machinery) ใน Product Studio ยังไม่ได้ดึงข้อมูลเครื่องจักรและอัตราค่าตัด/เคลือบจริงจาก Database มาใช้งานอย่างสมบูรณ์
  5. หน้าเว็บยังไม่รองรับสเปกขนาดยืดหยุ่น (Custom Dimensions / `SQM_CUSTOM`) อย่างสมบูรณ์ และ Data Flow การส่งต่อ SKU วัตถุดิบไปยังขั้นตอนตัดสต็อก `IN_PRODUCTION` ยังไม่ครบวงจร

- **ผลลัพธ์ที่ต้องการ:**
  - ยกระดับสูตรคำนวณราคาหน้าเว็บให้ต่อตรงกับ Go Backend Pricing Engine (`/api/pricing/calculate`)
  - รองรับตรรกะ **Baseline Threshold**: `Final Price = max(Base Floor Price, Real Dynamic Price with Margin)`
  - ปรับปรุงแบบฟอร์มคลังวัตถุดิบให้เป็น **Universal Form** พร้อมแยกหมวดหมู่อย่างชัดเจน (`Paper`, `Sticker`, `Rigid Substrate`)
  - ดึงข้อมูลเครื่องพิมพ์ เครื่องตัด และเครื่องหลังพิมพ์จริงจากฐานข้อมูลมาใช้ใน Product Studio และการประเมินราคา
  - รองรับ Custom Dimensions (กว้าง × ยาว) หน้าเว็บ และส่งต่อข้อมูลสเปกเข้าสู่ออเดอร์เพื่อตัดสต็อกจริงเมื่อเข้าสู่ `IN_PRODUCTION`

---

## 2. แผนงานประจำเฟส (Feature-Driven Vertical Slicing)

### Phase 1: Real Machine Costs & Pricing Engine Threshold Logic (Full-Stack Vertical Slice)
- 🗄️ **Database:**
  - เพิ่มคอลัมน์ใน `public_products`:
    - `baseline_coverage_percent NUMERIC(5, 2) DEFAULT 10.00`
    - `base_floor_price NUMERIC(15, 2) DEFAULT 0.00`
    - `threshold_mode VARCHAR(50) DEFAULT 'FLOOR_OR_ACTUAL'`
    - `default_machine_id VARCHAR(100)`
- ⚙️ **Backend (Go `pricing/engine.go` & handlers):**
  - เพิ่มฟิลด์ `BaseFloorPrice`, `BaselineCoveragePercent`, `ThresholdMode` ใน `CalculationRequest` และ `CalculationResponse`
  - พัฒนาฟังก์ชันคำนวณ Threshold: เปรียบเทียบต้นทุนจริงรวมมาร์จิ้นกับ Base Floor Price
  - เชื่อมโยงค่าเสื่อมและค่าซ่อมบำรุงต่อหน้าของเครื่องพิมพ์จริงจาก `printers` / `equipment`
- 🎨 **UX/UI & Frontend (Admin & Storefront):**
  - ปรับ `Step2PrintEngine.tsx` ใน Admin Product Studio: ให้ตั้งค่า Baseline Coverage %, Base Floor Price, และเลือกเครื่องพิมพ์จริง
  - ปรับ `Step4PostPressFinishing.tsx`: โหลดข้อมูลเครื่องตัด/เคลือบ/เข้าเล่มจากตารางเครื่องจักรจริง
  - ปรับ `ProductPage.tsx` และ `useDynamicPriceCalculator.ts` บน Storefront: เรียกคำนวณราคาผ่าน Pricing Engine พร้อมแสดงผลราคาตามเกณฑ์ Baseline Threshold

### Phase 2: Universal Raw Material Categorization & Form Standardization
- 🗄️ **Database:**
  - ตรวจสอบและจัดหมวดหมู่ตาราง `materials`: แยกประเภท `PAPER`, `STICKER`, `RIGID_SUBSTRATE`, `LAMINATION_FILM`, `BINDING_SUPPLY`
- ⚙️ **Backend:**
  - รองรับ Category Filtering ใน `/api/v1/inventory/materials?category=...`
- 🎨 **UX/UI & Frontend:**
  - ออกแบบและสร้าง **Universal Material Form** ให้ใช้งานร่วมกันอย่างเป็นมาตรฐาน
  - เพิ่มฟิลเตอร์แยก `Paper` vs `Sticker` ใน `Step3MaterialInventory.tsx` ของ Product Studio

### Phase 3: Storefront Custom Dimensions (`SQM_CUSTOM`) & End-to-End Stock Data Flow
- 🎨 **UX/UI & Storefront:**
  - เพิ่ม Input กว้าง × ยาว (cm/mm) ใน `ProductPage.tsx` เมื่อสินค้ามี `hasCustomDim = true` หรือเป็น `SQM_CUSTOM`
  - คำนวณพื้นที่ตารางเมตร (m²) และส่งสเปกขนาดจริงเข้าสู่ตะกร้า
- 🔒 **Data Flow & Inventory Integrity:**
  - แนบ `materialSku`, `paperCode`, `machineId` ลงใน Item Specs ของออเดอร์เมื่อ Checkout
  - ยืนยันการตัดสต็อกอัตโนมัติด้วย Database Transaction (`tx.Begin()`) เมื่อออเดอร์เปลี่ยนสถานะเป็น `IN_PRODUCTION` ตามกฎ `admin-architecture-guard.md`

---

## 3. เกณฑ์การตรวจรับงาน (QA Acceptance Criteria)
- [ ] เมื่อสั่งคำนวณราคาด้วย Coverage ต่ำกว่า Baseline: ระบบคิดราคาตาม Base Floor Price
- [ ] เมื่อสั่งคำนวณราคาด้วย Coverage สูงกว่า Baseline: ระบบปรับราคาขึ้นตามต้นทุนจริง + Target Margin
- [ ] ข้อมูลเครื่องพิมพ์และเครื่องตัดใน Product Studio ดึงจากฐานข้อมูลจริง
- [ ] คลังวัตถุดิบแยกหมวด Paper และ Sticker ชัดเจน และใช้ Universal Form ที่เป็นมาตรฐาน
- [ ] รองรับการใส่ขนาด Custom Dimensions บนหน้าเว็บสำหรับสินค้าที่เปิดใช้งาน
- [ ] ไม่ใช้ Unicode Emoji (ใช้ Lucide Icons เท่านั้น)
- [ ] รัน Unit Tests ผ่านทั้งหมด (`npm run test:unit:frontend` หรือ `go test ./...`)
- [ ] Compile ผ่านทั้ง Go Backend (`go build ./...`) และ Frontend (`tsc --noEmit`)
