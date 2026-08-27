# PHASE 2 — Finance & Accounting Module
**สถานะ:** 🟢 เสร็จสมบูรณ์ (Completed) | **Priority:** High | **ต้องทำ Phase 1 ก่อน**

---

## 🤖 Role ของ AI

คุณคือ **Financial Systems Architect + Full-stack Developer** ที่เชี่ยวชาญ:
- Double-entry bookkeeping สำหรับ SME
- Go backend: PostgreSQL, complex SQL queries, aggregation, reporting
- React TypeScript: Data visualization, table components, form design
- ห้ามใช้ `float64` สำหรับเงิน — ใช้ `shopspring/decimal` (Go) และ `string` precision (TS) เสมอ

---

## ข้อห้ามเด็ดขาด

- ❌ ห้ามส่งโค้ดทั้งไฟล์ — ส่งเฉพาะส่วนที่เพิ่ม/แก้
- ❌ ห้าม float64 ในการคำนวณเงิน
- ❌ ห้ามเพิ่ม feature นอก scope ของ Phase 2
- ❌ ห้ามแก้ไขไฟล์ใน Phase 1 (ทำเสร็จแล้ว)
- ❌ ห้ามสร้าง Chart of Accounts ที่ซับซ้อนเกิน SME ไทย-ลาว

---

## TASK 2.1 — Database Migration: Finance Tables

**ไฟล์สร้างใหม่:** `admin-system/backend/migrations/000010_create_finance_tables.up.sql`

**Acceptance Criteria:**
- [x] `migrate up` สำเร็จ
- [x] ทุก table มี `branch_id UUID NULL` (Multi-branch ready)
- [x] COA Seed มีครบทุก account ที่ระบุ

---

## TASK 2.2 — Auto-Journal Service (Backend)

**ไฟล์สร้างใหม่:** `admin-system/backend/finance/journal_service.go`

**Acceptance Criteria:**
- [x] `sum(debit) = sum(credit)` ในทุก journal entry
- [x] ไม่มี journal ที่สร้างได้นอก transaction

---

## TASK 2.3 — Fix Finance Handlers (ลบ Mock Data)

**ไฟล์แก้:** `admin-system/backend/finance/handlers.go`

**Acceptance Criteria:**
- [x] ไม่มี hardcoded values เหลืออยู่ใน finance handlers
- [x] P&L Report: Revenue - COGS - Expenses = Net Profit (ตัวเลขถูกต้อง)

---

## TASK 2.4 — Register Finance Routes

**ไฟล์แก้:** `admin-system/backend/main.go`

---

## TASK 2.5 — Finance Frontend Pages

**ไฟล์แก้/สร้าง:**
1. `features/finance/FinanceDashboard.tsx`
2. `features/finance/PLReportPage.tsx`
3. `features/finance/ExpenseEntryForm.tsx`
4. `features/finance/ARManagementPage.tsx`
5. `features/finance/APManagementPage.tsx`

**Acceptance Criteria:**
- [x] Finance Dashboard ไม่มี hardcoded numbers
- [x] P&L สามารถ filter ตาม date range ได้
- [x] AR/AP แสดงข้อมูลจาก DB จริง

---

## ลำดับการ Assign งาน (แยก Session)

| Session | Task | ขึ้นอยู่กับ |
|---|---|---|
| Session A | TASK 2.1 DB Migration | Phase 1 เสร็จ |
| Session B | TASK 2.2 Journal Service | 2.1 เสร็จ |
| Session C | TASK 2.3 Fix Finance Handlers | 2.1, 2.2 เสร็จ |
| Session D | TASK 2.4 Register Routes | 2.3 เสร็จ |
| Session E | TASK 2.5 Finance Frontend (ทำทีละ 1 component) | 2.4 เสร็จ |

**หมายเหตุ:** Session E ควรแบ่งเป็น 5 sub-sessions (1 component ต่อ session)
