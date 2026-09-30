# Phase 5 — Integration acceptance และ go-live readiness

Status: planned | Developer: Antigravity | Independent reviewer: Codex

**Outcome:** มีหลักฐานทั้ง17โมดูล พร้อมการกู้คืนและrollbackก่อนเปิดใช้จริง

อ่าน README.md ในโฟลเดอร์นี้ก่อน แล้วอ่านเฉพาะงานย่อยที่ได้รับมอบหมาย; ยังไม่เริ่มงานย่อยถัดไป สถานะเริ่มต้น planned ทุกงาน

## ลำดับงานและโมเดล

| งาน | โมเดลหลัก | โมเดลสำรอง | Primary skill | Status |
|---|---|---|---|---|
| P5.1 Signed-role E2E และ17-module acceptance | Gemini 3.1 Pro High | Claude Opus 4.6 (Thinking) | somsing-qa-orchestrator | planned |
| P5.2 Migration/backup/restore/staging/rollback/monitoring | Gemini 3.1 Pro High | Claude Opus 4.6 (Thinking) | somsing-delivery-lead | planned |
| P5.3 สรุป evidence packet และ release decision | Gemini 3.8 Flash Medium | Claude Sonnet 4.6 (Thinking) | somsing-delivery-lead | planned |

## P5.1 — Signed-role E2E และ17-module acceptance

**Prerequisite:** Phase4 verified

