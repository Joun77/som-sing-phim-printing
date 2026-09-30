# Report: งานคงเหลือเพื่อทำให้ระบบหลังบ้านเชื่อมข้อมูลจริงครบวงจร (System Stabilization & Final Alignment)

## 1. สถานะการตรวจรับ (Verification Status): PASS (Certified 100%)

## 2. ผลการตรวจสอบตามเกณฑ์ (QA Acceptance Criteria)
- [x] **Safe & Idempotent Migration 042:**
  - สำรองและรักษาข้อมูล asset ที่ตกค้างใน `materials` เข้าตาราง `archived_material_assets` (`to_jsonb(m)`)
  - จำกัดการลบเฉพาะแถว `PRN-9614`, `PRN-6317` หรือแถวที่มีใน `printers` และต้องไม่มี FK จาก `machine_wear_part_logs`
  - ป้องกันแถวซ้ำใน `machine_wear_parts` ด้วย unique index `uq_machine_wear_parts_asset_part_en` และ `ON CONFLICT (asset_id, part_name_en) DO UPDATE`
  - ยืนยันไฟล์ Migration 042 ทั้งสองสำเนา (`admin-system/migrations/` และ `admin-system/backend/migrations/`) ตรงกัน 100%
  - ทดสอบรันซ้ำบน PostgreSQL จริง (`somsing_db`) ยืนยันจำนวนแถวใน `machine_wear_parts` ยังคงเท่าเดิม 7 แถว (0 duplicates created)
- [x] **Wear Parts CRUD & Frontend Error Immunity:**
  - Frontend (`EquipmentDetailsPage.tsx`) ตรวจสอบ `res.ok` บน POST, PUT, DELETE
  - หาก API ล้มเหลว (4xx, 5xx) ระบบจะแสดง Error Toast ทันที และไม่แตะต้อง local equipment components รวมถึงไม่แสดง Success Toast
  - Backend PUT (`HandleUpdateMachineWearPart`) ตรวจสอบ `cost >= 0`, `lifespan > 0`, `counter >= 0`, ชื่อและหมวดหมู่ไม่ว่าง, และตรวจสอบความสอดคล้องของ `asset_id`
  - Backend POST (`HandleCreateMachineWearPart`) ตรวจสอบความถูกต้องของสเปกและตรวจสอบว่า asset มีอยู่จริงในตาราง `printers`
  - Backend DELETE (`HandleDeleteMachineWearPart`) ตรวจสอบ `asset_id` และคืนค่า 404 หากไม่พบ
  - ทดสอบผ่าน Unit/Integration tests: `TestWearPartsInputValidations`, `TestWearPartsDatabaseLifecycleAndWrongAsset`, และ `Wear Parts CRUD API Failure Guard & Local State Immunity`
- [x] **Pricing Baseline Policy & Empirical Sensitivity:**
  - เชื่อมโยง `BaselineCoveragePercent` เข้ากับ Threshold Policy ใน `engine.go`
  - ทดสอบด้วย `TestBaselineCoveragePolicySensitivity` โดยใช้สเปกงานเดียวกัน (Coverage 15%, ต้นทุนหมึกและยอดรวมก่อน threshold เท่ากัน 100%):
    - เมื่อ Baseline = 20%: ระบบคิดราคา Base Floor Price 130,000 LAK (`IsThresholdExceeded = false`, `ThresholdSurcharge = 0`)
    - เมื่อ Baseline = 10%: ระบบคิดราคา Dynamic Price 140,038.46 LAK (`IsThresholdExceeded = true`, `ThresholdSurcharge = 10,038.46 LAK`)
    - พิสูจน์ว่า `BaselineCoveragePercent` มีผลต่อ Policy จริงโดยไม่มีการเปลี่ยนต้นทุนหมึก
- [x] **Task Documentation Integrity:**
  - ซ่อมแซมข้อความที่เสียหาย `TASK_**เกณฑ์ตรวจรับ**` ในเอกสาร
  - ย้าย Task Files ทั้งหมดที่ผ่านเกณฑ์ตรวจรับ 100% เข้าสู่ `.agents/reports/` ตามกฎระเบียบ `somsing-qa-orchestrator`

## 3. สรุปผลการทดสอบทั้งหมด (Full Verification Suite)
| รายการทดสอบ | คำสั่ง | ผลลัพธ์ |
|---|---|---|
| Go Format | `gofmt` บน Go files ที่แก้ไข | PASS (Formatted cleanly) |
| Git Whitespace Check | `git diff --check` | PASS (Exit code 0, 0 issues) |
| Go Unit & Integration Tests | `go test ./...` ใน `admin-system/backend` | PASS (100% all packages pass) |
| Go Compilation | `go build ./...` ใน `admin-system/backend` | PASS (Exit code 0, 0 errors) |
| Admin Frontend Typecheck | `npm run typecheck` | PASS (0 type errors) |
| Admin Frontend Unit Tests | `npm test` (tsx --test src/utils/*.test.ts) | PASS (53/53 tests pass, duration 481ms) |
| Admin Frontend Production Build | `npm run build` | PASS (Built in 516ms) |
| Storefront Customer Service Build | `npm run build` | PASS (Built in 1.50s) |
| PostgreSQL Migration Idempotency | `psql < 042_...sql` rerun on `somsing_db` | PASS (Count maintained at 7 wear parts) |
| Frontend API Failure Guard | `wearPartsCrudFailure.test.ts` | PASS (Local state unchanged, no success toast) |
