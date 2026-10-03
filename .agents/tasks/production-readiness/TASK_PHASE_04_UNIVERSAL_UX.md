# Phase 4 — Universal Form และ workflow UI ที่ชัดเจน

Status: planned | Developer: Antigravity | Independent reviewer: Codex

**Outcome:** Daily Plan ใช้ฟอร์มร่วม วัน/ขั้นงาน/ข้อความตรงความจริงทุกหน้า

อ่าน README.md ในโฟลเดอร์นี้ก่อน แล้วอ่านเฉพาะงานย่อยที่ได้รับมอบหมาย; ยังไม่เริ่มงานย่อยถัดไป สถานะเริ่มต้น planned ทุกงาน

## ลำดับงานและโมเดล

| งาน | โมเดลหลัก | โมเดลสำรอง | Primary skill | Status |
|---|---|---|---|---|
| P4.1 Daily Plan Universal และ common modal accessibility | Claude Sonnet 4.6 (Thinking) | Gemini 3.1 Pro High | frontend-developer | planned |
| P4.2 มาตรฐาน feedback/buttons/forms ทั้ง17โมดูล | Claude Sonnet 4.6 (Thinking) | Gemini 3.8 Flash High | somsing-ui-ux-designer | planned |

## P4.1 — Daily Plan Universal และ common modal accessibility

**Prerequisite:** Phase3 verified; อนุญาตreorderเฉพาะบันทึกdependencyanalysisและไม่ชนAppContext

