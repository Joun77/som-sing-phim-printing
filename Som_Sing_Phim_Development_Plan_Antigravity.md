# Som Sing Phim Printing - Strategic System Enhancement & AI Agent Execution Plan

**Document Version:** 1.0.0  
**Target Environment:** Antigravity AI Agent IDE & Go/TypeScript Stack  
**Scope:** Customer-Facing Platform, Admin Production Back-Office, and End-to-End Automation Pipeline  

---

## 1. Executive Summary & Architecture Overview

แผนยุทธศาสตร์การยกระดับระบบบริหารจัดการและบริการโรงพิมพ์ **Som Sing Phim** เพื่อเชื่อมประสานการทำงานระหว่าง:
1. **ระบบหน้าบ้าน (Customer-Facing Service & Portal):** เน้นความโปร่งใสของราคา, Digital Proofing, Self-Service, Preflight Check และระบบแจ้งเตือนเรียลไทม์
2. **ระบบหลังบ้าน (Admin Operations & Shop Floor):** เน้นการตัดสต็อกอัตโนมัติ (Inventory Auto-Deduction), จัดคิวเครื่องพิมพ์ (Machine Scheduling), ควบคุมของเสีย (Spoilage & QC Tracking) และคำนวณต้นทุน/กำไรสุทธิแบบไดนามิก
3. **Antigravity AI Agent Integration:** รองรับการ execute งานผ่าน Antigravity IDE ตามกฎโครงสร้าง, Type-Safe Guards และ Schema Persistence

```
+-----------------------------------------------------------------------------------+
|                        CUSTOMER FACING FRONTEND (React + TS)                     |
|  [Preflight Validator] -> [Live Proofing Viewer] -> [Self-Service & Reorder Hub]   |
+------------------------------------------+----------------------------------------+
                                           | REST / WebSockets / Webhooks
+------------------------------------------v----------------------------------------+
|                          GO BACKEND REST PERSISTENCE LAYER                        |
|  [Pricing Engine]    [Order Router & Jobs]    [Inventory & Spoilage]    [Auth/RBAC] |
+------------------------------------------+----------------------------------------+
                                           | GORM / SQL Queries
+------------------------------------------v----------------------------------------+
|                          POSTGRESQL RELATIONAL DATABASE                           |
|  - Users & Customers  - Orders & Items  - Stock & Lots  - Machine Queues  - Proofs|
+-----------------------------------------------------------------------------------+
```

---

## 2. Comprehensive System Gap Analysis

| ด้าน | สถานะปัจจุบัน | สิ่งที่ต้องปรับปรุง (Improvement) | สิ่งที่ต้องเพิ่มใหม่ (New Capabilities) |
| :--- | :--- | :--- | :--- |
| **หน้าบ้าน (Customer-Facing)** | รับออเดอร์และสอบถามผ่านแชต/หน้าเว็บพื้นฐาน | - ลดการรอคอยใบเสนอราคา<br>- เพิ่มความชัดเจนของสเปกและต้นทุนต่อหน่วย | - **Preflight File Checker** (ตรวจ DPI, Bleed, Color Space)<br>- **Digital Proof Sign-Off System** (อนุมัติแบบออนไลน์)<br>- **Self-Service Customer Portal** (ดูประวัติ, โหลดใบเสร็จ, สั่งพิมพ์ซ้ำ) |
| **หลังบ้าน (Admin & Ops)** | มีระบบสต็อก, งานสั่งซื้อ และบันทึกข้อมูลพื้นฐาน | - ระบบตัดสต็อกยังไม่อัตโนมัติตามขั้นตอนการผลิต<br>- การวางคิวงานพิมพ์ยังกระจายตัว | - **Automated Inventory Deduction** เมื่อ Job เข้าสถานะ `In Production`<br>- **Machine Scheduling Board** (Kanban/Gantt จัดคิวแท่นพิมพ์)<br>- **Multi-Stage Spoilage & QC Tracking** บันทึกของเสียรายเครื่องจักร |
| **ระบบเชื่อมต่อ (Integration)** | ข้อมูลหน้าบ้านและหลังบ้านแยกส่วนกัน | - กระบวนการแจ้งสถานะยังพึ่งพามือ | - **Webhook Notification Pipeline** (แจ้งเตือนสถานะงาน)<br>- **Production Job Ticket Auto-Generator** (ออกใบจ่ายงานช่างพิมพ์พร้อม QR code) |

---

## 3. Phased Roadmap (Timeline & Priorities)

```
+-----------------------------------------------------------------------------------+
| Phase 1: Core Automation & Inventory Synchronization (Sprint 1-2 / W1-W4)         |
| -> Database Migration, Inventory Auto-Deduction, Basic Webhook Status Engine       |
+-----------------------------------------------------------------------------------+
| Phase 2: Customer Experience & Proofing Pipeline (Sprint 3-4 / W5-W8)             |
| -> Preflight Validation, Digital Proofing Approval Portal, Pricing Transparency   |
+-----------------------------------------------------------------------------------+
| Phase 3: Production Floor Orchestration & Spoilage (Sprint 5-6 / W9-W12)          |
| -> Machine Scheduling Gantt/Kanban, Spoilage Tracking, Job Router Sheets         |
+-----------------------------------------------------------------------------------+
| Phase 4: Enterprise Intelligence & Customer Retention (Sprint 7+ / W13+)          |
| -> Automated Imposition Engine, Spoilage Analytics, Self-Service Reordering Hub   |
+-----------------------------------------------------------------------------------+
```

