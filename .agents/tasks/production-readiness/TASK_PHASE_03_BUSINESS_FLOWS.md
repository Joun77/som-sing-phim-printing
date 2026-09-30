# Phase 3 — ธุรกรรมขาย ผลิต จัดซื้อ และบัญชีครบวงจร

Status: planned | Developer: Antigravity | Independent reviewer: Codex

**Outcome:** สอง business flows ทำงานแบบ atomic/idempotent และรายงานตรงรายการต้นทาง

อ่าน README.md ในโฟลเดอร์นี้ก่อน แล้วอ่านเฉพาะงานย่อยที่ได้รับมอบหมาย; ยังไม่เริ่มงานย่อยถัดไป สถานะเริ่มต้น planned ทุกงาน

## ลำดับงานและโมเดล

| งาน | โมเดลหลัก | โมเดลสำรอง | Primary skill | Status |
|---|---|---|---|---|
| P3.1 PO receipt→stock→cost→AP แบบatomic | Gemini 3.1 Pro High | Claude Opus 4.6 (Thinking) | backend-developer | planned |
| P3.2 Quotation→payment/proof→production→delivery→earnings | Claude Opus 4.6 (Thinking) | Gemini 3.1 Pro High | somsing-system-analyzer | planned |
| P3.3 Preflight→pricing และ actual reporting reconciliation | Gemini 3.1 Pro High | Claude Opus 4.6 (Thinking) | somsing-formula-analyst | planned |

## P3.1 — PO receipt→stock→cost→AP แบบatomic

**Prerequisite:** Phase2 verified

**โมเดล:** Gemini 3.1 Pro High; สำรอง Claude Opus 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [db-analyst](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/db-analyst/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/backend/suppliers/po_service.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/suppliers/po_service.go) | ReceiveGoods, GeneratePONumber |
| [admin-system/backend/suppliers/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/suppliers/handlers.go) | HandleReceiveGoods/POcreate |
| [admin-system/backend/suppliers/models.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/suppliers/models.go) | receiptpayload |
| [admin-system/backend/internal/service/inventory_service.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/internal/service/inventory_service.go) | existinginbound/costtransaction |
| [admin-system/backend/internal/repository/inbound_repository.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/internal/repository/inbound_repository.go) | movementpersist |
| [admin-system/backend/internal/repository/material_repository.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/internal/repository/material_repository.go) | masterstock |
| [admin-system/backend/finance/journal_service.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/journal_service.go) | CreateInboundAPJournal |
| [admin-system/backend/inbound/inbound.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/inbound/inbound.go) | legacyflow/revision/cancel |
| [admin-system/frontend/src/features/suppliers/GoodsReceiptModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/suppliers/GoodsReceiptModal.tsx) | receiptmutation/invalidation |
| [admin-system/frontend/src/features/suppliers/POListPage.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/suppliers/POListPage.tsx) | draftbanner |
| [admin-system/backend/migrations/000013_create_supplier_po_tables.up.sql](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/migrations/000013_create_supplier_po_tables.up.sql) | receipt/APschema |

### งานที่ต้องทำ

reuseinventoryserviceด้วยsharedtxหรือexplicitadapter; receipt+stock+unitconversion+cost+AP/journalในtransactionเดียว; positiveqty<=remaining, concurrencysafe, retryidempotent, POnumberไม่COUNT+1race; productionnilDBfail; receiptcancel policyบันทึกและไม่คืนของที่ใช้แล้วอย่างเงียบ; lowstockdraftbannerตรงpersiststate

### Acceptance checks

- [ ] รับบางส่วน/ครบ→quantity,status,stock,movement,AP,journalตรงกัน
- [ ] รับเกิน/negative/missingmaterial/retry/concurrentrequestไม่เพิ่มยอดซ้ำ
- [ ] injectfailureท้ายflow→rollbackทุกtable; commit→reloadทุกหน้าตรง; unitsใช้explicitmultiplier

**Deferred / constraints:** AR/APpaymentsและsaleslifecycle=P3.2; สูตรreport=P3.3

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.1 Pro High** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P3.1 ใน .agents/tasks/production-readiness/TASK_PHASE_03_BUSINESS_FLOWS.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/backend-developer/SKILL.md; อ่าน .agents/skills/db-analyst/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: PO receipt→stock→cost→AP แบบatomic
เริ่มจาก target files/entry points ของ P3.1; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P3.1
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

## P3.2 — Quotation→payment/proof→production→delivery→earnings

**Prerequisite:** P3.1 verified

**โมเดล:** Claude Opus 4.6 (Thinking); สำรอง Gemini 3.1 Pro High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-system-analyzer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-system-analyzer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/backend/orders/quotations.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/quotations.go) | convert/approvalidempotency |
| [admin-system/backend/orders/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/handlers.go) | EnsureOrderInProductionTx, itemstep, deposit |
| [admin-system/backend/orders/proof_review.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/proof_review.go) | proofapproval |
| [admin-system/backend/orders/workflow_templates.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/workflow_templates.go) | canonicalstages |
| [admin-system/backend/orders/deliveries.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/deliveries.go) | deliverycompletion |
| [admin-system/backend/production/service.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/production/service.go) | CreateAssignment, UpdateAssignmentProgress |
| [admin-system/backend/production/models.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/production/models.go) | status/payload |
| [admin-system/backend/inventory/deduction.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/inventory/deduction.go) | stockdeductiononce |
| [admin-system/backend/hr/employees.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/hr/employees.go) | realearnings |
| [admin-system/backend/finance/journal_service.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/journal_service.go) | payment/COGSjournal |
| [admin-system/backend/finance/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/handlers.go) | AR/APpayment |
| [admin-system/frontend/src/features/orders/components/production/ProductionProcessFlowCard.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/orders/components/production/ProductionProcessFlowCard.tsx) | legacyworkflow |
| [admin-system/frontend/src/features/production/ShopFloorTracker.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/ShopFloorTracker.tsx) | tracker |
| [admin-system/frontend/src/features/production/DailyPlanView.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/DailyPlanView.tsx) | assignmentprogress |

