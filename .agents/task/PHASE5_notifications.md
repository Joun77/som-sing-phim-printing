# PHASE 5 — Notification System (WhatsApp + Telegram)
**สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed) | **Priority:** High | **ต้องทำหลัง Phase 1**

---

## 🤖 Role ของ AI

คุณคือ **Integration Engineer + Go Backend Developer** ที่เชี่ยวชาญ:
- WhatsApp Business API (Meta Cloud API) — Template Messages
- Telegram Bot API — sendMessage, inline keyboards
- Go HTTP client, webhook handlers, event-driven architecture
- React TypeScript: Settings/Config UI forms

---

## ข้อห้ามเด็ดขาด

- ❌ ห้ามส่งโค้ดทั้งไฟล์ — ส่งเฉพาะส่วนที่เพิ่ม/แก้
- ❌ ห้าม hardcode API token ลงในโค้ด — ต้องอ่านจาก ENV เสมอ
- ❌ ห้ามส่ง Internal cost/margin ไปยังลูกค้าในทุก message
- ❌ ห้ามเพิ่ม notification event นอก list ที่กำหนด
- ❌ ห้ามแก้ไข `notifications/email.go` หรือ `notifications/line_bot.go` — ไม่ได้ใช้ใน Phase นี้

---

## สถาปัตยกรรม Notification System

```
Order/Inventory Event
        ↓
Dispatcher (dispatcher.go)  ← อ่าน Config จาก DB
        ↓
   ┌────┴────┐
WhatsApp  Telegram
(ลูกค้า) (Admin Team)
```

---

## TASK 5.1 — Database Migration: Notification Config & Logs

**ไฟล์สร้างใหม่:** `admin-system/backend/migrations/000012_create_notification_tables.up.sql`

**Acceptance Criteria:**
- [x] Migration สำเร็จ
- [x] Default config seed ครบ 10 rows

---

## TASK 5.2 — WhatsApp Business API Client

**ไฟล์สร้างใหม่:** `admin-system/backend/notifications/whatsapp.go`

**Acceptance Criteria:**
- [x] ไม่มี API token ใน source code
- [x] ทุก call บันทึกผลลงใน `notification_logs`

---

## TASK 5.3 — Telegram Bot Client

**ไฟล์สร้างใหม่:** `admin-system/backend/notifications/telegram.go`

**Acceptance Criteria:**
- [x] Telegram message ส่งได้และแสดงใน Group ถูกต้อง
- [x] ทุก call log ลง `notification_logs`

---

## TASK 5.4 — Notification Dispatcher

**ไฟล์สร้างใหม่:** `admin-system/backend/notifications/dispatcher.go`

**Acceptance Criteria:**
- [x] Order status change → Notification ส่งใน background
- [x] API response time ไม่เพิ่มจาก Notification dispatch

---

## TASK 5.5 — Digital Proof Customer Link

**Backend ที่ต้องสร้าง:**
- `GET /api/v1/proof/{order_id}/{token}` — Public (ไม่ต้อง auth, ตรวจสอบ JWT token 48h)
- `POST /api/v1/proof/{order_id}/{token}/approve`
- `POST /api/v1/proof/{order_id}/{token}/reject`

**Frontend ที่ต้องสร้าง:**
- `customer-service/src/pages/ProofReviewPage.tsx`

**Acceptance Criteria:**
- [x] Proof link ทำงานได้โดยไม่ต้อง login
- [x] Token expire 48h → ไม่สามารถ approve/reject ได้
- [x] Approve/Reject → Admin รับ Telegram แจ้งเตือนทันที

---

## TASK 5.6 — Notification Config UI (Admin Settings)

**ไฟล์แก้:** `admin-system/frontend/src/features/profile/components/NotificationSettingsTab.tsx`

**Backend Endpoints ที่ต้องสร้าง:**
```go
GET  /api/v1/admin/notification-config    -- ดึง config ทั้งหมด
PUT  /api/v1/admin/notification-config    -- อัปเดต toggle
POST /api/v1/admin/notification-test      -- ส่ง test message
```

**Acceptance Criteria:**
- [x] บันทึก Config → dispatch จริงตาม toggle
- [x] Test Send ส่งข้อความ "🧪 Test from Som Sing Phim Admin"

---

## ลำดับการ Assign งาน (แยก Session)

| Session | Task | ขึ้นอยู่กับ |
|---|---|---|
| Session A | TASK 5.1 DB Migration | Phase 1 เสร็จ |
| Session B | TASK 5.2 WhatsApp Client | 5.1 เสร็จ |
| Session C | TASK 5.3 Telegram Client | 5.1 เสร็จ (parallel กับ 5.2) |
| Session D | TASK 5.4 Dispatcher + Hook into Order Handlers | 5.2, 5.3 เสร็จ |
| Session E | TASK 5.5 Digital Proof Customer Link | 5.4 เสร็จ |
| Session F | TASK 5.6 Config UI | 5.4 เสร็จ |

**หมายเหตุ:** Session B และ C สามารถทำพร้อมกันได้ (independent)
