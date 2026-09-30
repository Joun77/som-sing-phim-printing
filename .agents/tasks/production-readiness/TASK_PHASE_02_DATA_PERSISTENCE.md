# Phase 2 — ข้อมูลจริงและ persistence

Status: planned | Developer: Antigravity | Independent reviewer: Codex

**Outcome:** UI แสดงข้อมูล authoritative และ success เฉพาะเมื่อเซิร์ฟเวอร์บันทึกแล้ว

อ่าน README.md ในโฟลเดอร์นี้ก่อน แล้วอ่านเฉพาะงานย่อยที่ได้รับมอบหมาย; ยังไม่เริ่มงานย่อยถัดไป สถานะเริ่มต้น planned ทุกงาน

## ลำดับงานและโมเดล

| งาน | โมเดลหลัก | โมเดลสำรอง | Primary skill | Status |
|---|---|---|---|---|
| P2.1 แก้ Material Guide/FAQ contract และ search crash | Claude Sonnet 4.6 (Thinking) | Gemini 3.1 Pro High | frontend-developer | planned |
| P2.2 CRUD await server และ employee/account consistency | Claude Sonnet 4.6 (Thinking) | Gemini 3.1 Pro High | frontend-developer | planned |
| P2.3 Remove mock actual data และ stock overwrite | Gemini 3.1 Pro High | Claude Sonnet 4.6 (Thinking) | frontend-developer | planned |

## P2.1 — แก้ Material Guide/FAQ contract และ search crash

**Prerequisite:** Phase1 verified

**โมเดล:** Claude Sonnet 4.6 (Thinking); สำรอง Gemini 3.1 Pro High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [frontend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/frontend-developer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/src/features/materials/api/materialsApi.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/api/materialsApi.ts) | guide/FAQ/category endpoints และ DTO |
| [admin-system/frontend/src/features/materials/types.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/types.ts) | ProductMaterial/ProductFAQ schema |
| [admin-system/frontend/src/features/materials/components/MaterialManagement.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/components/MaterialManagement.tsx) | nameLo search และ filtered reorder |
| [admin-system/frontend/src/features/materials/components/FaqManagement.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/components/FaqManagement.tsx) | CRUD/error states |
| [admin-system/frontend/src/features/materials/components/MaterialFormModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/components/MaterialFormModal.tsx) | input DTO |
| [admin-system/frontend/src/features/materials/components/CategoryManagerModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/components/CategoryManagerModal.tsx) | category contract |
| [admin-system/backend/internal/handler/inventory_handler.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/internal/handler/inventory_handler.go) | /materialsเป็นstock master; อย่าเปลี่ยนให้Guideจนstockเสีย |
| [admin-system/backend/main.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/main.go) | register guide routes |
| [migrations/025_create_product_materials.up.sql](/Users/joun/Documents/GitHub/som-sing-phim-printing/migrations/025_create_product_materials.up.sql) | existing guide schema |
| [migrations/026_create_material_categories.up.sql](/Users/joun/Documents/GitHub/som-sing-phim-printing/migrations/026_create_material_categories.up.sql) | existing category schema |

### งานที่ต้องทำ

ใช้existing product-material/category schemaถ้ารองรับ ไม่สร้างduplicate table; แยกguide routeจากstock; ตรวจว่าschemaถูกmigrateจริงก่อนCRUD; ปิดcontract mismatchทุกfield; searchnull-safe, reorderstable IDภายใต้filter, FAQ/categoryloaderrorชัด; เพิ่มroutesที่ไม่มีและenforceauth

### Acceptance checks

- [ ] guideชื่อ/GSM/finishแสดงจริง; ค้นหาpaperไม่crash; FAQ/categoriesไม่มี404
- [ ] create/edit/deactivate/reorder→reloadถูก; filtered reorderไม่แก้รายการอื่น
- [ ] inventory endpointsยังคืนstock DTOเดิมและยอดไม่เปลี่ยนเพราะGuide

