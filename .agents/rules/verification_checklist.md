---
trigger: manual
---

# 🧪 Quality Assurance & Implementation Verification Checklist

รายการตรวจสอบการเขียนโค้ดและการทำงานของระบบตามข้อกำหนด พร้อมสถานะและคำอธิบายสรุป:

---

## 1. 🗄️ Backend & Database Verification (Go & PostgreSQL)

- [x] **1.1 DB Connection & Driver:**
  - เพิ่ม `github.com/lib/pq` ใน `go.mod` และรัน `go mod tidy` เรียบร้อย
  - ไฟล์ `backend/db/db.go` เชื่อมต่อ PostgreSQL พร้อมตั้งค่า Connection Pool (`SetMaxOpenConns(25)`, `SetMaxIdleConns(5)`, `SetConnMaxLifetime(5m)`)
  - เรียกใช้ `db.InitDB()` ใน `backend/main.go` เมื่อเริ่มรันเซิร์ฟเวอร์

- [x] **1.2 Database Migrations & Schema:**
  - ตาราง `printers` และตารางที่เกี่ยวข้องถูกกำหนดสคริปต์สร้างใน `001_master_printer_ink_paper_quotation_spec.sql`
  - Column `components`, `technical_specs`, และ `oem_baseline_specs` ถูกกำหนดเป็นชนิด `JSONB`
  - สร้างตาราง `inbound_transactions` สำหรับเก็บประวัติ Transaction นำเข้าสินค้าและใบเสร็จ

- [x] **1.3 API Endpoints & CRUD Queries:**
  - `POST /api/v1/assets/inbound`: ทำงานบันทึก Log ลง `inbound_transactions` และ UPSERT ข้อมูลเครื่องพิมพ์ลง `printers`
  - `GET /api/v1/assets`: ดึงรายการ Asset ทั้งหมดจาก PostgreSQL
  - `GET /api/v1/assets/:id`: ดึง Asset รายตัวพร้อม Parse ข้อมูล `JSONB` (`components`, `oem_baseline_specs`, `technical_specs`)
  - `PUT /api/v1/assets/:id`: อัปเดตข้อมูล Master Asset Specification ลง PostgreSQL

---

## 2. 🎨 Frontend UI & Separation of Concerns (React / TypeScript)

- [x] **2.1 Modal Separation (แยกหน้าที่ชัดเจน):**
  - `DynamicInboundModal.tsx`: ใช้สำหรับรับเข้าสินค้า/สั่งซื้อ Restock ยิง API `POST /api/v1/assets/inbound`
  - `AssetEditModal.tsx`: ใช้สำหรับแก้ไขสเปก Master Asset และ Category Specs ยิง API `PUT /api/v1/assets/:id`

- [x] **2.2 Asset Detail Side-Drawer (`MaterialDetailsPage.tsx` / `PrinterSpecDetail.tsx`):**
  - แสดงผล **OEM Baseline Ink Specs** สเปกหมึกแท้มาตรฐาน (OEM Ink Code, Volume, ISO Yield, Base Rate `ml/page`)
  - แสดงผล **Wear Components Lifecycle** สภาพอะไหล่สิ้นเปลือง (`components[]`) ผ่าน Progress/Gauge bars เทียบกับ Threshold %

- [x] **2.3 State Sync & Persistence (`AppContext.tsx`):**
  - มี `useEffect` ดึงข้อมูล Asset ล่าสุดจาก `/api/v1/assets` ทันทีเมื่อ App Mount
  - เมื่อมีการเพิ่ม/แก้ไขสินทรัพย์ ฟังก์ชัน `addEquipment` / `updateEquipment` จะทำการ sync กับ API และอัปเดต State ล่าสุด

---

## 3. 🔄 End-to-End & Persistence Testing

- [x] **3.1 Page Refresh Test (ทดสอบ Refresh หน้าเว็บ):**
  - เมื่อ Refresh หน้าจอ ข้อมูลดึงจาก Backend API/Database ไม่สูญหาย

- [x] **3.2 Server Restart Test (ทดสอบ Restart Backend):**
  - เมื่อ Restart Go Backend ข้อมูลจะถูกโหลดกลับมาจาก PostgreSQL persistence ล่วงหน้าได้อย่างถูกต้อง

---

## 📝 Summary & Notes
* **สถานะรวม:** [x] PASS
* **หมายเหตุ/สรุปผล:**
  - รัน `go build -v .` ผ่านสมบูรณ์ไม่มี Error (0 errors)
  - รัน `npm run typecheck` ผ่านสมบูรณ์ไม่มี TypeScript Error (0 errors)