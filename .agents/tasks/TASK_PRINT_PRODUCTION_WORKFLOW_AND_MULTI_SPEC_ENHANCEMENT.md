# 📋 Task Plan: ยกระดับ Workflow งานผลิตโรงพิมพ์ Som Sing Phim (Multi-Item Orders, Batch Photos Imposition, Fast Presets & Hardcover Specs)

- **รหัสงาน:** `TASK-2026-09-PRODUCTION-WORKFLOW-AND-MULTI-SPEC`
- **ผู้ประสานงาน (Coordinator):** `somsing-coordinator`
- **เป้าหมายหลัก:**
  1. แก้ไขปัญหาความเหนื่อยล้าของฝ่ายขายในการเปิดใบเสนอราคางานซ้ำ ด้วยระบบ 1-Click Fast Presets และ Customer Re-order
  2. รองรับงานพิมพ์ภาพถ่ายจำนวนมาก (Batch Multi-Photos) ใน 1 รายการ พร้อมระบบจัดวาง Imposition (N-Up บน A4) และปุ่มดาวน์โหลดทั้ง ZIP และ PDF พร้อมพิมพ์
  3. ยกระดับระบบจัดการงานหนังสือ (Books) รองรับปกแข็ง (Hardcover / Case Binding) คำนวณวัตถุดิบจั่วปัง-ใบห่อ-ใบรองปกแยกจากเนื้อในอย่างถูกต้อง
  4. รองรับตรรกะแยกหน้าปกอัตโนมัติ (Cover Extraction) กรณีลูกค้าอัปโหลดไฟล์ PDF เดียวรวมทั้งปกและเนื้อใน ป้องกันการคิดต้นทุนกระดาษซ้ำซ้อน

---

## 👥 แผนการมอบหมายงานรายบุคคล (Team Matrix & Dispatch Allocation)

| ฝ่าย / บทบาท | สกิลที่รับผิดชอบ | ขอบเขตงานที่ได้รับมอบหมาย |
| :--- | :--- | :--- |
| 🗄️ **Database Analyst** | `somsing-database-analyst` | • เพิ่มประเภท `HARDCOVER_CASE_BINDING` ใน Enum และสเปกวัสดุ<br>• เพิ่ม Master Presets: หนังสือสันกาว (`TPL_PERFECT_BIND_BOOK`) และงานพิมพ์ภาพถ่าย (`TPL_PHOTO_PRINT`) ลงในชุดแม่แบบ<br>• รองรับฟิลด์จัดเก็บ Multi-File URLs สำหรับงาน Batch Photos |
| ⚙️ **Backend Developer** | `somsing-backend-developer` | • เชื่อมต่อ `CalculateImposition` เข้ากับ API ตรวจไฟล์และสรุปการตัดสต็อกกระดาษจริง (เช่น 40 รูป = 20 แผ่น A4)<br>• พัฒนา Endpoint สร้างไฟล์ดาวน์โหลดรวม ZIP และ Imposed Print-Ready PDF พร้อมมาร์คตัด<br>• พัฒนาตรรกะ Auto-Split หน้าปก (Deduct Cover Pages) เมื่ออัปโหลดไฟล์รวม |
| 🔒 **Security Specialist** | `somsing-security-specialist` | • ตรวจสอบความปลอดภัยของการอัปโหลดไฟล์พร้อมกันจำนวนมาก (Batch Multi-File Upload Limit, MIME Types, Path Traversal)<br>• ป้องกัน Resource Exhaustion (DoS) เมื่อสร้างไฟล์ ZIP หรือแปลง Imposed PDF ขนาดใหญ่ |
| 🎨 **UX/UI & Frontend** | `somsing-ui-ux-designer` & `somsing-frontend-developer` | • **หน้าใบเสนอราคา:** เพิ่มแถบ 1-Click Quick Preset Pills Bar (หนังสือสันกาว / พิมพ์รูปภาพ)<br>• **หน้าตรวจไฟล์ & ติดตามงาน:** พัฒนา Contact Sheet Gallery Grid ขนาดย่อ + Lightbox ซูมตรวจไฟล์ พร้อมปุ่ม Download ZIP และ Imposed PDF<br>• **การ์ดงานหนังสือ:** แสดงผลกล่องแยกอิสระ (Dual Control Box) ระหว่าง Cover Wrap และ Inner Block |
| 🔍 **QA Verification** | `somsing-qa-orchestrator` | • ดำเนินการทดสอบ 3 ชุด Test Cases: TC-01 (Batch Photos Imposition), TC-02 (Dual-Component Book), TC-03 (Hardcover Split Logic)<br>• ตรวจสอบ Type Safety (`tsc --noEmit`) และ Unit Tests ไม่ใช้ Playwright |