**Deferred / constraints:** ดีไซน์commonmodal=P4

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Sonnet 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P2.1 ใน .agents/tasks/production-readiness/TASK_PHASE_02_DATA_PERSISTENCE.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/frontend-developer/SKILL.md; อ่าน .agents/skills/backend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: แก้ Material Guide/FAQ contract และ search crash
เริ่มจาก target files/entry points ของ P2.1; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P2.1
หยุดที่ ready_for_review เพื่อให้ Codex ตรวจ ห้ามเริ่มงานถัดไป/mark verified/commit/push/deploy หรือแตะข้อมูลธุรกิจจริง
```

### Delivery — Antigravity เป็นผู้เติม

- Status: planned
- Baseline / delivered revision or diff snapshot:
- Changed files and reason:
- Acceptance → command / result / evidence:
- Checks not run / known gaps:
- Migration / data impact / rollback:

### Independent review — Codex เป็นผู้เติม

- Status: not reviewed
- Snapshot checked:
- Passed / required corrections / not verified:
- Release next task: no

## P2.2 — CRUD await server และ employee/account consistency

**Prerequisite:** P2.1 verified

**โมเดล:** Claude Sonnet 4.6 (Thinking); สำรอง Gemini 3.1 Pro High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [frontend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/frontend-developer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/src/store/AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx) | addOrder/updateOrderDetails/deleteOrder, quotation, customer, earning mutations |
| [admin-system/frontend/src/api/client.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/api/client.ts) | Response vs parsed JSON และHTTP error semantics |
| [admin-system/frontend/src/features/hr/components/EmployeeManagement.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/hr/components/EmployeeManagement.tsx) | handleSave, employee ID, account sync |
| [admin-system/frontend/src/features/hr/components/StaffUserManagementTab.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/hr/components/StaffUserManagementTab.tsx) | RBAC/save |
| [admin-system/backend/hr/employees.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/hr/employees.go) | employee CRUD |
| [admin-system/backend/auth/users.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/auth/users.go) | users update route/permissions |
| [admin-system/backend/orders/quotations.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/quotations.go) | save/conversion persistence |
| [admin-system/backend/customers/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/customers/handlers.go) | customer error contract |

### งานที่ต้องทำ

แบ่งภายในงานเป็นorders→quotations/CRM→HRทีละslice; awaitvalidatedserverresponseก่อนtoast/cache; rollbackหรือรักษาdraftเมื่อfail; ตรวจcallerที่คาดreturnvoidเมื่อเปลี่ยนasync; ไม่ส่งupdateemployeeaccountด้วยPOSTซ้ำหรือby-usernamerouteที่ไม่มี; stable IDs; defineapiFetchcontractเดียว; transactionหรือrecoverablecompensationเมื่อemployee/accountข้ามresources; ห้ามใหญ่รีแฟกเตอร์AppContextทั้งไฟล์

### Acceptance checks

- [ ] แต่ละCRUD save→reload→secondsessionตรงกัน; 400/401/409/500/networkerrorไม่toastsuccessและไม่ทิ้งข้อมูลผิด
- [ ] doubleclickไม่createซ้ำ; editไม่createaccountใหม่; permissionsตรงUIและbackend
- [ ] testsเรียกproductionhelperจริง ไม่คัดลอกimplementationมาในtest

**Deferred / constraints:** business transitions/cost/stock=P3; pendingUXรวม=P4

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Sonnet 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P2.2 ใน .agents/tasks/production-readiness/TASK_PHASE_02_DATA_PERSISTENCE.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/frontend-developer/SKILL.md; อ่าน .agents/skills/backend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: CRUD await server และ employee/account consistency
เริ่มจาก target files/entry points ของ P2.2; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P2.2
หยุดที่ ready_for_review เพื่อให้ Codex ตรวจ ห้ามเริ่มงานถัดไป/mark verified/commit/push/deploy หรือแตะข้อมูลธุรกิจจริง
```

### Delivery — Antigravity เป็นผู้เติม

- Status: planned
- Baseline / delivered revision or diff snapshot:
- Changed files and reason:
- Acceptance → command / result / evidence:
- Checks not run / known gaps:
- Migration / data impact / rollback:

### Independent review — Codex เป็นผู้เติม

- Status: not reviewed
- Snapshot checked:
- Passed / required corrections / not verified:
- Release next task: no

## P2.3 — Remove mock actual data และ stock overwrite

**Prerequisite:** P2.2 verified

**โมเดล:** Gemini 3.1 Pro High; สำรอง Claude Sonnet 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [frontend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/frontend-developer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [somsing-system-analyzer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-system-analyzer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/src/store/AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx) | earningRecords initializer, syncdata.length>0, inboundMaterials, combinedInventory |
| [admin-system/frontend/src/features/finance/JobProfitabilityAudit.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/finance/JobProfitabilityAudit.tsx) | hardcodeddefaultcost/revenue/order |
| [admin-system/frontend/src/features/finance/FinanceDashboard.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/finance/FinanceDashboard.tsx) | renderJobProfitabilityAuditwithoutAPIprops |
| [admin-system/frontend/src/features/inventory/api/inventoryApi.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inventory/api/inventoryApi.ts) | masterstocksource/invalidation |
| [admin-system/frontend/src/features/inventory/components/InboundHistoryTable.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inventory/components/InboundHistoryTable.tsx) | historysource |
| [admin-system/backend/inventory/assets.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/inventory/assets.go) | HandleGetInventoryItems reads materials |
| [admin-system/backend/finance/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/handlers.go) | job-profitabilityDTO |
| [admin-system/backend/hr/employees.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/hr/employees.go) | earningsDTO |

### งานที่ต้องทำ

productionemptyinitและclearstale/mockcacheเมื่อauthoritativeempty; serverstockไม่ถูกreceiptquantityoverride; income/costreportอ่านAPIจริง; loader/error/emptydistinct; versionedcachemigrationเฉพาะknownmock ไม่ลบbusinessrecords; tracelegacyinboundกับinventoryhistoryแล้วใช้historysourceชัดเจน ไม่รวมรายการซ้ำ; estimateแยกactual

### Acceptance checks

- [ ] DBearnings0→UI0; jobprofitabilityไม่มี14.5ล้านhardcoded; reloadไม่ฟื้นmock
- [ ] receiveหลายครั้งแล้วdischarge→stockเท่ากับDBทุกหน้า; receiptlatestไม่overwritebalance
- [ ] APIerrorไม่แสดงmockเป็นactual; historyอ้างmovementต้นทางตรวจย้อนกลับได้

**Deferred / constraints:** แก้costledger/dashboardformula=P3.3

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.1 Pro High** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P2.3 ใน .agents/tasks/production-readiness/TASK_PHASE_02_DATA_PERSISTENCE.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/frontend-developer/SKILL.md; อ่าน .agents/skills/somsing-system-analyzer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Remove mock actual data และ stock overwrite
เริ่มจาก target files/entry points ของ P2.3; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P2.3
หยุดที่ ready_for_review เพื่อให้ Codex ตรวจ ห้ามเริ่มงานถัดไป/mark verified/commit/push/deploy หรือแตะข้อมูลธุรกิจจริง
```

### Delivery — Antigravity เป็นผู้เติม

- Status: planned
- Baseline / delivered revision or diff snapshot:
- Changed files and reason:
- Acceptance → command / result / evidence:
- Checks not run / known gaps:
- Migration / data impact / rollback:

### Independent review — Codex เป็นผู้เติม

- Status: not reviewed
- Snapshot checked:
- Passed / required corrections / not verified:
- Release next task: no

