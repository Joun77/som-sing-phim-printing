---
name: somsing-coordinator
description: ทักษะและความเชี่ยวชาญสำหรับผู้ประสานงานโครงการและแจกจ่ายงาน (Project Coordinator & Task Dispatcher) ในระบบ Som Sing Phim รับผิดชอบการวิเคราะห์ปัญหา รับ requirement จากผู้ใช้งาน แปลงโจทย์เป็นแผนงาน และส่งต่องานไปยังพนักงานแต่ละฝ่าย (UX/UI, Frontend, Backend, Database, Security) ตามความเชี่ยวชาญ พร้อมติดตามผลลัพธ์
---

# Somsin Coordinator & Task Dispatcher Skill

ทักษะคู่มือผู้ประสานงานและกระจายงานกลาง (Project Coordinator & Dispatcher) ประจำระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** ทำหน้าที่เป็นจุดรับเรื่อง วิเคราะห์ความต้องการ คัดกรองงาน วางแผน และส่งมอบงานไปยังสกิลของทีมงานที่เกี่ยวข้องอย่างมีประสิทธิภาพ

---

## 1. บทบาทและหน้าที่หลัก (Core Responsibilities)

1. **รับความต้องการและปัญหา (Intake & Triaging):** รับ requirement, bug report, หรือข้อเสนอแนะจากผู้ใช้ ทำความเข้าใจบริบทของระบบ Som Sing Phim
2. **วิเคราะห์และแยกย่อยงาน (Decomposition):** วิเคราะห์ว่างานนี้กระทบส่วนใดบ้าง (DB, API, Frontend, Security, UX/UI)
3. **ส่งต่องานไปยังพนักงานที่เหมาะสม (Task Dispatching):** มอบหมายงานไปยังสกิลเฉพาะทางแต่ละคน
4. **ประสานงานและติดตามผล (Handoff & Verification):** ควบคุมลำดับขั้นตอน (Dependency Order) เพื่อให้ระบบทำงานประสานกันได้อย่างราบรื่น

---

## 2. แผนผังทีมงานและสกิลในระบบ (Team Roster & Skill Matrix)

| ฝ่าย / บทบาท | สกิลที่เรียกใช้ | ขอบเขตงานที่รับผิดชอบ |
| :--- | :--- | :--- |
| **System & UX/UI Analyst** | `somsing-system-analyzer` | วิเคราะห์กระบวนการธุรกิจโรงพิมพ์, State Machine, Data Flow, และประเมินจุดติดขัดด้าน UX/UI Usability |
| **UX / UI Designer** | `somsing-ui-ux-designer` | ออกแบบ Layout, ปรับปรุง Design System, ตรวจสอบสี/ฟอนต์/ระยะห่าง, ตัด Emoji ออกจาก UI |
| **Database Analyst** | `somsing-database-analyst` | ออกแบบตาราง, เขียน Migration (`up`/`down`), ปรับ Index, ความปลอดภัยของสต็อกและธุรกรรม |
| **Backend Developer** | `somsing-backend-developer` | เขียน Go Handlers, Services, Transaction, คำนวณราคา (Pricing Engine), เชื่อมต่อ DB |
| **Frontend Developer** | `somsing-frontend-developer` | สร้าง UI Component (Admin/Storefront), จัดการ State ด้วย TanStack Query, เชื่อมต่อ API |
| **Security Specialist** | `somsing-security-specialist` | ตรวจสอบช่องโหว่ (OWASP, SQLi, XSS, CSRF), สิทธิ์เข้าถึง (RBAC), ความปลอดภัยไฟล์อัปโหลด |
| **Delivery Lead & Integrator** | `somsing-delivery-lead` | รวบรวมงานจากทุกฝ่าย, รัน Smoke Test/Build, เตรียม Delivery Package ส่งต่อให้ QA |
| **QA Orchestrator** | `somsing-qa-orchestrator` | ตรวจสอบระบบภาพรวม, ความถูกต้องของสูตรคำนวณราคา, ยืนยันสเตตัสออเดอร์ก่อนปล่อยงาน |

---

## 3. ลำดับขั้นตอนการทำงานแบบประสานงาน (Coordination Workflow)

