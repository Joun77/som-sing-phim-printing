# Task 38: Artwork File Persistence & Order Edit Spec Normalization

## 📌 Mission & Context

แก้ไข 2 ปัญหาหลักในกระบวนการทำงานของระบบโรงพิมพ์:

1. **การบันทึกและส่งต่อไฟล์งานพิมพ์ (Artwork File Persistence):** บันทึกไฟล์ที่ตรวจในหน้าใบเสนอราคาแบบ Background Upload และส่งต่อ URL ไฟล์ไปยังออเดอร์และฝ่ายผลิตโดยไม่สูญหาย  
2. **การแก้ไขข้อมูลออเดอร์ไม่ตรงกับต้นฉบับ (Order Edit Spec Normalization):** แก้ไขปัญหาเมื่อกดปุ่ม "แก้ไข" ในหน้าจัดการออเดอร์ แล้วฟอร์มโหลดค่า Default หรือสเปกเพี้ยนจากที่สร้างไว้

---

## 🎯 สรุปการแบ่งระยะงาน (Phase Breakdown)

\[ Phase 1: Preflight Background File Upload \] ──► \[ Phase 2: Quotation-to-Order Artwork Pass-through \] ──► \[ Phase 3: Order Edit Data Normalizer & Modal Binding \]

---

## 🚀 รายละเอียดการดำเนินงานแต่ละเฟส (Detailed Specifications)

### 🔹 Phase 1: Preflight Background File Upload

- **Target Files:**  
  - `admin-system/backend/orders/upload.go` (หรือ `main.go`)  
  - `admin-system/frontend/src/features/quotations/QuotationManager.tsx`  
  - `admin-system/frontend/src/components/admin/PreFlightVerificationCard.tsx`  
- **Technical Specs:**  
  1. สร้าง Backend Endpoint: `POST /api/upload/artwork`  
     - รับ Multipart Form Data (`file`, `type: "artwork"`)  
     - บันทึกไฟล์ลงใน Storage และคืนค่า `{ fileUrl, fileName, fileSize, assetId }`  
  2. ในหน้าใบเสนอราคา / Preflight Card:  
     - เมื่อผู้ใช้เลือกหรือลากไฟล์งานพิมพ์ (PDF, AI, TIFF, PNG) เข้ามาตรวจ ให้ทำการ Trigger Background Upload ทันที  
     - บันทึก `artworkUrl` และ `artworkFileName` เข้าใน State ของ Quotation

---

### 🔹 Phase 2: Quotation-to-Order Artwork Pass-through

- **Target Files:**  
  - `admin-system/backend/orders/handlers.go`  
  - `admin-system/frontend/src/features/orders/ProductionTrackingPage.tsx`  
- **Technical Specs:**  
  1. ในตารางฐานข้อมูล PostgreSQL:  
     - ตรวจสอบให้ตาราง `quotations` และ `orders` มีคอลัมน์ `artwork_url TEXT`, `digital_proof_url TEXT`  
  2. ในขั้นตอนการแปลงใบเสนอราคาเป็นออเดอร์:  
     - คัดลอก `artwork_url` จาก `quotations` เข้า `orders` โดยตรง  
  3. ในหน้า Production Tracking:  
     - แสดงการ์ด `ARTWORK ASSET` พร้อมปุ่ม "ເປີດໄຟລ໌ງານ" (Open File) และ "ດາວໂຫລດໄຟລ໌ພິມ" (Download Press File) ชี้ไปยัง URL จริงที่บันทึกไว้

---

### 🔹 Phase 3: Order Edit Data Normalizer & Modal Binding

- **Target Files:**  
  - `admin-system/frontend/src/utils/orderDataMapper.ts` (ใหม่)  
  - `admin-system/frontend/src/features/orders/OrderEditModal.tsx`  
  - `admin-system/frontend/src/features/orders/OrderManagement.tsx`  
- **Technical Specs:**  
  1. สร้าง Utility Function `mapOrderToFormSpecs(order: any)`:  
     - ดึงข้อมูลสเปกจาก `order.items[0]` หรือ `order.spec_details` หรือ `order.spec`  
     - แปลงชื่อฟิลด์จาก `snake_case` (DB) เป็น `camelCase` (Form):  
       - `paper_type` ➔ `paperType`  
       - `paper_grammage` / `grammage` ➔ `grammage`  
       - `print_size` / `size` ➔ `size`  
       - `black_coverage` ➔ `blackCoverage`  
       - `color_coverage` ➔ `colorCoverage`  
       - `finishing_options` ➔ `finishings`  
       - `labor_cost` ➔ `laborCost`  
  2. ใน `OrderEditModal.tsx`:  
     - ใช้ `useEffect` ดักจับเมื่อ `order` เปลี่ยนแปลง และเรียก `mapOrderToFormSpecs(order)` เพื่อเซ็ต Form State ทันที  
     - นำเข้า `ItemSpecConfigurator` มาใช้เป็นฟอร์มแก้ไข เพื่อให้ฟังก์ชันการคำนวณและตัวเลือกตรงกับหน้าใบเสนอราคา 100%  
  3. เมื่อกด "บันทึกการแก้ไข":  
     - ยิง `PUT /api/orders/:id` อัปเดตทั้งสเปกและราคาคำนวณใหม่กลับไปยังฐานข้อมูล

---

## 📋 Verification & Acceptance Criteria

- [ ] อัปโหลดไฟล์งานในหน้าใบเสนอราคา ➔ เมื่อเปิดออเดอร์สำเร็จ ไฟล์งานพิมพ์จะแสดงบนหน้าฝ่ายผลิตทันที สามารถคลิกดูและดาวน์โหลดได้  
- [ ] เมื่อกดปุ่ม "แก้ไข" ออเดอร์ในหน้าจัดการออเดอร์ ข้อมูลสเปกเดิม (ชนิดกระดาษ, แกรม, % หมึก, ฟินิชชิ่ง, ค่าแรง) จะแสดงตรงกับข้อมูลต้นฉบับ 100% โดยไม่รีเซ็ตเป็นค่า Default  
- [ ] บันทึกการแก้ไขออเดอร์แล้ว ข้อมูลและราคาสรุปจะอัปเดตลงฐานข้อมูล PostgreSQL ทันที

