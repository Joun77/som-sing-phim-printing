# PHASE 3: Auth & Role-Based Access Control (RBAC)

## TASK 3.1: Backend Auth Middleware & Roles
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/middleware/auth.go` (ถ้ายังไม่มีให้สร้าง) และ `backend/main.go`
- Implement JWT Auth Middleware ตรวจสอบว่าผู้ใช้ Login เข้ามาหรือไม่
- กำหนด Route Group (เช่น `/api/v1/admin`) และบังคับให้เรียกผ่าน Middleware
- รองรับการตรวจสอบสิทธิ์ตาม Role (เช่น `ADMIN`, `SALES`, `PRODUCTION`)

## TASK 3.2: Frontend Auth Setup & Context
**รายละเอียด:**
- ไฟล์เป้าหมาย: `frontend/src/` (อาจจะสร้าง `AuthProvider` ใหม่)
- เก็บ JWT Token และดึงข้อมูล User Login Profile มาพักไว้
- สร้าง Guard สำหรับ Route ป้องกันไม่ให้เข้าหน้า Admin โดยไม่ Login

## TASK 3.3: Frontend Role-Based Layout
**รายละเอียด:**
- ไฟล์เป้าหมาย: `frontend/src/components/layout/` หรือจุดที่จัดการ Sidebar Menu
- ซ่อนลิงก์/เมนูที่ไม่ได้รับอนุญาต เช่น Role `PRODUCTION` จะไม่สามารถเห็นหน้า `Finance` หรือแก้ไขราคาใน `Pricing Engine` ได้