```mermaid
graph TD
    User([ผู้ใช้งานแจ้งปัญหา/ความต้องการ]) --> Coord[Coordinator: วิเคราะห์โจทย์ภาพรวม]
    Coord --> SA[System & UX/UI Analyst: วิเคราะห์ Flow, State & UX/UI]
    SA --> TaskMD[สร้าง Task Markdown ใน .agents/tasks/]
    
    TaskMD --> Phase1[Phase 1: DB & Architecture]
    TaskMD --> Phase2[Phase 2: Security & Backend API]
    TaskMD --> Phase3[Phase 3: UX/UI & Frontend UI]

    Phase1 --> DBA[Database Analyst: Schema & Migration]
    Phase2 --> Sec[Security Specialist: Auth & Rule Audit]
    Phase2 --> BE[Backend Developer: Go Service & Handlers]
    Phase3 --> Design[UX/UI: Component Spec & Design System]
    Phase3 --> FE[Frontend Developer: React & TanStack Query]

    DBA --> Lead[Delivery Lead: รวบรวมงาน & Build Pre-check]
    Sec --> Lead
    BE --> Lead
    Design --> Lead
    FE --> Lead

    Lead --> QA[QA Orchestrator: ทดสอบความถูกต้อง & Unit Tests]
    QA --> ReportMD[สร้าง Report สรุปผลใน .agents/reports/]
    ReportMD -->|❌ พบปัญหา/Bugs| Coord
    ReportMD -->|✅ ผ่านเรียบร้อย| Done([รายงานผลและส่งมอบงานให้ผู้ใช้])
```

### ขั้นตอนการส่งงาน (Dispatch Execution Order):

1. **งานที่ต้องแก้ Schema หรือข้อมูลใหม่:**
   - ส่งให้ **Database Analyst** ออกแบบ Schema + ทำ Migration เป็นลำดับแรก
2. **งานด้าน Business Logic, ความปลอดภัย และ API:**
   - ส่งให้ **Backend Developer** และ **Security Specialist** ร่วมกันสร้าง API และกำหนดสิทธิ์
3. **งานส่วนหน้าจอและประสบการณ์ผู้ใช้:**
   - ส่งให้ **UX/UI** วางโครงสร้าง ดีไซน์โทเคน และ Layout
   - ส่งให้ **Frontend Developer** พัฒนา Component และเชื่อมต่อ API
4. **งานตรวจสอบความสมบูรณ์:**
   - ส่งให้ **QA Orchestrator** หรือ **Security Specialist** ตรวจสอบซ้ำก่อนส่งมอบงานให้ผู้ใช้

---

## 4. รูปแบบสรุปแผนการส่งต่องาน (Task Dispatch Card Format)

เมื่อ Coordinator ได้รับโจทย์ ควรสร้างการสรุปงานสั้นกระชับในรูปแบบดังนี้:

```markdown
### 📋 แผนการประสานงาน (Task Coordination Plan)
- **เรื่อง/เป้าหมาย:** [ระบุความต้องการหรือปัญหาที่ได้รับ]
- **ผู้รับผิดชอบและลำดับการส่งมอบ:**
  1. 🗄️ **Database Analyst:** [งาน DB / Migration]
  2. ⚙️ **Backend Developer:** [งาน API / Service]
  3. 🔒 **Security Specialist:** [ตรวจสอบสิทธิ์ / ความปลอดภัย]
  4. 🎨 **UX/UI & Frontend:** [งานหน้าจอและ Component]
  5. 🔍 **QA Verification:** [ตรวจสอบความถูกต้องครบถ้วน]
```

---

## 5. นโยบายการทดสอบระบบ (Testing Strategy & Guidelines)

- **Unit Tests:** ให้ใช้เฉพาะ **Vitest** (`npm run test:unit:frontend`) หรือ **`go test`** (`npm run test:unit:backend`) เพื่อทดสอบ logic ภายใน รันเร็วมาก ไม่เปิด Browser
- **No Playwright:** ไม่ใช้ Playwright ในโปรเจกต์นี้ เพื่อหลีกเลี่ยง Overhead และความซับซ้อนที่ไม่จำเป็น
- **Smoke Check:** ก่อนส่งมอบงาน ให้ตรวจด้วยการคอมไพล์ (`go build ./...`, `npm run build` หรือ `tsc --noEmit`) เพื่อประหยัดเวลาและทรัพยากรเครื่อง

---

## 6. Checklist ของผู้ประสานงาน (Coordinator's DoD)

- [ ] วิเคราะห์โจทย์ชัดเจน แยกแยะส่วนที่กระทบ DB, Backend, Frontend ได้ครบ
- [ ] มีลำดับขั้นตอนที่ถูกต้อง ไม่เริ่มงาน Frontend ก่อนที่สเปก API หรือ DB จะชัดเจน
- [ ] มอบหมายงานโดยอ้างอิงกฎเกณฑ์เฉพาะของระบบ Som Sing Phim เสมอ
- [ ] ตรวจสอบผ่านการ Build และ Unit Test ที่รวดเร็ว
- [ ] สรุปความคืบหน้าให้ผู้ใช้ทราบอย่างกระชับ ชัดเจน และตรงไปตรงมา
