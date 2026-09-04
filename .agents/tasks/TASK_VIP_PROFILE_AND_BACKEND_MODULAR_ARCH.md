# 📋 Task Plan: ปรับปรุง UX/UI โปรไฟล์ลูกค้า, ธีมสีแบรนด์ Som Sing Phim, จัดการ Tier List และจัดระเบียบ Backend Architecture

- **รหัสงาน:** `TASK-2026-09-VIP-PROFILE-REARCH`
- **ผู้ประสานงาน (Coordinator):** `somsing-coordinator`
- **เป้าหมาย:** 
  1. แก้ไข UX/UI หน้าโปรไฟล์ลูกค้า, แถบสถานะ VIP/Gold, ชั้นวางงานพิมพ์ล่าสุด (Quick Re-order Shelf) ให้ตรงตาม CI แบรนด์ (สีน้ำเงิน Royal Blue + สีทอง Luxury Gold) และตัดสีส้มที่ไม่สอดคล้องกับแบรนด์ออก
  2. แก้ไข Bug การแสดงผลข้อมูล `Invalid Date` และราคา `₭ 0` ในระบบ Re-order
  3. วิเคราะห์และจัดวางโครงสร้างระบบจัด Tier List ให้ชัดเจนระหว่างระดับสมาชิก VIP (Loyalty Tiers) กับประเภทกลุ่มลูกค้า (Channel Categories)
  4. แยกโมดูลและจัดระเบียบ Backend Architecture ใน `admin-system/backend/customers/` และ `orders/` จากไฟล์เดี่ยวขนาดใหญ่ ให้เป็นโมดูลย่อย (Models, Repository, Handlers, Public API, Tiers)

---

## 👥 ผู้รับผิดชอบและแผนการส่งต่องาน (Team Matrix)

| ฝ่าย / บทบาท | สกิลที่รับผิดชอบ | ขอบเขตงาน |
| :--- | :--- | :--- |
| 🗄️ **Database Analyst** | `somsing-database-analyst` | ตรวจสอบ Schema ของ `customer_vip_tiers`, ความเชื่อมโยงของคะแนนสะสม/ยอดใช้จ่าย และ Field mapping |
| ⚙️ **Backend Developer** | `somsing-backend-developer` | Refactor โค้ด Backend แยกไฟล์เป็น Component/Module (Models, Repo, Handlers, Tiers) และปรับ Response ให้เข้ากับ Frontend |
| 🔒 **Security Specialist** | `somsing-security-specialist` | ตรวจสอบ Public API Masking และการป้องกันสิทธิ์เข้าถึงข้อมูลส่วนบุคคลของลูกค้า |
| 🎨 **UX/UI & Frontend** | `somsing-ui-ux-designer` & `somsing-frontend-developer` | ออกแบบและปรับปรุง Component: `MemberPrivilegeStrip`, `CustomerProfileModal`, `QuickReorderShelf` ด้วยธีม Royal Blue & Luxury Gold |
| 🔍 **QA Verification** | `somsing-qa-orchestrator` | ตรวจสอบการคอมไพล์ (`tsc --noEmit`, `go build`), ตรวจสอบสถานะการเรนเดอร์ และสรุปรายงานใน `.agents/reports/` |

---

## 📅 ลำดับขั้นตอนการดำเนินการ (Execution Phases)

- [ ] **Phase 1: Database & Tier Architecture Clarification**
  - วิเคราะห์ความต่างระหว่าง Channel Category (`RETAIL`, `ONLINE`, `CORPORATE`, `CONTRACT_PARTNER`) กับ Loyalty Tier (`STANDARD`, `SILVER`, `GOLD`, `PLATINUM`)
  - วางโครงสร้างสิทธิ์และการจัดการ Tier List ในระบบ Admin

- [ ] **Phase 2: Backend Architecture Modularization**
  - แยกไฟล์ `admin-system/backend/customers/customers.go` (582 lines) ออกเป็น:
    - `models.go` (Structs, DTOs)
    - `repository.go` (DB queries & in-memory cache)
    - `handlers.go` (Admin Management APIs)
    - `public_handlers.go` (Customer Storefront Auth & Profile)
    - `tiers.go` (VIP Tiers query & business logic)
  - แยก Helper / State Transition Logic ใน `admin-system/backend/orders/`

- [ ] **Phase 3: Frontend UX/UI & Brand Identity (Royal Blue + Luxury Gold)**
  - อัปเดต `customer-service/src/types/customer.ts` รองรับ field snake_case และ camelCase
  - ปรับปรุง `MemberPrivilegeStrip.tsx`: เปลี่ยนสีส้มเป็น Royal Navy & Champagne Gold, ปรับ Badge VIP ให้อ่านง่ายหรูหรา
  - ปรับปรุง `CustomerProfileModal.tsx`: ปรับธีมการ์ด VIP ให้พรีเมียม, ปรับสีปุ่มและแท็บ, แก้ไข TypeScript type mismatch
  - ปรับปรุง `QuickReorderShelf.tsx`: แก้ไข Bug `Invalid Date` และ `₭ 0`, ปรับปรุง Card Layout ให้สวยงามกลมกลืนกับหน้าเว็บ

- [ ] **Phase 4: Smoke Test & Quality Assurance**
  - รัน `tsc --noEmit` ใน `customer-service`
  - ตรวจสอบความถูกต้องของโค้ด Go
  - สร้างรายงานสรุปใน `.agents/reports/`
