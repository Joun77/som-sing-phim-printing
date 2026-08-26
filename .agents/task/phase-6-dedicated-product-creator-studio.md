# Phase 6: Dedicated Multi-Step Product Creator & Production Spec Studio

## 🎯 วัตถุประสงค์ (Objective)
ยกระดับฟอร์มสร้างและแก้ไขสินค้า (Product Creator / Spec Studio) ให้เป็นหน้าต่างทำงานเต็มรูปแบบแบบ Multi-Step Wizard (6 ขั้นตอน) เพื่อความแม่นยำสูงสุดในการคิดต้นทุนการพิมพ์ เชื่อมโยงเครื่องจักรจริง หมึกพิมพ์ที่ผูกในระบบ คลังวัตถุดิบ เครื่องจักรหลังพิมพ์ และการจำลองพรีวิวหน้าเว็บแบบเรียลไทม์ (Live Storefront Preview)

---

## 🧭 โครงสร้าง 6 ขั้นตอน (The 6-Step Studio Workflow)

```mermaid
graph LR
    S1["1. 📝 ข้อมูลทั่วไป & อัปโหลด<br/>(General Info & Upload Rules)"] --> S2["2. 🖨️ เครื่องพิมพ์ & หมึกจริง<br/>(Print Engine & Live Cost)"]
    S2 --> S3["3. 📦 คลังวัตถุดิบ & กระดาษ<br/>(Material Inventory & SKU)"]
    S3 --> S4["4. ✂️ เครื่องตัด & งานหลังพิมพ์<br/>(Post-Press & Finishing)"]
    S4 --> S5["5. 🏷️ ส่วนลด & ข้อมูลสินค้า<br/>(Discounts & Info Tabs)"]
    S5 --> S6["6. 👁️ พรีวิวหน้าเว็บลูกค้า<br/>(Live Storefront Preview)"]
```

---

## 📋 รายการงานย่อยที่ต้องพัฒนา (Detailed Subtasks)

### 🔹 [Task 6.1] Step 1: ข้อมูลสินค้าทั่วไป & รูปแบบไฟล์งาน (General Product Info & Upload Engine)
- **ตำแหน่ง:** `admin-system/frontend/src/features/catalog/components/steps/Step1GeneralInfo.tsx`
- **สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed)
- **ฟังก์ชันที่พัฒนาแล้ว:**
  - [x] ชื่อสินค้า 2 ภาษา: ภาษาลาว (Title Lao) & ภาษาอังกฤษ (Title EN)
  - [x] การเลือกหมวดหมู่สินค้า (Category Picker) + การสร้าง Slug อัตโนมัติ
  - [x] รูปแบบการคิดราคา (Pricing Model): Standard Flat, Book Multi-Part, SQM Custom, Fixed Unit
  - [x] ระบบจัดการรูปภาพ (Thumbnail & Gallery): อัปโหลดไฟล์ภาพ, จัดการคลังรูป, และใส่ URL โดยตรง
  - [x] รูปลักษณ์สินค้า: สวิตช์ `Bestseller (★)` และ `Active on Web (ເປີດໜ້າເວັບ)`
  - [x] เอนจินกำหนดรูปแบบการอัปโหลดไฟล์ (File Upload Mode):
    - พิมพ์ภาพพร้อมใช้ (Print-Ready Single/Multi PDF, JPG, PNG)
    - งานหนังสือ/เอกสาร (Book Multi-page PDF พร้อมระบบ Preflight นับหน้า)
    - ป้ายโฆษณาตามตารางเมตร (Large Format SQM พร้อมตรวจ DPI & Bleed)
  - [x] สวิตช์เปิด/ปิดฟังก์ชันสินค้า (Features Config Toggles: Online Design, Template Download, Preflight Check, Finishing Selector, Expedited Rush Delivery)

---

