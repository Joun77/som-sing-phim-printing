# Task 37: Customer CRM Auto-Upsert & End-to-End Quotation Pipeline

## 📌 Mission & Context

แก้ไขปัญหาข้อมูลลูกค้าไม่ถูกบันทึกเมื่อสร้างออเดอร์หรือสร้างใบเสนอราคา และเชื่อมโยงข้อมูลลูกค้าข้ามระบบ (Quotation ➔ Order ➔ CRM Database) แบบอัตโนมัติ โดยตัดปัญหาการเกิดข้อมูลสูญหายหรือฟิลด์ว่างในหน้าจัดการลูกค้า

---

## 🎯 สรุปการแบ่งระยะงาน (Phase Breakdown)

\[ Phase 1: Go Backend Auto-Upsert & DB \] ──► \[ Phase 2: Quotation-to-Order Conversion \] ──► \[ Phase 3: Frontend Data Binding & CRM View \]

---

## 🚀 รายละเอียดการดำเนินงานแต่ละเฟส (Detailed Specifications)

### 🔹 Phase 1: Go Backend Auto-Upsert & Database Constraint

- **Target Files:**  
  - `admin-system/backend/customers/customers.go`  
  - `admin-system/backend/orders/handlers.go`  
  - `admin-system/backend/quotations/handlers.go`  
- **Technical Specs:**  
  1. สร้าง Transaction Helper ใน Go `getOrCreateCustomerID(tx *sql.Tx, name, phone, address, province, district string) (string, error)`:  
     - ค้นหาในตาราง `customers` ด้วย `phone`  
     - หากไม่พบ (`sql.ErrNoRows`): `INSERT INTO customers` สร้าง UUID ใหม่ และตั้งค่า `total_orders = 1`  
     - หากพบลูกค้าเดิม: อัปเดต `total_orders = total_orders + 1`, `last_order_at = NOW()`  
  2. ใน `CreateOrder` (`POST /api/orders`) และ `CreateQuotation` (`POST /api/quotations`):  
     - เรียกใช้ helper เพื่อผูก `customer_id` ลงในตาราง `orders` และ `quotations`  
     - บันทึกฟิลด์ Snapshot: `customer_name`, `customer_phone`, `customer_address` ป้องกันข้อมูลเพี้ยนหากลูกค้าเปลี่ยนที่อยู่ภายหลัง

---

### 🔹 Phase 2: Quotation-to-Order Pipeline Synchronization

- **Target Files:**  
  - `admin-system/backend/quotations/convert.go` (หรือ `handlers.go`)  
  - `admin-system/frontend/src/features/quotations/QuotationManager.tsx`  
- **Technical Specs:**  
  1. ใน Endpoint แปลงใบเสนอราคาเป็นออเดอร์ (`POST /api/quotations/:id/convert`):  
     - ทำการ Copy ข้อมูล `customer_id`, `customer_name`, `customer_phone`, `customer_address` จาก `quotations` ไปยัง `orders` โดยตรง  
     - ป้องกันฟิลด์ข้อมูลลูกค้าตกหล่นระหว่างการเปลี่ยนสถานะ  
  2. ส่งคืน `{ orderId, orderNumber, customerId }` กลับมายัง Frontend เพื่อเปลี่ยนหน้าไปยังหน้ารายละเอียดออเดอร์ทันที

---

### 🔹 Phase 3: Frontend Form Mapping & CRM View Integration

- **Target Files:**  
  - `admin-system/frontend/src/features/orders/steps/CustomerDeliveryStep.tsx`  
  - `admin-system/frontend/src/features/customers/CustomerDirectory.tsx`  
  - `admin-system/frontend/src/features/orders/ProductionTrackingPage.tsx`  
- **Technical Specs:**  
  1. ใน `CustomerDeliveryStep.tsx`:  
     - ตรวจสอบ Input ก่อนกดถัดไป: ต้องมี `customerName` และ `customerPhone` เสมอ  
     - ส่ง Payload โครงสร้างมาตรฐาน `{ customerId?, customerName, customerPhone, customerAddress, province, district, deliveryCarrier }`  
  2. ในหน้าแสดงรายละเอียดออเดอร์:  
     - รองรับการอ่านข้อมูลทั้งแบบ Flat (`order.customer_name`) และแบบ Nested (`order.customer?.name`) ป้องกันการแสดงผลเป็นค่าว่าง

---

## 📋 Verification & Acceptance Criteria

- [ ] เมื่อสร้างออเดอร์ใหม่ ข้อมูลลูกค้าจะถูกเพิ่มหรืออัปเดตในหน้า "ฐานข้อมูลลูกค้า (CRM)" ทันที  
- [ ] เมื่อกดแปลงใบเสนอราคาเป็นออเดอร์ ข้อมูลลูกค้า (ชื่อ, เบอร์โทร, ที่อยู่) จะถูกโอนย้ายไปยังออเดอร์ครบถ้วน 100%  
- [ ] หน้า Production Tracking แสดงชื่อและเบอร์โทรลูกค้าถูกต้อง ไม่เป็นช่องว่าง

