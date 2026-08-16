# สรุปรายงานการวิเคราะห์และแผนการปรับปรุงระบบ Admin System (Som Sing Phim)
**ระบบที่วิเคราะห์:** `admin-system` (Go Backend + React TypeScript Frontend)  
**วันที่:** 17 สิงหาคม 2026

---

## 1. การเจาะลึกฝั่ง Backend (Go Architecture & Modules)

### 1.1 Pricing Engine (`backend/pricing/`)
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. **Floating-point Imprecision:** การคำนวณเงินและต้นทุนการพิมพ์ส่วนใหญ่ใช้ `float64` ซึ่งอาจทำให้เกิดความคลาดเคลื่อนทางทศนิยม (Rounding error) เมื่อคำนวณยอดออเดอร์จำนวนมาก
  2. **Monolithic Pricing Logic:** ตรรกะการคำนวณถูกมัดรวมไว้ในฟังก์ชันเดียว ทำให้เพิ่มประเภทเครื่องพิมพ์ (Offset vs Digital vs Inkjet) หรือการเพิ่มบริการหลังพิมพ์ (Lamination, Die-cut, Binding) ทำได้ยาก
  3. **Ink Comparison Formula:** ยังขาดโครงสร้างการเปรียบเทียบระหว่างหมึกแท้ที่เป็น Baseline กับหมึกเทียบ (Compatible Ink) ซึ่งมีปริมาณ ml และอัตรา Coverage ไม่เท่ากัน
* **แนวทางแก้ไขและปรับปรุง:**
  * ปรับชนิดข้อมูลเงินตราและการคำนวณเป็น Fixed-point หรือใช้ไลบรารีประเภท Decimal (`shopspring/decimal`)
  * ปรับสถาปัตยกรรมเป็น Strategy Pattern โดยแยก Calculator ออกตามประเภทเครื่องพิมพ์และเทคโนโลยีการพิมพ์
  * บังคับใช้ Unit Test ครอบคลุมเคสขอบเขต (Edge cases เช่น ปริมาณน้อยมาก/มากผิดปกติ, Margin ติดลบ)

---

### 1.2 Inventory, Inbound & Spoilage (`backend/inventory/`, `backend/inbound/`, `backend/spoilage/`)
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. **Offcut Management (`offcuts.go`):** ยังขาดตรรกะการคำนวณว่าเศษกระดาษขนาดใดคุ้มค่าแก่การนำกลับมาวนเป็นสต็อก (Reusable Stock) และขนาดใดต้องตัดเป็นขยะสูญเสีย (Spoilage)
  2. **Inbound Specs Data Validation (`inbound.go`):** การนำเข้าสเปกเครื่องพิมพ์และหมึกมีฟิลด์จำเพาะสูง หาก Validation ตรวจสอบไม่เข้มงวด อาจเกิดกรณีค่า Default หรือ `null` หลุดเข้าฐานข้อมูล
  3. **Atomic Cut-off:** การตัดสต็อกและบันทึก Inbound ยังไม่ได้ครอบคลุมด้วย Database Transaction แบบสมบูรณ์ในทุกสภาวะ Error
* **แนวทางแก้ไขและปรับปรุง:**
  * กำหนด Threshold ขนาดและพื้นที่ของเศษกระดาษ (Grain & Dimension Rule) เพื่อแยกลงตารางสต็อกเศษกระดาษ หรือตารางขยะสูญเสียอัตโนมัติ
  * นำ `database/sql` Transaction (`tx.Begin()`) มาคุมการทำงานของ Inbound และ Stock Deduction
  * เชื่อมโยง Inbound ล็อตใหม่เข้ากับฐานข้อมูล Pricing Rate เพื่อแจ้งเตือนการเปลี่ยนแปลงต้นทุน

---

### 1.3 Orders & Document Generation (`backend/orders/`)
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. **Order State Machine:** ขาดการล็อก State Transition (เช่น จาก `Draft` -> `Quotation` -> `In_Production` -> `Completed` / `Cancelled`) เสี่ยงต่อการเกิด Race Condition หรือการตัดสต็อกซ้ำซ้อน
  2. **Synchronous PDF Engine (`pdf.go`):** การเรนเดอร์ใบเสนอราคา/ใบแจ้งหนี้แบบ Synchronous บน Goroutine หลัก อาจทำให้เซิร์ฟเวอร์เกิด Memory/CPU Spike หากมีคำขอพร้อมกันหลายรายการ
* **แนวทางแก้ไขและปรับปรุง:**
  * สร้าง State Machine พร้อม Guard Function ตรวจสอบเงื่อนไขก่อนอนุญาตให้เปลี่ยนสถานะออเดอร์
  * ปรับการสร้าง PDF ให้มีระบบ Template Caching และประมวลผลผ่าน Background Worker หรือ Stream Response

---

