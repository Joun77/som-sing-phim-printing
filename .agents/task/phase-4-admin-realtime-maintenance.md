# Phase 4: Admin Realtime Sync & Machinery Maintenance Tracking (P3)

## 🎯 วัตถุประสงค์
ปรับปรุงประสบการณ์ผู้ใช้งานในระบบ Admin ด้วยการ Sync ข้อมูลสถานะแบบ Realtime ผ่าน SSE และบันทึกประวัติบำรุงรักษาเครื่องจักรเพื่อคิดค่าเสื่อมและต้นทุนต่อชั่วโมงได้แม่นยำ

---

## 📋 รายการงานย่อย (Tasks Checklist)

### [Task 4.1] Centralized SSE TanStack Query Invalidation
- **ไฟล์เป้าหมาย:** `admin-system/frontend/src/` (Global Query Provider / App shell)
- **สิ่งที่ต้องทำ:**
  1. สร้าง Global SSE Event Listener ฟัง Event: `order.updated`, `inventory.deducted`, `inbound.created`
  2. สั่ง Invalidate Query Keys อัตโนมัติ (`queryClient.invalidateQueries({ queryKey: [...] })`) เพื่อให้ข้อมูลทุกแท็บ/เครื่อง Sync ตรงกันโดยไม่ต้องกดรีเฟรชหน้าจอ

### [Task 4.2] Machinery Maintenance Log & Dynamic Depreciation
- **ไฟล์เป้าหมาย:** `admin-system/backend/catalog/`, `admin-system/backend/pricing/engine.go`, `admin-system/frontend/`
- **สิ่งที่ต้องทำ:**
  1. เพิ่มตาราง `machine_maintenance_logs` เพื่อบันทึกประวัติซ่อม/บำรุงรักษา
  2. ปรับสูตรคำนวณ Machine Hourly Rate ใน Pricing Engine ให้นำค่าใช้จ่ายบำรุงรักษาจริงมาคำนวณเฉลี่ยร่วมกับค่าเสื่อมราคา

---

## 🔍 แผนการตรวจรับงาน (Verification Gate)
- [x] เชื่อมต่อ Global SSE EventSource Listener ใน `App.tsx` เพื่อ Invalidate TanStack Queries เมื่อมี Event สถานะงานหรือสต็อก
- [x] ยืนยันการทำงานของระบบ Predictive Maintenance และ Maintenance Tickets ใน Backend
- [x] Frontend Build ของ Admin System ผ่านเรียบร้อย 100%
