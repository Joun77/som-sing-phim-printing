# Phase 3: Customer Order Idempotency & Preflight Artwork Flow (P2)

## 🎯 วัตถุประสงค์
ป้องกันการสร้างออเดอร์ซ้ำซ้อนจากฝั่งลูกค้า (Double Submit) และเชื่อมต่อระบบตรวจสอบไฟล์พิมพ์ (Preflight Engine) เข้ากับคำสั่งซื้ออัตโนมัติ

---

## 📋 รายการงานย่อย (Tasks Checklist)

### [Task 3.1] Client-Side & Server-Side Idempotency
- **ไฟล์เป้าหมาย:** `customer-service/src/api/client.ts`, `customer-service/src/components/`, `admin-system/backend/orders/handlers.go`
- **สิ่งที่ต้องทำ:**
  1. สร้าง `idempotency_key` (UUID v4) ในคำขอสร้างออเดอร์หรือแจ้งชำระเงิน
  2. ทำ Client-side Disabling และ Debouncing บนปุ่มชำระเงิน/ยืนยันคำสั่งซื้อ
  3. Server เก็บ `idempotency_key` ในฐานข้อมูล หากได้รับ Key เดิมซ้ำภายใน 24 ชม. ให้ส่งคืน Response เดิมโดยไม่เปิดออเดอร์ใหม่

### [Task 3.2] Preflight Artwork Engine Integration
- **ไฟล์เป้าหมาย:** `admin-system/backend/preflight/`, `customer-service/src/components/PrintArtworkVisualizer.tsx`
- **สิ่งที่ต้องทำ:**
  1. ตรวจสอบ Resolution/DPI (ขั้นต่ำ 300 DPI สำหรับพิมพ์ออฟเซต/ดิจิทัล)
  2. ตรวจสอบ Color Mode (แจ้งเตือนหากเป็น RGB เพื่อแนะนำแปลงเป็น CMYK)
  3. ตรวจสอบระยะตัดตก (Bleed Area 3mm) และระยะปลอดภัย (Safe Margin)
  4. บันทึกผล Preflight Log ลงในตาราง `order_preflight_logs`

---

## 🔍 แผนการตรวจรับงาน (Verification Gate)
- [x] ทดสอบคลิกส่งคำขอสร้างออเดอร์ซ้ำด้วย `idempotency_key` เดิม ระบบคืน Response เดิมทันที (Idempotent 200 OK)
- [x] เพิ่ม `idempotency_key` ใน client-side payload `submitOrder`
- [x] ยืนยัน Frontend Build ทั้ง Customer Service และ Admin System ผ่านเรียบร้อย (0 build errors)