### 1.4 Database Layer & Connection (`backend/db/`, `migrations/`)
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. การตั้งค่า Connection Pool อาจยังไม่แมตช์กับทรัพยากรบน Production (Render / Cloud Container)
  2. ขาดการทำ Indexing ใน Foreign Keys และฟิลด์ค้นหาบ่อย เช่น `order_id`, `customer_id`, `sku_code`, `created_at`
* **แนวทางแก้ไขและปรับปรุง:**
  * กำหนดค่า `SetMaxOpenConns`, `SetMaxIdleConns`, และ `SetConnMaxLifetime` ให้เหมาะสม
  * เพิ่ม Migration Scripts สำหรับการทำ B-Tree Index บน Foreign Keys และ Composite Index บนฟิลด์การค้นหาหลัก

---

## 2. การเจาะลึกฝั่ง Frontend (React + TypeScript Admin)

### 2.1 State Management & Data Persistence
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. **Refresh Data Drop:** การเก็บ State บางส่วนไว้ใน Component Memory หรือ Context โดยไม่มี Caching Layer ทำให้ข้อมูลหายเมื่อผู้ใช้กด Refresh หน้าเว็บ
  2. **No Offline-First / Sync Resilience:** เมื่อเกิด Network Hiccup ระหว่างกรอกฟอร์มนำเข้าหรือจัดการออเดอร์ ข้อมูลที่กรอกอาจสูญหายทันที
* **แนวทางแก้ไขและปรับปรุง:**
  * ติดตั้งและใช้งาน **TanStack Query (React Query)** สำหรับจัดการ Server State, Caching, Stale-time, และ Auto-refetch
  * นำ Local Storage Draft Persistence มาใช้กับฟอร์มที่มีความยาวและซับซ้อน (เช่น Inbound Form, Multi-step Order)

---

### 2.2 Type Safety & API Synchronization
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. Interface ในฝั่ง TypeScript และ Struct ในฝั่ง Go มีบางจุดที่ตั้งชื่อไม่ตรงกันหรือจัดการ `null`/`undefined` ต่างกัน
  2. ขาด Schema Validation ฝั่ง Client-side (เช่น Zod หรือ Yup) ทำให้ส่ง Payload ที่ไม่สมบูรณ์ไปให้ Backend
* **แนวทางแก้ไขและปรับปรุง:**
  * จัดระเบียบ Type Definition รวมไว้ที่ `frontend/src/types/` แยกตามโมดูล
  * ใช้ **Zod** ในการ Validate Form Input ก่อนส่งข้อมูลเข้าสู่ API

---

### 2.3 UI/UX & Responsive Layout
* **ปัญหา / ข้อจำกัดที่ตรวจพบ:**
  1. ตารางแสดงรายการสต็อกและออเดอร์ยังขาดระบบ Pagination, Column Filtering, และ Virtual Scrolling สำหรับข้อมูลปริมาณมาก
  2. การแจ้งเตือน Error Message ยังเป็นแบบกว้างๆ ไม่ได้ระบุฟิลด์ที่มีปัญหาอย่างชัดเจน
* **แนวทางแก้ไขและปรับปรุง:**
  * เพิ่ม Data Table Component ที่รองรับ Pagination, Sorting, Search Debounce
  * ปรับ Toast Notification และ Inline Field Error ให้ตรงกับ Validation Error จาก Backend

---

## 3. แผนการดำเนินงานและจัดลำดับความสำคัญ (Action Roadmap)

| ลำดับ | รายการปรับปรุง | ส่วนงาน | ผลกระทบ | ความสำคัญ |
| :---: | :--- | :---: | :--- | :---: |
| **Phase 1** | **Database Transaction & Atomicity** | Backend | ป้องกันข้อมูลสต็อกเพี้ยนและออเดอร์ตกหล่น | 🔴 Critical |
| **Phase 2** | **Pricing Engine Decimal Refactor** | Backend | ป้องกันการปัดเศษเงินและคำนวณต้นทุนคลาดเคลื่อน | 🔴 Critical |
| **Phase 3** | **TanStack Query Server State Sync** | Frontend | แก้ปัญหาข้อมูลหายเมื่อ Refresh หน้าเว็บ | 🟡 High |
| **Phase 4** | **Order State Machine Guard** | Backend | ควบคุม Flow สถานะงานพิมพ์และป้องกันการตัดสต็อกซ้ำ | 🟡 High |
| **Phase 5** | **Form Validation (Zod) & DTO Sync** | Fullstack | เสริมความปลอดภัยของข้อมูลและลด Runtime Error | 🟢 Medium |
| **Phase 6** | **Offcuts & Spoilage Automation** | Backend | เพิ่มความแม่นยำในการบริหารต้นทุนเศษกระดาษ | 🟢 Medium |

---
*เอกสารนี้จัดทำขึ้นสำหรับการวางแผน Refactor และพัฒนาต่อยอดระบบ Som Sing Phim Admin System*