### 🔹 [Task 6.2] Step 2: เลือกเครื่องพิมพ์ & คำนวณต้นทุนละเอียด (Print Engine & Quotation-Grade Costing)
- **ตำแหน่ง:** `admin-system/frontend/src/features/catalog/components/steps/Step2PrintEngine.tsx`
- **สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed)
- **ฟังก์ชันที่พัฒนาแล้ว:**
  - [x] ดึงเฉพาะ **เครื่องพิมพ์จริงของร้าน (2 เครื่องเท่านั้น: Fuji Versant 180 & Epson L1800)**
  - [x] การ์ดแจกแจงต้นทุนละเอียดระดับใบเสนอราคา:
    - ค่าเสื่อมเครื่องต่อแผ่น (Depreciation LAK/page)
    - ค่าบำรุงรักษา/ดรัม/สายพาน (Maintenance LAK/page)
    - ค่าไฟฟ้าเครื่องพิมพ์ (Electricity LAK/page)
    - ค่าหมึกพิมพ์จริงที่ผูกลิงก์กับคลังสินค้า (Linked C, M, Y, K Inks breakdown)
  - [x] คำนวณแยก 2 โหมด:
    - โหมด 4 สี CMYK (4-Color CMYK Cost / Page)
    - โหมดขาวดำ K (Monochrome K Cost / Page)
  - [x] กำหนด Target Margin % (อัตราราคากำไรเป้าหมาย) พร้อมสูตร: `Selling Price = Cost ÷ (1 - Margin%)`
  - [x] จำลองราคาขายและกำไรสุทธิแบบ Real-time ตาม Margin % ที่เลือก

---

### 🔹 [Task 6.3] Step 3: คลังวัตถุดิบ & กระดาษ (Raw Material & Inventory Linker)
- **ตำแหน่ง:** `admin-system/frontend/src/features/catalog/components/steps/Step3MaterialInventory.tsx`
- **สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed)
- **ฟังก์ชันที่พัฒนาแล้ว:**
  - [x] สร้างกลุ่มวัตถุดิบ (เช่น กระดาษแผ่น, สติกเกอร์, กระดาษปก, กระดาษเนื้อใน)
  - [x] ค้นหาและผูก SKU จริงจากคลังสินค้าผ่าน `🔍 Material Finder Modal`
  - [x] แสดงสต็อกคงเหลือ (Stock on Hand), ต้นทุนต่อหน่วย (Unit Cost), และสถานะพร้อมใช้งาน
  - [x] คำนวณราคาขายและส่วนต่างราคา (+₭ Delta Price) อัตโนมัติด้วยสูตร `Target Margin %`
  - [x] รองรับการตั้งค่า Display Type (Cards vs Dropdown) และกำหนดตัวเลือกเริ่มต้น (Default Option)
  - [x] พรีเซ็ตด่วนสำหรับกลุ่มวัตถุดิบยอดนิยม (กระดาษอาร์ต 260g-350g, สติกเกอร์ PP/PVC/Paper)

---

### 🔹 [Task 6.4] Step 4: เครื่องตัด & งานเจาะรู/เข้าเล่ม/เคลือบฟิล์ม (Post-Press Finishing & Machinery)
- **ตำแหน่ง:** `admin-system/frontend/src/features/catalog/components/steps/Step4PostPressFinishing.tsx`
- **สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed)
- **ฟังก์ชันที่พัฒนาแล้ว:**
  - [x] ผูกเครื่องจักรหลังพิมพ์จริงของร้าน:
    - ✂️ **เครื่องตัดกระดาษไฮดรอลิก:** `QZYK920 Hydraulic Paper Guillotine` (28.3 ₭/แผ่น)
    - ✨ **เครื่องตัดไดคัท / คิสคัท:** `Graphtec FC9000 Digital Die-Cutter` (150 - 250 ₭/แผ่น)
    - 📖 **เครื่องเข้าเล่มสันกาวร้อน:** `WD-50A Perfect Glue Thermal Binder` (110 ₭/เล่ม)
    - 🛡️ **เครื่องเคลือบฟิล์ม:** `FM-360 Roll Laminator Hot & Cold` (27.5 ₭/แผ่น)
  - [x] สวิตช์เลือกประเภทงานหลังพิมพ์ที่ต้องการใส่ในสินค้า (ตัดขาด, ไดคัท, เคลือบฟิล์ม, เข้าเล่ม)
  - [x] คำนวณราคาขายและส่วนต่างราคาอัตโนมัติตาม `Target Margin %` และต้นทุนเครื่องจักร
  - [x] ปุ่มพรีเซ็ตด่วนสำหรับงานตัด/ไดคัท/เคลือบฟิล์มสติกเกอร์ และงานเข้าเล่มหนังสือ

---