---

## 📅 ลำดับขั้นตอนการพัฒนา (Implementation Phases)

### Phase 1: Data Model & Pricing Presets Enhancement
- [x] เพิ่ม Default Templates ใน `defaultTemplates.ts`:
  - `TPL_PERFECT_BIND_BOOK`: ปก Art Card 260g เคลือบด้าน + กาวร้อน Horizon + เนื้อใน 80g
  - `TPL_HARDCOVER_BOOK`: ปกรองแผ่นจั่วปัง No.24 (2.0mm) + ใบห่อ Art 130g + ใบรองปก Endpapers 140g + กาว PVA Case Glue
  - `TPL_PHOTO_PRINT`: กระดาษ Photo Glossy 230g + ระบบพิมพ์ดิจิทัลความละเอียดสูง
- [x] เพิ่ม `HARDCOVER_CASE_BINDING` ใน `BindingType` และผูกสูตรวัตถุดิบ (จั่วปัง + ใบห่อ + ใบรองปก + กาวประกอบปก) รองรับทั้ง Go Pricing Engine และ React Frontend (Types, Invoice, Prepress, Shop Floor Tracker)

### Phase 2: Imposition Integration & Batch File Architecture
- [x] นำฟังก์ชัน `CalculateImposition` จาก Go backend มาประมวลผลขนาดรูปภาพเทียบกับแผ่น A4/A3 (`/api/v1/pricing/batch-imposition`)
- [x] สรุปยอดกระดาษใหญ่ที่ต้องตัดจริงส่งไปยังใบสั่งผลิต (เช่น สั่งรูป 40 รูป ➜ 3-Up on A4 = 14 แผ่น A4 + เผื่อเสีย 1 แผ่น = รวม 15 แผ่น) แสดงใน `PaperMaterialCard.tsx`
- [x] พัฒนา Service รวมไฟล์เป็น ZIP (`/api/v1/orders/batch-zip`) และสร้าง PDF จัดหน้าพร้อมเส้นมาร์คตัด (`impositionPdfGenerator.ts`) บน `ArtworkFilesCard.tsx`

### Phase 3: UX/UI Production Tracker & Quotation Fast-Lane
- [x] เพิ่มแถบ **Quick Preset Bar** (1-Click Fast Presets) ในหน้าสร้างใบเสนอราคา (`QuotationManager.tsx`) กดคลิกเดียวตั้งสเปกครบทั้ง 5 รูปแบบหลัก (สันกาว / ปกแข็ง / พิมพ์รูป / มุงหลังคา / ปฏิทิน)
- [x] อัปเดต `ArtworkFilesCard.tsx`:
  - โหมด Batch Photos: แสดง Contact Sheet Mini-Grid + ป้ายสรุป Imposition + ปุ่มดาวน์โหลด ZIP และ PDF พิมพ์จริง
  - โหมด Books: แสดง Dual Control Box (กล่องปก + กล่องเนื้อใน) พร้อมปุ่มดาวน์โหลดแยกเครื่องพิมพ์
- [x] เพิ่ม UI รองรับการตัดหน้าปกอัตโนมัติ (Cover Extraction Preview) เมื่อลูกค้าส่งไฟล์รวม 1 ไฟล์ แสดงทั้งใน `PaperAndCoverSection.tsx` และ `ArtworkFilesCard.tsx`

### Phase 4: Verification, Security & Delivery
- [x] รัน Unit Tests สำหรับสูตร Imposition และการตัดหน้าปก (`go test ./pricing ./orders`, `npm test`)
- [x] ตรวจสอบความปลอดภัยในการ Zip ไฟล์และการอัปโหลด Batch (MIME validation, File size limits, Directory Traversal prevention)
- [x] สรุปรายงานการส่งมอบงานใน [REPORT_PRINT_PRODUCTION_WORKFLOW_AND_MULTI_SPEC.md](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/reports/REPORT_PRINT_PRODUCTION_WORKFLOW_AND_MULTI_SPEC.md)
