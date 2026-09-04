# Phase 1: Database & Backend Foundations for Cross-Browser Persistence

> **STATUS: COMPLETED & VERIFIED (เสร็จสมบูรณ์ 100%)**
> - **วันที่ส่งมอบ:** 2026-09-05
> - **ผู้รับผิดชอบ:** `somsing-database-analyst` & `somsing-backend-developer`
> - **สถานะ:** บันทึกและดึงข้อมูลผ่าน PostgreSQL สำเร็จ, Health Check & Rates API ใช้งานได้จริง, ผ่าน Go Test 100%

## 1. Role & Identity
- **Role:** Senior Go & Database Engineer (`somsing-database-analyst` & `somsing-backend-developer`)
- **Stack:** Go (Gin/Fiber), PostgreSQL 15, RESTful JSON APIs, Transaction Management
- **Context:** Som Sing Phim Printing System — Order & Catalog Synchronization Layer

## 2. Objective
ย้ายศูนย์กลางการจัดเก็บข้อมูลสถานะคำสั่งซื้อ (Orders), อัตราแลกเปลี่ยน (Exchange Rates), และสถานะตะกร้า/แคตตาล็อก จากการพึ่งพา `localStorage` ของเบราว์เซอร์ มาสู่ PostgreSQL Database 100% ผ่าน REST API เพื่อให้ข้อมูลของร้านพิมพ์และลูกค้ารองรับการเปิดใช้งานพร้อมกันได้จากทุกเบราว์เซอร์ (Chrome, Safari, Firefox, มือถือ) โดยไม่สูญหายและไม่ติดปัญหา Mockup Data isolation

---

## 3. Target Files to Modify
- `admin-system/backend/orders/handlers.go`
- `admin-system/backend/orders/service.go`
- `admin-system/backend/catalog/handlers.go`
- `admin-system/backend/server/handler/rates_handler.go`
- `migrations/` (หากจำเป็นต้องเพิ่มคอลัมน์หรือดัชนี)

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** สูตรคำนวณต้นทุนโรงพิมพ์ (Pricing Engine, Paper Grammage Cost, Ink Coverage, Machine Depreciation formulas)
- **DO NOT TOUCH** โมดูลสิทธิ์และความปลอดภัย Admin Auth / JWT Verification นอกเหนือจากการเปิดให้ Customer Storefront ยิง API สาธารณะได้ถูกต้อง
- **DO NOT TOUCH** โค้ดตัดสต็อกสินค้าและกระดาษอัตโนมัติ (Inventory Stock Deduction logic) ในส่วน Production Execution
- ห้ามตัด Response format หรือฟิลด์เดิมของ `/api/orders`, `/api/rates`, `/api/catalog` ที่ Frontend ใช้อยู่

---

## 5. Detailed Tasks & Implementation Instructions

### Task 1.1: ปรับปรุง Endpoints คำสั่งซื้อสาธารณะ (/api/orders & /api/orders/track) ให้เชื่อมต่อ DB โดยสมบูรณ์
- **ปัญหา:** เมื่อ Frontend ยิง `POST /api/orders` หาก Backend ขัดข้อง หรือเชื่อมต่อไม่ครบวงจร Frontend จะดีดกลับไปเขียนลง Mockup `localStorage` ทันที ทำให้ข้อมูลถูกเก็บแยกตาม Browser
- **การดำเนินการ:**
  1. ตรวจสอบ Handler `POST /api/orders` ให้รองรับ Payload ทั้งแบบ Simple Order และ Book Order พร้อมบันทึกลงฐานข้อมูล PostgreSQL ตาราง `orders` และ `order_items` ทันที
  2. ตรวจสอบให้แน่ใจว่า Idempotency Key ป้องกันการกดสั่งซ้ำทำงานได้สมบูรณ์ในระดับ DB
  3. คืนค่า HTTP 201 พร้อม `order_id`, `order_number`, `status`, และ `created_at` ที่เป็นมาตรฐาน

### Task 1.2: จัดทำ API กลางสำหรับ Exchange Rates (/api/rates) ที่ดึงค่าจาก DB
- **ปัญหา:** อัตราแลกเปลี่ยน THB/LAK ในแต่ละ Browser ปัจจุบันถูกเก็บแยกใน `localStorage` (`ss_print_rates_v1` และ `ssp_cached_rates`) ทำให้ราคาที่แสดงระหว่าง Browser ต่างกันได้
- **การดำเนินการ:**
  1. ปรับปรุง Handler `GET /api/rates` และ `PUT /api/v1/finance/exchange-rates` ให้บันทึกและอ่านจากตารางฐานข้อมูลกลาง
  2. ส่งค่าทั้ง Buy Rate และ Sell Rate ในรูปแบบ JSON ที่สอดคล้องกัน

---

## 6. Verification & Acceptance Criteria
1. รัน Go Unit Test ผ่าน 100%:
   ```bash
   npm run test:unit:backend
   ```
2. ทดสอบยิง `POST /api/orders` และ `GET /api/orders/track?q={ORDER_ID}` ผ่าน Curl หรือ Test Case ต้องได้ข้อมูลที่ตรงกับฐานข้อมูลจริง ไม่ใช่ Mock Data
3. รัน Health Check `GET /api/health` แล้วได้สถานะ HTTP 200 `{ "ok": true, "status": "healthy" }`