### 🔹 [Task 6.5] Step 5: ส่วนลดตามจำนวนสั่งพิมพ์ & แท็บข้อมูลหน้าร้าน (Volume Tier Discounts & Customer Info Tabs)
- **ตำแหน่ง:** `admin-system/frontend/src/features/catalog/components/steps/Step5DiscountsAndTabs.tsx`
- **สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed)
- **ฟังก์ชันที่พัฒนาแล้ว:**
  - [x] จัดการขบวนขั้นบันไดส่วนลด (Volume Discount Tiers):
    - จำนวนสั่งพิมพ์ขั้นต่ำ (Min Quantity: e.g. 100, 300, 500, 1000, 5000)
    - เปอร์เซ็นต์ส่วนลด (% Discount: e.g. 5%, 10%, 15%, 20%, 30%)
    - แสดงราคาจำลองต่อหน่วยหลังลดราคา (Live Discount Price simulation)
  - [x] จัดการแท็บข้อมูลหน้าร้าน (Customer Information Tabs):
    - แท็บสเปกวัสดุ & ความหนา (Materials & Specs)
    - แท็บมาตรฐานขนาด & ระยะตัดตก (Bleed & File Requirements)
    - แท็บระยะเวลาผลิต & การจัดส่ง (Production Time & Delivery)
    - แท็บคำถามที่พบบ่อย (FAQ & Artwork Guidelines)
  - [x] ปุ่มพรีเซ็ตด่วนสำหรับแท็บข้อมูลมาตรฐานภาษาลาว + อังกฤษ

---

### 🔹 [Task 6.6] Step 6: จำลองหน้าเว็บจริง (Live Customer Storefront Preview)
- **ตำแหน่ง:** `admin-system/frontend/src/features/catalog/components/steps/Step6CustomerPreview.tsx`
- **สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed)
- **ฟังก์ชันที่พัฒนาแล้ว:**
  - [x] การจำลองหน้าสั่งซื้อของลูกค้า 1:1 แบบ Interactive เสมือนอยู่ใน `customer-service` จริง
  - [x] สลับมุมมอง Desktop / Mobile preview ได้อย่างอิสระ
  - [x] การเลือกตัวเลือกสเปก (Cards/Dropdown) และราคารวมจะคำนวณสดทันที (Live Dynamic Pricing calculation)
  - [x] การคำนวณส่วนลดตามจำนวนสั่ง (Volume Tier Discounts) แบบ Real-time
  - [x] ระบบจำลองอัปโหลดไฟล์พร้อมการตรวจสอบ Preflight จำลอง (300 DPI, Bleed 2mm, CMYK)
  - [x] การแสดงแท็บข้อมูลสินค้า (Specifications, File Guide, Delivery, FAQ)
  - [x] แถบสรุปยอดวิเคราะห์ Admin แบบ Real-time: ต้นทุนจริง (True Cost), ราคาขายรวม (Storefront Total), และกำไรสุทธิ (Net Profit Margin %) ก่อนกดบันทึกສິນຄ້າ to Store) พร้อมระบบตรวจสอบความสมบูรณ์ของสเปก (Preflight Validation)

---

## 🔍 แผนการตรวจรับงานทีละชิ้น (Step-by-Step Verification Gate)
- [ ] **ตรวจชิ้นงานที่ 1 (Step 1):** กรอกข้อมูลสินค้า รูปภาพ และสวิตช์ฟังก์ชันครบถ้วน
- [ ] **ตรวจชิ้นงานที่ 2 (Step 2):** เลือกเครื่องพิมพ์จริง มีการแจกแจงค่าเสื่อม + ค่าไฟ + หมึกที่ผูกจริงครบทุกสี
- [ ] **ตรวจชิ้นงานที่ 3 (Step 3):** ผูก SKU คลังวัสดุ ค้นหาด้วย Modal คำนวณ Margin % ถูกต้อง
- [ ] **ตรวจชิ้นงานที่ 4 (Step 4):** ผูกเครื่องตัด QZYK920, เข้าเล่ม WD-50A, เคลือบ FM-360 ได้ครบ
- [ ] **ตรวจชิ้นงานที่ 5 (Step 5):** กำหนดระดับส่วนลดและแท็บข้อมูลสินค้าได้อิสระ
- [ ] **ตรวจชิ้นงานที่ 6 (Step 6):** หน้าพรีวิวจำลองหน้าเว็บจริง คลิกเลือกสเปกแล้วราคาคำนวณสดถูกต้อง บันทึกข้อมูลได้ 100%
