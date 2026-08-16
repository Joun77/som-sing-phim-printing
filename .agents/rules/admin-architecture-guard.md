---
trigger: always_on
---

---
name: admin-architecture-guard
description: ควบคุมโครงสร้างระบบ Admin System ตรรกะคำนวณราคา วงจรสถานะออเดอร์ การตัดสต็อก และการจัดการของเสียของร้าน Som Sing Phim
---

# Som Sing Phim - Admin System Architecture & Business Workflow Rules

## 1. Domain Separation & Access Role
- **Folder Boundary:** โค้ดทั้งหมดของระบบจัดการหลังบ้านต้องอยู่ใน `admin-system/` (Go Backend + React TS Frontend) แยกขาดจากระบบ Customer Service
- **Access Role:** รองรับโหมด `SUPER_ADMIN` / `OWNER` ควบคุม จัดการ และดูสถิติได้ทุกโมดูล

---

## 2. Order & Quotation Lifecycle (State Machine)
การเปลี่ยนสถานะของงานต้องเรียงตามลำดับอย่างเข้มงวด:

1. `QUOTATION` (ใบเสนอราคา):
   - แยกรายการสินค้าอิสระตามสเปก (เช่น สมุดสันปฏิทิน vs สันห่วง = 2 Items แยกกัน)
   - กำหนดสเปกวัสดุ (ขนาด, กระดาษ, จำนวนหน้า, วิธีเข้าเล่ม, ค่า Coverage %) และคำนวณราคา
2. `PENDING_PAYMENT` (รอยืนยันการชำระเงิน):
   - ลูกค้าตรวจใบเสนอราคาและชำระเงิน
3. `ORDER_CREATED` (สร้างออเดอร์จริง):
   - แปลงข้อมูลจากใบเสนอราคามาเปิดเป็น Order ในระบบ
4. `FILE_CONFIRMED` (ยืนยันไฟล์พิมพ์):
   - ตรวจสอบความถูกต้องของไฟล์อาร์ตเวิร์กกับลูกค้าก่อนเริ่มสั่งผลิต
5. `IN_PRODUCTION` (สั่งพิมพ์จริง - **POINT OF STOCK DEDUCTION**):
   - **Trigger สำคัญ:** ทำการตัดสต็อกกระดาษจริง และตัดสต็อกน้ำหมึกจริงอัตโนมัติผ่านสูตร (Coverage % × จำนวนหน้า × จำนวนพิมพ์)
   - ดำเนินการตัดสต็อกด้วย Database Transaction (`tx.Begin()`)
6. `COMPLETED` (พิมพ์เสร็จสมบูรณ์ / ส่งมอบ):
   - จบกระบวนการทำงานและบันทึกรายงานสรุปยอดผลิต

---

## 3. Spoilage, Cancellation & Inventory Integrity
- **Automated Spoilage Summary:** จำนวนกระดาษที่เผื่อเสียและของเสียระหว่างผลิต จะถูกตัดสต็อกและบันทึกเข้า `spoilage_logs` อัตโนมัติ เพื่อใช้สรุปรายงานของเสียประจำออเดอร์
- **Cancellation Policy:**
  - ยกเลิกก่อน `IN_PRODUCTION`: เปลี่ยนสถานะเป็น `CANCELLED` ได้ทันทีโดยไม่กระทบสต็อก
  - ยกเลิกขณะ `IN_PRODUCTION` เป็นต้นไป: ไม่คืนสต็อกที่ตัดไปแล้ว และคิดค่าปรับ/ค่าใช้จ่ายตามจริง
- **Financial Precision:** ห้ามใช้ `float64` ในการคำนวณเงินรวมของออเดอร์ ให้ใช้ระบบ Decimal หรือ Fixed-point เสมอ

---

## 4. Frontend & Backend Synchronization
- **Type Safety:** Interface ของ Frontend (`frontend/src/types/`) ต้องมีโครงสร้างและฟิลด์ตรงกับ Go Structs (`backend/orders/`, `backend/pricing/`) 100%
- **Persistence:** การบันทึกและดึงข้อมูลใบเสนอราคา/ออเดอร์ ต้องรองรับการ Fetch ซ้ำและจัดการด้วย Server State (เช่น TanStack Query) เพื่อป้องกันข้อมูลหายเมื่อ Refresh หน้าจอ