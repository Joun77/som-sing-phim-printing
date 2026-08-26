# Phase 1: Inventory Concurrency & Production Stock Deduction Lock (P0)

## 🎯 วัตถุประสงค์
ป้องกัน Race Condition และสต็อกติดลบ เมื่อมีคำสั่งซื้อเปลี่ยนสถานะเข้าสู่ `IN_PRODUCTION` พร้อมกันหลายรายการ หรือมีการกดยืนยันตัดสต็อกซ้ำซ้อน

---

## 📋 รายการงานย่อย (Tasks Checklist)

### [Task 1.1] Row-Level Locking ใน DB Transaction
- **ไฟล์เป้าหมาย:** `admin-system/backend/orders/handlers.go`, `admin-system/backend/inventory/`
- **สิ่งที่ต้องทำ:**
  1. ใช้ `SELECT quantity_on_hand, reserved_quantity FROM inventory_items WHERE id = $1 FOR UPDATE` ภายใน Transaction (`tx.Begin()`)
  2. ตรวจสอบเงื่อนไข `quantity_on_hand >= required_quantity` ก่อนทำการ `UPDATE`
  3. หากสต็อกไม่พอ ให้ Rollback Transaction และส่ง HTTP 409 Conflict พร้อมระบุ SKU ที่ไม่เพียงพอ

### [Task 1.2] Idempotency ในการเปลี่ยนสถานะเป็น IN_PRODUCTION
- **ไฟล์เป้าหมาย:** `admin-system/backend/orders/handlers.go`
- **สิ่งที่ต้องทำ:**
  1. ตรวจสอบสถานะปัจจุบันของ Order ก่อนตัดสต็อก (ต้องเป็น `FILE_CONFIRMED` เท่านั้น)
  2. หาก Order อยู่ในสถานะ `IN_PRODUCTION` หรือตัดสต็อกไปแล้ว ห้ามรัน Logic การตัดสต็อกซ้ำ

### [Task 1.3] Automated Unit & Concurrency Test
- **ไฟล์เป้าหมาย:** `admin-system/backend/orders/handlers_test.go`
- **สิ่งที่ต้องทำ:**
  1. เขียน Goroutine Concurrency Test จำลองการตัดสต็อกพร้อมกัน 10 Goroutines บน Item เดียวกันที่ของไม่พอ
  2. ยืนยันว่าสต็อกคงเหลือไม่ติดลบ และ Transaction จัดการคิวได้อย่างถูกต้อง

---

## 🔍 แผนการตรวจรับงาน (Verification Gate)
- [x] รัน `go test ./orders/... ./inventory/...` ผ่าน 100%
- [x] ตรวจสอบว่าไม่มีคำสั่ง Raw Query ตัดสต็อกนอก Transaction
- [x] มี Row-Level Locking (`FOR UPDATE`) ใน Transaction คุม Race Condition
- [x] มี Idempotency Check ป้องกันการตัดสต็อกซ้ำซ้อนเมื่อเปลี่ยนสถานะเป็น `IN_PRODUCTION` หลายครั้ง
