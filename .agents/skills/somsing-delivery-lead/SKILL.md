---
name: somsing-delivery-lead
description: ทักษะและความเชี่ยวชาญสำหรับหัวหน้าฝ่ายส่งมอบและรวบรวมผลงาน (Delivery Lead & Code Integrator) ในระบบ Som Sing Phim รับผิดชอบการรวบรวมผลลัพธ์จากทีมนักพัฒนา (DB, Backend, Frontend, UX/UI, Security), ตรวจสอบความพร้อมเบื้องต้น (Build & Pre-check), จัดทำชุดส่งมอบ (Delivery Package), และส่งรายงานผลรวมให้ QA Tester ตรวจสอบ
---

# Somsin Delivery Lead & Integrator Skill

ทักษะคู่มือหัวหน้าฝ่ายส่งมอบและรวบรวมผลงาน (Delivery Lead & System Integrator) ประจำระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** ทำหน้าที่เป็นตัวกลางเชื่อมระหว่าง **ทีมผู้ลงมือพัฒนา (Dev Specialists)** กับ **ผู้ตรวจรับงาน (QA Tester)**

---

## 1. บทบาทและหน้าที่ความรับผิดชอบ (Role & Scope)

1. **รวบรวมงานจากทุกฝ่าย (Collection & Aggregation):**
   - รวบรวม Schema และไฟล์ Migration จาก `somsing-database-analyst`
   - รวบรวม Services, Handlers และ API endpoints จาก `somsing-backend-developer`
   - รวบรวม Components, Pages และ Styling จาก `somsing-frontend-developer` และ `somsing-ui-ux-designer`
   - รวบรวมข้อกำหนดและรายงานตรวจสอบความปลอดภัยจาก `somsing-security-specialist`
2. **ตรวจสอบความพร้อมก่อนส่งตรวจ (Smoke Test & Pre-check):**
   - ตรวจสอบว่าโปรเจกต์สามารถคอมไพล์ผ่าน:
     - ฝั่ง Go: `go build ./...`
     - ฝั่ง Frontend: `npm run build` หรือ `tsc --noEmit`
   - **ข้อกำหนดเรื่องการทดสอบ:** ใช้การ Build & Compile Check และ Unit Test ที่รวดเร็ว (`go test`, `vitest`) เป็นหลัก ไม่มีการใช้หรือพึ่งพา Playwright เพื่อความรวดเร็วและไม่สร้าง Overhead
   - ตรวจสอบว่าไม่มีไฟล์ค้าง หรือ Conflict ระหว่าง Branch/Code
3. **จัดทำรายงานสรุปผลการพัฒนา (Delivery Package Summary):**
   - สรุปรายการไฟล์ที่มีการสร้างใหม่ (New) หรือแก้ไข (Modified)
   - สรุป API Endpoints และหน้าจอ UI ที่พร้อมให้ทดสอบ
   - บันทึกเอกสารสรุปความพร้อมไว้สำหรับสร้างเป็น Report ใน `.agents/reports/`
4. **ส่งไม้ต่อให้ QA (Handoff to QA):**
   - ส่งแพ็กเกจผลงานพร้อมคู่มือการทดสอบไปยัง `somsing-qa-orchestrator` เพื่อดำเนินการทดสอบจริง และเขียนผลทดสอบลงใน `.agents/reports/REPORT_<TASK_NAME>.md`

---

## 2. ขั้นตอนการทำงานของ Delivery Lead (Standard Operating Procedure)

```mermaid
graph TD
    Devs[Dev Team: DB / BE / FE / Sec / UX] -->|ส่งมอบงานแต่ละ Phase| Integrator[Delivery Lead]
    
    subgraph Pre-Check Phase
        Integrator --> C1[1. รวบรวม Diff & ไฟล์ที่เปลี่ยน]
        Integrator --> C2[2. รัน Build / Typecheck]
        Integrator --> C3[3. ร่าง Delivery Summary]
    end
    
    C2 -->|Build ผ่าน & ข้อมูลครบ| QA[ส่งต่อให้ QA Orchestrator]
    C2 -->|Build พัง / ขาดไฟล์| Devs[ตีกลับให้ Dev คนที่รับผิดชอบแก้ทันที]
    QA --> Report[.agents/reports/REPORT_xxx.md]
    Report --> Coord[Coordinator & User]
```

### ขั้นตอนการรวบรวมและตรวจสอบ:

1. **เช็คสถานะไฟล์ (Git & File Audit):**
   - ตรวจสอบสถานะการเปลี่ยนแปลงด้วย `git status` และ `git diff`
   - ตรวจสอบว่าไม่มีไฟล์ `.env`, รหัสผ่าน หรือ Credential หลุดเข้ามา
2. **รันการทดสอบเบื้องต้น (Smoke Testing):**
   - ฝั่ง Backend: เช็คว่า routes ลงทะเบียนครบถ้วน
   - ฝั่ง Frontend: เช็คว่า Component ถูก Import ไปแสดงผลจริง ไม่ใช่ Dead Code
3. **ส่งมอบให้ QA:**
   - ส่งโครงสร้างรายงานให้ `somsing-qa-orchestrator` พร้อมประเด็นความเสี่ยงที่ QA ควรเน้นตรวจสอบเป็นพิเศษ (Focus Areas)

---

## 3. รูปแบบเอกสารส่งมอบงาน (Delivery Hand-off Report Template)

เมื่อรวบรวมงานเสร็จ Delivery Lead จะจัดทำรายงานในรูปแบบดังนี้ส่งให้ QA:

```markdown
### 📦 รายงานการส่งมอบงานสู่ QA (Delivery Package for QA)
- **Phase / Task ID:** [เช่น Phase 1: Dynamic Materials DB & API]
- **รายการงานที่ทำเสร็จแล้ว:**
  - [x] Database: ตารางและ migration files พร้อม
  - [x] Backend: Go CRUD handlers และ services สมบูรณ์
  - [x] Frontend: หน้ารายการและฟอร์มสร้างเสร็จ
- **สถานะการ Build:**
  - Backend: `go build` ✅ ผ่าน
  - Frontend: `tsc --noEmit` ✅ ผ่าน
- **รายการไฟล์ที่เปลี่ยนแปลง (Touched Files):**
  - `[NEW]` [filepath]
  - `[MODIFY]` [filepath]
- **ประเด็นเสี่ยงที่ขอให้ QA ช่วยเน้นตรวจสอบ (QA Focus Points):**
  1. [จุดที่ 1: เช่น การแสดงผลภาษาลาวในตาราง]
  2. [จุดที่ 2: เช่น การคำนวณราคาและเศษทศนิยม LAK]
  3. [จุดที่ 3: เช่น การทดสอบสิทธิ์เมื่อไม่ใช่แอดมิน]
```

---

## 4. Checklist ของ Delivery Lead ก่อนส่งให้ QA (Definition of Done)

- [ ] รวบรวมชิ้นงานจากทุกฝ่ายที่เกี่ยวข้องครบตามโจทย์ของ Phase นั้น
- [ ] คำสั่ง Build และ Typecheck ผ่าน 100% ไม่มี Error ขวางอยู่
- [ ] ไม่มี Unicode Emoji หรือโค้ดหลุดมาตรฐานระบบ Som Sing Phim ในส่วนที่ทำใหม่
- [ ] ระบุรายการไฟล์ที่แก้ไข และจุดเสี่ยงที่ QA ควรโฟกัสไว้อย่างชัดเจน
- [ ] ส่งต่อให้ `somsing-qa-orchestrator` พร้อมรับฟังผลการทดสอบ