**โมเดล:** Gemini 3.1 Pro High; สำรอง Claude Opus 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-qa-orchestrator](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-qa-orchestrator/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [somsing-system-analyzer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-system-analyzer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/package.json](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/package.json) | actualtest/typecheck/build/lintcommands |
| [admin-system/backend/production/daily_plan_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/production/daily_plan_test.go) | readiness/permissions/offline |
| [admin-system/backend/internal/service/inventory_flow_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/internal/service/inventory_flow_test.go) | inventoryintegration |
| [admin-system/backend/orders/handlers_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/handlers_test.go) | orderstate |
| [admin-system/backend/finance/journal_service_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/journal_service_test.go) | ledger |
| [admin-system/backend/finance/slip_verifier_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/slip_verifier_test.go) | providermockedverification |
| [admin-system/backend/inbound/inbound_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/inbound/inbound_test.go) | inboundrevision |
| [admin-system/backend/suppliers/suppliers_test.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/suppliers/suppliers_test.go) | receiptcoverageเพิ่มที่productionservice |
| [admin-system/frontend/src/utils/costCalculator.test.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/utils/costCalculator.test.ts) | formula |
| [admin-system/frontend/src/utils/wearPartsCrudFailure.test.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/utils/wearPartsCrudFailure.test.ts) | actualproductionhelpertarget |

### งานที่ต้องทำ

ใช้isolatedharnessP1.3 signedJWTจริงroleowner/manager/finance/production/staffตามmatrix; testUI→API→DB→reload→secondsession; coversnegative/retry/concurrency; testsimportactualhelpers; browserตามuserauthorizationและexistingtoolingไม่installPlaywrightdefault; repositorynpmtestปัจจุบันtsxnodeไม่ใช่Vitest ให้บันทึกความต่างกับruleและใช้existingbaselineโดยไม่อ้างVitestpass; เพิ่มtestsเฉพาะต้องพิสูจน์behavior; ไม่skipDBchecksแล้วcertify

### Acceptance checks

- [ ] 17modulesและCRUD/writebuttonsทุกตัวมีtestcase+evidenceหรือexplicitgap; relevantCRUD/error/actionsผ่าน
- [ ] sale/production/purchaseflowsและconcurrentduplicatesผ่าน; signedroleauthnegativeผ่าน
- [ ] npmtest/typecheck/build/lintและgotest/buildผ่านหรือfailuresแยกชัด; noP0/P1security/money/stock/persistenceค้าง

**Deferred / constraints:** deploymentstaging/restore=P5.2; greenbuildไม่เท่ากับproductionapproved

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.1 Pro High** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P5.1 ใน .agents/tasks/production-readiness/TASK_PHASE_05_RELEASE_GATE.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-qa-orchestrator/SKILL.md; อ่าน .agents/skills/somsing-system-analyzer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Signed-role E2E และ17-module acceptance
เริ่มจาก target files/entry points ของ P5.1; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P5.1
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

## P5.2 — Migration/backup/restore/staging/rollback/monitoring

**Prerequisite:** P5.1 verified

**โมเดล:** Gemini 3.1 Pro High; สำรอง Claude Opus 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-delivery-lead](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-delivery-lead/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [db-analyst](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/db-analyst/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/backend/db/db.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/db/db.go) | RunMigrations searchpaths/tracking |
| [admin-system/backend/migrations/042_link_printer_inks_and_clean_material_assets.sql](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/migrations/042_link_printer_inks_and_clean_material_assets.sql) | canonicalcopy/idempotency |
| [admin-system/migrations/042_link_printer_inks_and_clean_material_assets.sql](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/migrations/042_link_printer_inks_and_clean_material_assets.sql) | Docker-mountedcopy mustmatch |
| [docker-compose.yml](/Users/joun/Documents/GitHub/som-sing-phim-printing/docker-compose.yml) | productionenv/volumes/health |
| [docker-compose.dev.yml](/Users/joun/Documents/GitHub/som-sing-phim-printing/docker-compose.dev.yml) | referenceonly; notstagingisolation |
| [.env.example](/Users/joun/Documents/GitHub/som-sing-phim-printing/.env.example) | requiredsecrets/settings |
| [deploy.sh](/Users/joun/Documents/GitHub/som-sing-phim-printing/deploy.sh) | existingdeployflow reviewonly |
| [deploy.command](/Users/joun/Documents/GitHub/som-sing-phim-printing/deploy.command) | existingdeployflow reviewonly |
| [admin-system/backend/main.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/main.go) | readiness/migrationstartup |
| [admin-system/backend/middleware/logger.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/middleware/logger.go) | redactedoperationalerrors |

### งานที่ต้องทำ

ระบุมigrationcanonicalsourceและcopy/hashถ้าต้องคงหลายชุด; rerunบนclone+emptytestDBไม่destructivedata; backuprestoreincluploadsซ้อมในtest; stagingแยกsecrets/DB/provider; healthreadinessfailwhenDB/migrationsunready; errors/metricsalertsnoPII; load/concurrencyผูกexpectedshopcapacityไม่inventSLO; rollbackrestoreprocedureและtimeobserved; เตรียมdeploymentpackageไม่deployproductionเอง

### Acceptance checks

- [ ] migrationfresh/existingclone/rerunถูก; noresetproduction; restoreแล้วorder/stock/ledger/files/permissionsครบ
- [ ] stagingUATเจ้าของร้านทำสองflowsผ่าน; monitorมองเห็น401/5xx/provider/DBfailureโดยไม่logsecret
- [ ] rollbackซ้อมสำเร็จ; capacity/RPO/RTOมีowner-agreedtargetsและobservedresults; missingtargetยังnotverified

**Deferred / constraints:** productiondeployต้องคำสั่งผู้ใช้แยก; ไม่push/commit/cloudwriteอัตโนมัติ

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.1 Pro High** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P5.2 ใน .agents/tasks/production-readiness/TASK_PHASE_05_RELEASE_GATE.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-delivery-lead/SKILL.md; อ่าน .agents/skills/db-analyst/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Migration/backup/restore/staging/rollback/monitoring
เริ่มจาก target files/entry points ของ P5.2; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P5.2
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

## P5.3 — สรุป evidence packet และ release decision

**Prerequisite:** P5.2 ready_for_review และCodexตรวจrequiredchecksแล้ว

**โมเดล:** Gemini 3.8 Flash Medium; สำรอง Claude Sonnet 4.6 (Thinking) เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-delivery-lead](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-delivery-lead/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [.agents/tasks/production-readiness/TASK_PHASE_05_RELEASE_GATE.md](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/tasks/production-readiness/TASK_PHASE_05_RELEASE_GATE.md) | delivery/reviewnotes |
| [.agents/tasks/production-readiness/README.md](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/tasks/production-readiness/README.md) | masterledger |
| [.agents/rules/task-qa-verifier.md](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/rules/task-qa-verifier.md) | verificationgate |

### งานที่ต้องทำ

รวบรวมexistingevidenceไม่มีแก้productioncode; manifestrevision/commands/testmatrix/migrations/knownrisks/rollback; redactPII/secrets; Flashรวบรวมข้อมูลไม่ตัดสินverifiedแทนCodex; หากevidenceขาดส่งgapชัดไม่invent

### Acceptance checks

- [ ] ทุกacceptanceมีlinkevidenceและsnapshotตรงกัน; missingchecksระบุnotverified
- [ ] Antigravitystatusสูงสุดready_for_review; Codexเท่านั้นverified/archive; ownerทำgo-livedecision
- [ ] รายงานshortcopyableพร้อมchangedfiles/tests/notrun/dataimpact

**Deferred / constraints:** ห้ามปิดissueหรือdeployเพราะรายงานเขียว

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Gemini 3.8 Flash Medium** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P5.3 ใน .agents/tasks/production-readiness/TASK_PHASE_05_RELEASE_GATE.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-delivery-lead/SKILL.md
เป้าหมาย: สรุป evidence packet และ release decision
เริ่มจาก target files/entry points ของ P5.3; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P5.3
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

## Coverage matrix — เติมหลักฐานแต่ละปุ่ม/flow ไม่ใช่แค่เปิดหน้าได้

| โมดูล | Action / path ที่ต้องครอบคลุม | Evidence / result |
|---|---|---|
| Dashboard | status counts, actual/estimate, filters, business dates, low stock | not verified |
| Preflight | single/split/batch, valid/corrupt files, preview, ส่ง quotation | not verified |
| Quotation | specs/price/save/edit/approve/reject/convert/reload/retry | not verified |
| Orders | create/detail/edit/cancel, proof/deposit, steps, export/download, delivery | not verified |
| CRM | create/edit/linked delete guard, filters/totals/history/receipt | not verified |
| Catalog | create/edit/deactivate, category/SKU/price binding, upload/preview | not verified |
| Material Guide/FAQ | CRUD/category/search/filtered reorder/empty/error | not verified |
| Daily Plan | assign/conflict/force/date/filter/start/pause/resume/complete/delete permission | not verified |
| Shop Floor | staff task visibility/progress and sync to order/daily plan | not verified |
| Equipment | add/edit, details/wear parts/maintenance/downtime, master references | not verified |
| Inventory/Offcuts | stock view/discharge/register/use/cancel, units/history/invalidation | not verified |
| Inbound | single/batch intake/revise/cancel/history, master stock/asset changes | not verified |
| Suppliers/PO | supplier CRUD/price comparison, draft/send/partial/full receipt/retry | not verified |
| Finance | summary/P&L/job, slip verify, AR/AP payment, expense/tax docs/currency | not verified |
| HR | employee/account/permissions CRUD, earnings actual/empty, sync failures | not verified |
| Lookups | create/edit/unique/deactivate-with-references, reload | not verified |
| Settings | shop/courier/bank save/error, notification stub/config, no live send | not verified |

เพิ่มแถวระดับปุ่มย่อยเมื่อพบจาก UI/source; ระบุ expected/actual, signed role, fixture, request ID และ evidence โดยไม่ใส่ secret/PII