### งานที่ต้องทำ

เขียนtransitionmatrixก่อนแก้แล้วใช้canonicalbusinessstateตามarchitectureguard; preservehistoricalmappingอย่างexplicit; stockdeductเฉพาะstartIN_PRODUCTIONครั้งเดียว; requiredeposit/proof; DailyPlan/current_step/legacyworkflowต้อง sync; cancellationไม่คืนstockหลังproductionอัตโนมัติ; completionearningsผูกactualemployee/job ไม่fallbackEMP001; delivery/AR/APduplicate-safe; forbiddenbackwardtransitionถูกblock; ตรวจerrorspoilagelogห้ามignore

### Acceptance checks

- [ ] quotationconvertซ้ำไม่createorderซ้ำ; deposit/proofไม่ครบ→startblocked
- [ ] start/retry/concurrentstartหักstockและลงCOGSครั้งเดียว; pause/resumeไม่หักอีก; stockไม่พอrollback
- [ ] DailyPlancomplete→Order/Trackerแสดงstageเดียวหลังreload; wrongstaffเปลี่ยนงานไม่ได้
- [ ] delivery,earnings,AR/APpaymenttraceต้นทาง; cancelก่อน/หลังstartตรงpolicy; ไม่มีorphannewreferences

**Deferred / constraints:** formdesign=P4; unknownbusinesspolicyบันทึกคำถามและดำเนินงานอิสระต่อ ไม่inventfinancialrule

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Opus 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P3.2 ใน .agents/tasks/production-readiness/TASK_PHASE_03_BUSINESS_FLOWS.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-system-analyzer/SKILL.md; อ่าน .agents/skills/backend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Quotation→payment/proof→production→delivery→earnings
เริ่มจาก target files/entry points ของ P3.2; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P3.2
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

## P3.3 — Preflight→pricing และ actual reporting reconciliation

**Prerequisite:** P3.2 verified

**โมเดล:** Gemini 3.1 Pro High; สำรอง Claude Opus 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-formula-analyst](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-formula-analyst/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [backend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/backend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/src/lib/preflightAnalyzer.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/lib/preflightAnalyzer.ts) | actualimage/PDFanalysis |
| [admin-system/frontend/src/components/PreflightChecker.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/components/PreflightChecker.tsx) | single/split/batchfallback |
| [admin-system/frontend/src/features/production/PreflightPage.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/PreflightPage.tsx) | specstransfer |
| [admin-system/backend/preflight/analyzer.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/preflight/analyzer.go) | simulatedfallback |
| [admin-system/backend/pricing/engine.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/pricing/engine.go) | money/BOM/coverage |
| [admin-system/frontend/src/features/pricing/components/QuotationManager.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/QuotationManager.tsx) | specs/quotepricing |
| [admin-system/frontend/src/store/AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx) | getDashboardStats/OEEcostfallback |
| [admin-system/frontend/src/features/dashboard/components/DashboardOverview.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/dashboard/components/DashboardOverview.tsx) | statuspipeline |
| [admin-system/frontend/src/features/dashboard/components/TopProductsTable.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/dashboard/components/TopProductsTable.tsx) | 40%estimatedcost |
| [admin-system/frontend/src/features/dashboard/components/ProfitChart.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/dashboard/components/ProfitChart.tsx) | estimatevsactual |
| [admin-system/frontend/src/features/customers/components/CustomerManagement.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/customers/components/CustomerManagement.tsx) | lifetime/subtotals |
| [admin-system/backend/finance/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/handlers.go) | P&L/job/summary |
| [admin-system/backend/pricing/engine_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/pricing/engine_test.go) | realformulatests |

### งานที่ต้องทำ

fixturesimage/PDFknownpages/size/coverage valid+corrupt; failedanalysisต้องunknown/errorไม่inventready300DPI; ส่งspecs/filepersistไปquotation; decimal/fixedpointเงินและsnapshotcost; actualreportsอ่านledger/costmovementเดียวกัน; estimateมีlabelไม่fabricate65/35/40%/90LAK; unknowncostไม่0; revenueขอบเขตเดียว/orderstatusnormalize; OEEมีmetricจริงหรือdisplayunavailable ไม่wearsimulation

### Acceptance checks

- [ ] knownfile→analysis→quote→save/reloadpagecount/dimensions/coverage/material/fileตรง; malformedไม่ready
- [ ] หนึ่งfixtureorder+receipt+expense+spoilage→cost/AR/AP/CRM/dashboard/P&Lreconcileตามdocumentedrecognition
- [ ] precision/discount/VAT/multicurrencyroundingมีexpectedvalues; nofinancialfloat64total; OEEไม่มีmock

**Deferred / constraints:** businessdate/UIstandard=P4; migration/go-live=P5

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.1 Pro High** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P3.3 ใน .agents/tasks/production-readiness/TASK_PHASE_03_BUSINESS_FLOWS.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-formula-analyst/SKILL.md; อ่าน .agents/skills/backend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Preflight→pricing และ actual reporting reconciliation
เริ่มจาก target files/entry points ของ P3.3; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P3.3
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