---

## 4. Antigravity AI Agent Step-by-Step Execution Plan

ชุดคำสั่งและขั้นตอนการปฏิบัติงานสำหรับ **Antigravity AI Agent** เพื่อนำไปรันในโปรเจกต์แบบเป็นลำดับขั้นตอน (Phase-by-Phase Task Instructions):

### Phase 1: Core Inventory Auto-Deduction & Status Pipelines
* **Task 1.1 (Backend - Database Schema Migration):**
  - อัปเดต `admin-system/backend/inventory/` ให้รองรับ Trigger/Hook ใน Go สำหรับการตัดสต็อกวัตถุดิบ (กระดาษ, เพลท, หมึก)
  - เพิ่ม Table `job_tickets` และฟิลด์ `stock_deducted_at` ใน `Order` Model
* **Task 1.2 (Backend - Inventory Deduction Service):**
  - สร้าง Service Function `DeductInventoryForJob(db *gorm.DB, orderID uint) error`
  - ตรวจสอบระดับสต็อกต่ำกว่าเกณฑ์แจ้งเตือน (Reorder Threshold) แล้วส่งออก Event Warning
* **Task 1.3 (Frontend - Admin Inventory Realtime View):**
  - ปรับปรุง Component ใน `admin-system/frontend/src/` เพื่อแสดงสถานะสต็อกแบบ Live Badge (เขียว/เหลือง/แดง)

### Phase 2: Preflight Validator & Digital Proof Approval
* **Task 2.1 (Customer Frontend - File Uploader & Client Preflight):**
  - พัฒนา Web Worker หรือ Client-side Canvas Reader ตรวจสอบความละเอียดรูปภาพ (DPI >= 300), ขนาดตัดตก (Bleed 3mm) และ Color Space Warning
  - แสดงผล Error/Warning ก่อนกดยืนยันอัปโหลด
* **Task 2.2 (Backend - Digital Proof Management):**
  - สร้าง Endpoint `POST /api/orders/:id/proof` สำหรับ Admin อัปโหลดไฟล์ Proof Preview (Watermarked WebP/PDF)
  - สร้าง Endpoint `POST /api/orders/:id/proof/approve` และ `reject` สำหรับให้ลูกค้ากดอนุมัติพร้อมบันทึก Timestamp + IP Signature
* **Task 2.3 (Customer Portal - Proof Sign-Off UI):**
  - สร้างหน้า Interactive Modal ให้ลูกค้าเลื่อนตรวจงานแบบ Side-by-side หรือ Zoom-in ได้ พร้อมปุ่ม "อนุมัติสั่งผลิต (Confirm Proof)"

### Phase 3: Production Floor Scheduling & Spoilage Tracking
* **Task 3.1 (Backend - Machine Queuing & Spoilage APIs):**
  - พัฒนาโมดูล `spoilage.go` ให้บันทึกสาเหตุของเสีย: `Printing Error`, `Lamination Bubble`, `Cutting Shift`, `Material Defect`
  - สร้าง Endpoint `GET /api/production/machines/schedule` และ `POST /api/production/spoilage`
* **Task 3.2 (Frontend - Production Kanban / Gantt Board):**
  - สร้าง UI จัดการคิวงานรายเครื่องจักร (Offset, Digital Sheet, Large Format, Die-cut, Laminator)
  - รองรับการ Drag-and-drop สลับคิวงานพร้อมคำนวณ Estimated Completion Time อัตโนมัติ

### Phase 4: Customer Self-Service & Intelligent Operations
* **Task 4.1 (Customer Frontend - One-Click Reorder Hub):**
  - หน้าประวัติการสั่งซื้อ (Order History) พร้อมปุ่ม `Re-order with Previous Specs` ดึงสูตรคำนวณราคาปัจจุบันแต่คงไฟล์ Artwork เดิม
* **Task 4.2 (Backend - Spoilage & Profit Analytics):**
  - สร้างรายงานสรุป Waste Percentage และ Margin Breakdown เปรียบเทียบต้นทุนจริง (Actual Cost) vs ต้นทุนประมาณการ (Estimated Cost)

---

## 5. Verification, Quality Assurance & Guardrails

เพื่อให้เป็นไปตามกฎของ Antigravity Agent:
1. **Rule Enforcement:**
   - ระบบหลังบ้านอยู่ในไดเรกทอรี `admin-system/`
   - ระบบบริการลูกค้าหน้าบ้านอยู่ใน `som-sing-phim-frontend/` (หรือตามโฟลเดอร์ customer service)
   - ห้ามลบ Pricing Engine Core Guard หรือแก้ไข Schema ที่กระทบ GORM Auto-Migration โดยไม่มี Fallback
2. **Test Strategy:**
   - รัน Go Backend Unit Tests ทุกครั้งหลังแก้โมดูล Pricing/Inventory: `go test ./...`
   - รัน Frontend Type Check: `npm run build` หรือ `tsc --noEmit`
3. **Acceptance Criteria (DoD):**
   - ทุก API มี Error Handling แบบ JSON RFC 7807
   - ทุกการตัดสต็อกต้องถูก Wrap อยู่ภายใต้ Database Transaction (`db.Transaction(...)`)