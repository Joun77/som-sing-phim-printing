# Task 36: Fix Customer Order Tracking & Admin Order Creation Wizard Refactoring

## 📌 ภาพรวมและบริบท (Mission & Context)

เอกสารแบ่งระยะการดำเนินงาน (Phase Breakdown) เพื่อแก้ไขปัญหาข้อบกพร่อง 2 จุดหลักในระบบ Som Sing Phim Printing System:

1. **ระบบติดตามออเดอร์ฝั่งลูกค้า (Customer Order Tracking):** ลูกค้านำ Order ID (`SSP-82115`) มาค้นหาแล้วระบบแจ้งเตือนไม่พบข้อมูล  
2. **ฟอร์มสร้างออเดอร์ในระบบแอดมิน (Admin Create Order Wizard):** หน้าจอด้านล่างว่างเปล่า (Blank Screen), ต้องการดึงโมดูลสเปกจากหน้าใบเสนอราคา (Quotation) มาใช้ 100% พร้อมคิดค่าแรงรวม, และแก้ไขการแจ้งเตือน "Server Offline" ในหน้าสรุป

---

## 🎯 สรุปการแบ่งงานตามเฟส (Implementation Roadmap)

\[ Phase 1: Customer Tracking Fix \] ──► \[ Phase 2: Quotation Spec Reusability \] ──► \[ Phase 3: Admin Wizard & Offline Fix \] ──► \[ Phase 4: E2E QA Verification \]

---

## 🚀 รายละเอียดการดำเนินงานแต่ละเฟส (Detailed Task Phases)

### 🔹 Phase 1: แก้ไขระบบค้นหาและติดตามสถานะออเดอร์ฝั่งลูกค้า (Customer Tracking Fix)

#### 1.1 Backend: ปรับปรุง SQL Query ใน Go API (`admin-system/backend/orders/handlers.go`)

- ปรับปรุงฟังก์ชัน `TrackOrder` (`GET /api/orders/track?q=:query`) ให้ค้นหาแบบยืดหยุ่น:  
  - รองรับการค้นหาผ่าน `order_number` ทั้งแบบมีเครื่องหมาย `#` และไม่มีเครื่องหมาย `#` (ใช้ `UPPER(REPLACE(order_number, '#', ''))`)  
  - รองรับการค้นหาด้วย **UUID** (`id::text = $1`)  
  - รองรับการค้นหาด้วย **เบอร์โทรศัพท์** (`customer_phone = $1`)  
  - รองรับการค้นหาด้วย **เลขแทร็กกิ้งขนส่ง** (`tracking_code = $1`)  
- จัดการกรณี `404 Not Found` ให้ส่ง JSON Response `{ "found": false, "message": "Order not found" }` แทนการเกิด Unhandled Panic

#### 1.2 Frontend: ปรับปรุงหน้า `TrackingPage.tsx` (`customer-service/src/pages/TrackingPage.tsx`)

- เพิ่มการทำ `trim()` และลบอักขระพิเศษออกจาก Input ก่อนส่ง Request ไปยัง API  
- ปรับปรุง Error UI ให้แยกแยะระหว่าง **"ไม่พบเลขออเดอร์"** กับ **"เกิดปัญหาการเชื่อมต่อเครือข่าย (Network Error)"**  
- แสดงตัวอย่างรูปแบบเลขออเดอร์ที่ถูกต้องให้สอดคล้องกับฐานข้อมูลจริง

#### 1.3 Database & Seeding Integrity:

- ตรวจสอบให้แน่ใจว่าออเดอร์ตัวอย่างในระบบ Admin (เช่น `#SSP-82115`) มีข้อมูลถูกบันทึกจริงในตาราง `orders` ของ PostgreSQL เพื่อให้ฝั่งลูกค้าค้นหาเจอ

---

### 🔹 Phase 2: ดึงโมดูลกำหนดสเปกจากหน้าใบเสนอราคามาใช้ใน Wizard 100% (Spec Module Unification)

#### 2.1 Component Extraction & Sharing:

- แยก Component แกนหลักจากหน้าใบเสนอราคา (`QuotationManager.tsx` / `ItemSpecConfigurator.tsx`) ออกมาเป็น Reusable Module ที่: `admin-system/frontend/src/components/pricing/ItemSpecConfigurator.tsx`  
- นำ Component นี้ไปใส่ใน **Step 2 (`ລາຍການສິນຄ້າ & ສເປກ`)** ของ `CreateOrderWizard.tsx` 100%

#### 2.2 คุณสมบัติและส่วนประกอบที่ต้องเหมือนกัน 100%:

- **การเลือกวัสดุ & เครื่องพิมพ์:** Paper Type, แกรมกระดาษ, ขนาดมาตรฐาน (A4, A3) หรือกำหนดขนาดเอง (Custom WxH)  
- **Ink Coverage Controls:** Slider และ Preset ปรับ % หมึกดำ (K) และ % หมึกสี (CMY) แยกจากกัน  
- **Custom Dynamic Finishing:** งานหลังพิมพ์ 3 โหมด:  
  - `FIXED_JOB` (เหมาต่อจ็อบ เช่น ค่าตัดเจียน)  
  - `PER_UNIT` (ต่อชิ้น เช่น เคลือบแข็ง, พับ)  
  - `PER_SQM` (ตามพื้นที่ ตร.ม. เช่น เคลือบฟิล์มม้วน)  
- **Live Cost Breakdown:** กล่องแสดงพรีวิวต้นทุนกระดาษ, หมึกพิมพ์, ค่าเสื่อมเครื่อง, งานหลังพิมพ์ และกำไร

#### 2.3 การคิดค่าแรงรวม (Combined / Unified Labor):

- ปรับปรุงส่วนคิดค่าแรงในโมดูลสร้างออเดอร์ให้คิดเป็น **ค่าแรงรวมของจ็อบ (Lump-sum Combined Labor)** เข้าไปใน Direct Cost ทันที โดยไม่ต้องแยกกรอกรายช่างพิมพ์

---

### 🔹 Phase 3: แก้ไขหน้าจอขาวและข้อผิดพลาด "Server Offline" ในหน้าสร้างออเดอร์ (Admin Wizard Fix)

#### 3.1 แก้ไขปัญหาหน้าจอว่างเปล่า (Blank Screen / State Mismatch):

- ใน `admin-system/frontend/src/features/orders/CreateOrderWizard.tsx`:  
  - กำหนดค่าเริ่มต้น (`initialState`) ให้กับ Form State ทุกตัว (`customer`, `specs`, `payment`) ป้องกันค่า `undefined`  
  - ตรวจสอบตัวแปร `currentStep` (ควบคุมค่าให้อยู่ระหว่าง 1 ถึง 3 เสมอ)  
  - ตรวจสอบโครงสร้างเงื่อนไขการ Render Step 1, Step 2, Step 3 ให้สมบูรณ์

#### 3.2 แก้ไขปัญหาการแจ้งเตือน "Server Offline" ใน Step 3 (`OrderSummaryConfirmStep.tsx`):

- ตรวจสอบ Payload Data ก่อนเรียก API `POST /api/pricing/calculate` หรือ `POST /api/orders`  
- ดักจับ Error ให้แสดงข้อความแจ้งเตือนที่ตรงจุด (เช่น *"ข้อมูลสเปกกระดาษไม่ครบถ้วน"*) แทนการตั้งค่า `isOffline = true`  
- ตรวจสอบ Token Authentication (JWT) และ Headers ในการยิง Request

---

### 🔹 Phase 4: การทดสอบระบบและการตรวจสอบขั้นสุดท้าย (QA & Verification)

#### 4.1 Test Cases ที่ต้องตรวจสอบ:

1. **ทดสอบสร้างออเดอร์ในแอดมิน (Admin Wizard E2E):**  
   - กรอกข้อมูลลูกค้า (Step 1\) \-\> เลือกสเปกงานพิมพ์พร้อมปรับ % หมึกและฟินิชชิ่ง (Step 2\) \-\> สรุปยอดและกดยืนยัน (Step 3\)  
   - ออเดอร์ต้องบันทึกลงตาราง `orders` ใน PostgreSQL และแสดงบน Kanban Board สำเร็จ  
2. **ทดสอบติดตามสถานะฝั่งลูกค้า (Customer Tracking E2E):**  
   - นำ Order ID ที่เพิ่งสร้างจากแอดมิน ไปกรอกค้นหาในหน้า `TrackingPage` ของ Customer Service  
   - หน้าจอต้องแสดงสถานะ Timeline, รายการสเปก, และข้อมูลการจัดส่งถูกต้อง  
3. **ทดสอบค้นหาด้วยเบอร์โทรศัพท์และ UUID:**  
   - ทดสอบค้นหาด้วยเบอร์โทรศัพท์ลูกค้า \-\> ต้องแสดงรายการประวัติออเดอร์ทั้งหมด  
   - ทดสอบค้นหาด้วยรหัส UUID \-\> ต้องแสดงข้อมูลออเดอร์ถูกต้อง

---

## 📋 ไฟล์เป้าหมายที่เกี่ยวข้อง (Target Files)

- `admin-system/backend/orders/handlers.go`  
- `admin-system/backend/orders/models.go`  
- `admin-system/backend/pricing/engine.go`  
- `admin-system/frontend/src/features/orders/CreateOrderWizard.tsx`  
- `admin-system/frontend/src/features/orders/steps/CustomerDeliveryStep.tsx`  
- `admin-system/frontend/src/features/orders/steps/OrderSummaryConfirmStep.tsx`  
- `admin-system/frontend/src/components/pricing/ItemSpecConfigurator.tsx`  
- `customer-service/src/pages/TrackingPage.tsx`  
- `customer-service/src/api/client.ts`