**โมเดล:** Claude Sonnet 4.6 (Thinking); สำรอง Gemini 3.1 Pro High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [frontend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/frontend-developer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [somsing-ui-ux-designer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-ui-ux-designer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/src/components/common/FormModalTemplate.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/components/common/FormModalTemplate.tsx) | portal/header/body/footerActions |
| [admin-system/frontend/src/features/production/components/AssignTaskModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/components/AssignTaskModal.tsx) | customfixedoverlay |
| [admin-system/frontend/src/features/production/DailyPlanView.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/DailyPlanView.tsx) | STAGE_LABELS/todayStr/shiftDate/loaderrors |
| [admin-system/frontend/src/features/production/services/dailyPlanApi.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/services/dailyPlanApi.ts) | ApiError/conflict |
| [admin-system/frontend/src/features/hr/components/EmployeeModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/hr/components/EmployeeModal.tsx) | existingUniversalreference |
| [admin-system/frontend/src/utils/dailyPlan.test.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/utils/dailyPlan.test.ts) | date/stagetests |

### งานที่ต้องทำ

reuseFormModalTemplateและFormSection; footerbuttonbindformid/pending; preserveconflictforce/readiness/servererror; commonrole=dialog/aria-modal,focus trap/returnfocus/Escape/scrolllockและonClosepolicyระหว่างsave; Asia/Vientianebusinessdateไม่UTCslice; stagefromcanonicaljobtype ไม่bookonly; PRINTINGlegacylabelexplicit; empty/failedstaffqueueต่างกัน; inactive/orphanmachineเตือนและไม่fallbackมั่ว

### Acceptance checks

- [ ] DailyPlanและEmployeeformใช้shellเดียว; nooverlay/zindexconflict; keyboardTab/Escape/focusreturnผ่าน
- [ ] cancelไม่write; validationไม่request; saveonependingbutton; 409conflictไม่success
- [ ] 00:30และ23:30Asia/Vientianeได้วันถูก; blockedjobและloaderrorเห็นreason; newassignmentstageตรงjobflow

**Deferred / constraints:** อย่ารื้อbusinessserviceหรือเปลี่ยนpricing; existinghistoricalrecordsไม่ลบ

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Sonnet 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P4.1 ใน .agents/tasks/production-readiness/TASK_PHASE_04_UNIVERSAL_UX.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/frontend-developer/SKILL.md; อ่าน .agents/skills/somsing-ui-ux-designer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: Daily Plan Universal และ common modal accessibility
เริ่มจาก target files/entry points ของ P4.1; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P4.1
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

## P4.2 — มาตรฐาน feedback/buttons/forms ทั้ง17โมดูล

**Prerequisite:** P4.1 verified

**โมเดล:** Claude Sonnet 4.6 (Thinking); สำรอง Gemini 3.8 Flash High เมื่อ quota/availability ไม่พอ งานยากต้องรักษาเกณฑ์รับ ไม่ลดข้อกำหนดเพื่อให้โมเดลทำง่าย

**สกิลหลัก:** [somsing-ui-ux-designer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/somsing-ui-ux-designer/SKILL.md)

**สกิลเสริมเฉพาะจุดข้ามขอบเขต:** [frontend-developer](/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/frontend-developer/SKILL.md)

### Target files และ entry points

path ด้านล่างสัมพันธ์กับ repository root `/Users/joun/Documents/GitHub/som-sing-phim-printing`; เริ่มอ่าน entry point ที่ระบุ ไม่อ่านทั้ง repo ไฟล์ที่ยังไม่อยู่ในรายการให้บันทึกเหตุผลก่อนขยาย scope

| Target file | จุดเริ่มตรวจ/แก้ |
|---|---|
| [admin-system/frontend/src/features/suppliers/GoodsReceiptModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/suppliers/GoodsReceiptModal.tsx) | commonshell/feedback |
| [admin-system/frontend/src/features/materials/components/MaterialFormModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/components/MaterialFormModal.tsx) | field/errorlayout |
| [admin-system/frontend/src/features/customers/components/CustomerFormModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/customers/components/CustomerFormModal.tsx) | pending/errors |
| [admin-system/frontend/src/features/inventory/components/InboundFormModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inventory/components/InboundFormModal.tsx) | purchase/baseunits |
| [admin-system/frontend/src/features/inbound/components/ImportForm.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/ImportForm.tsx) | explicitunitconversion |
| [admin-system/frontend/src/features/catalog/ProductStudioPage.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/catalog/ProductStudioPage.tsx) | fullpagewizard; ไม่บังคับเปลี่ยนเป็นmodal |
| [admin-system/frontend/src/features/master-data/components/LookupFormModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/master-data/components/LookupFormModal.tsx) | commonpatternreference |
| [admin-system/frontend/src/features/equipment/components/modals/AddEquipmentModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/equipment/components/modals/AddEquipmentModal.tsx) | commonpatternreference |
| [admin-system/backend/settings/notification_settings_handler.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/notification_settings_handler.go) | ignoreExecerrors |
| [admin-system/backend/settings/shop_settings.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/shop_settings.go) | savecontract |

### งานที่ต้องทำ

ทำmodulechecklistจากPhase5matrixและแก้ทีละmodule; commonmodalเฉพาะmodalจริง preservewizard; pending/disabledrequiredfields, errorsretry, confirmationตามdestructivepolicy, loadingemptydistinct; units qtyconversionbaseชัด; labelPOdraftbeforeactualsaveถูกต้อง; notificationDBerrorไม่200success; ใช้iconเดิมไม่emoji; ไม่ทดสอบsendnotificationจริง

### Acceptance checks

- [ ] ทุกprimarybuttonมีhandler/feedback; ไม่มีdecorativebuttonที่ชวนเข้าใจว่าบันทึกได้
- [ ] errorไม่success; disabledมีreason; formmobile/scroll/keyboardใช้ได้
- [ ] สรุป17modulechecked/fixed/unverifiedพร้อมevidenceและภาพscreenshotsของUIที่เปลี่ยน

**Deferred / constraints:** ไม่เพิ่มbusinessfeature/newdesignsystem; configcredentialsและrealnotificationไม่บันทึกลงreport

### คำสั่งคัดลอกไป Antigravity

เลือกโมเดล **Claude Sonnet 4.6 (Thinking)** ใน UI ก่อนส่งข้อความนี้ (Markdown ไม่เปลี่ยนโมเดลให้เอง):

```text
ทำงานใน /Users/joun/Documents/GitHub/som-sing-phim-printing
อ่าน .agents/tasks/production-readiness/README.md แล้วทำเฉพาะ P4.2 ใน .agents/tasks/production-readiness/TASK_PHASE_04_UNIVERSAL_UX.md
ใช้ .agents/skills/somsing-dev-coordinator/SKILL.md และสกิลหลัก .agents/skills/somsing-ui-ux-designer/SKILL.md; อ่าน .agents/skills/frontend-developer/SKILL.md เฉพาะจุดข้ามขอบเขต
เป้าหมาย: มาตรฐาน feedback/buttons/forms ทั้ง17โมดูล
เริ่มจาก target files/entry points ของ P4.2; revalidate baseline และรักษา existing edits
ทำ implementation และ acceptance checks ของงานนี้ครบ บันทึก changed files, commands/results, not-run checks, migration/data impact และ evidence ใน Delivery ของ P4.2
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



## Architecture integration — user approved 2026-10-02

P4.1/P4.2 additions: reuse common modal/viewer/form/feedback components across actual callers, keeping feature-specific pricing/domain behavior in features. P1.2 file viewer work is prerequisite scoped delivery, not Phase4 completion. Verify loading/error/retry, keyboard/focus/accessibility and all17 module feedback. No duplicated toolbar or blanket success on failed persistence.
