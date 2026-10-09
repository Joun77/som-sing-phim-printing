# Som Sing Phim - Phase 2 Readiness Resolution Report
**Date:** 2026-10-09  
**Status:** `ready_for_review`  
**Delivery Manager:** Som Sing Phim Delivery Team  
**Reviewer:** Codex Independent QA / Coordinator  
**Reference Document:** `/Users/joun/Documents/ChatGPT/Som-sing-phim/coordination/ANTIGRAVITY_READINESS_REVIEW_20261009.md`  

---

## 1. Executive Summary & Resolution Matrix

This report details the resolution of all four material gaps identified by Codex during the independent source review on 2026-10-09. All resolutions have been implemented across the Go backend, PostgreSQL migrations, and React TS frontend, verified with automated unit and mounted integration test suites, and packaged without git commits or docker container disruption.

| Gap ID | Description | Root Cause Resolved | Status |
|---|---|---|---|
| **GAP-1** | Automatic Paper Consumption & Decoupled Dimensions | Frontend forced `cutsPerSheet = 1` in `imposition_mode === 'OFF'`; backend threw 422 `OFF_CUTTING_OPTIONS_FORBIDDEN` if cuts > 1; pre-cut stock mismatch hard-blocked saving. Resolved by decoupling job size from stock size, computing 2 cuts for A4 on A3 automatically, preserving manual overrides, and changing size mismatches into non-blocking layout advisories. | **RESOLVED & VERIFIED** |
| **GAP-2** | Zero Coverage Preservation | Falsy JavaScript checks (`0 || 15`) and unconditional fallbacks overwrote measured 0% coverage on CMYK channels with 15% or average coverage. Resolved with `resolveCoverageValue()` ensuring legitimate 0% is strictly distinguished and preserved. | **RESOLVED & VERIFIED** |
| **GAP-3** | Printed-Area Ink Calculation | Ink calculation previously used `parentSheetAreaFactor` whenever `cutsPerSheet > 1`, charging ink across full parent sheet margins and unused spaces. Resolved by calculating ink purely from actual finished item dimensions (`jobW * jobH / A4_AREA`), impressions, and page counts, completely decoupling ink from stock paper consumption. | **RESOLVED & VERIFIED** |
| **GAP-4** | Counter Cash & Explicit Bank Account Selection | `cash` payment method was absent from canonical migrations, causing foreign key violation against `payment_records.payment_method_id`; bank transfer silently defaulted to `bcel_one`. Resolved by adding canonical migration `048_cash_payment_method.sql`, adding UI bank account selector, and requiring explicit method identification. | **RESOLVED & VERIFIED** |

---

## 2. Technical Details of Resolutions

### Gap 1: Automatic Paper Consumption
1. **Decoupled Job Size vs Stock Paper:**
   - In `admin-system/backend/pricing/engine.go`, `ResolvePrecutStock` checks whether job dimensions fit stock dimensions (direct or rotated). When job dimensions exceed stock dimensions, it assigns `snapshot.Orientation = "OVERSIZED"` rather than throwing a 422 error, allowing quotations and drafts to save.
   - In `CalculateJobPricing`, when `ImpositionMode == "OFF"`, if `req.CutsPerSheet <= 0`, it automatically calculates cuts (`snapshot.WidthMM / jobW * snapshot.HeightMM / jobH`), supporting 2 pieces per sheet for A4 on A3 stock. Manual `CutsPerSheet` overrides are strictly preserved.
2. **Frontend Multi-Cut Support & Non-Blocking Layout Validation:**
   - In `QuotationManager.tsx`, line 1353 `cutsPerSheet` now uses `autoCutsPerSheet` or manual override `cutsPerSheetOverride`, regardless of whether `imposition_mode` is `OFF` or `ON`.
   - In `preflightMapper.ts`, `cutsPerSheetOverride` and `part.cutsPerSheet` are preserved in `mapPreflightToSpecs` and `mapQuotationItemToOrderItem`, eliminating silent deletion of cut settings.
   - Removed hard-blocking `if (impositionError) { showToast(...); return; }` from `handleConfirmOrder`, `handleSaveQuotation`, `handleConfirmSaveQuotation`, `handleReviseQuotation`, and `handleSaveDraft`. Retained required field checks (customer name, valid numeric dimensions, valid quantity) while displaying layout limitation explanations advisory in the UI.

### Gap 2: Zero Coverage Preservation
1. **Zero-Safe Coverage Extraction:**
   - Introduced `resolveCoverageValue(val, fallback = 15)` in `QuotationManager.tsx`:
     ```typescript
     export const resolveCoverageValue = (val: any, fallback: number = 15): number => {
       if (val !== undefined && val !== null && val !== '') {
         const num = Number(val);
         if (!isNaN(num) && num >= 0) return num;
       }
       return fallback;
     };
     ```
   - Applied across `editorItem` channel setups, `printerAllocations` defaults, channel calculation loops, and raw quotation item normalization (`avgCoverage`, `cCoverage`, `mCoverage`, `yCoverage`, `kCoverage`).
   - In `admin-system/backend/pricing/engine.go`, channels with `DensityPct: 0.0` calculate zero ink cost without fallback to average or K baseline.

### Gap 3: Printed-Area Ink Calculation
1. **Decoupled Ink Calculation from Stock Sheet Area:**
   - Replaced parent sheet area ink calculation in `QuotationManager.tsx`:
     ```typescript
     const A4_AREA = 210 * 297;
     const printAreaFactor = Math.max(0.01, (Number(jobW) * Number(jobH)) / A4_AREA);
     ```
   - `totalJobProductionSheets` now calculates actual page impressions:
     ```typescript
     const sheetsPerCopy = item.isDoubleSided ? Math.ceil(innerPagesPerBook / 2) : innerPagesPerBook;
     const totalJobProductionSheets = isBatchPhoto ? (photoCountPerSet * orderQty) : (sheetsPerCopy * orderQty);
     ```
   - For covers: `coverSpreadAreaFactor = Math.max(0.01, (Number(jobW) * 2 * Number(jobH)) / A4_AREA)`, charging ink on actual cover spread rather than parent sheet area.
   - Two A4 pieces on one A3 side with 20% coverage consume ink for two A4 impressions at 20% each (not 40% on A3), while consuming 1 physical sheet of A3 stock paper.

### Gap 4: Counter Cash & Explicit Bank Selection
1. **Canonical Database Migration:**
   - Created `admin-system/migrations/048_cash_payment_method.sql` inserting/upserting `cash` into `payment_methods` with Lao label `'ເງິນສົດ (Cash)'` and account code `'CASH'`.
   - Seeded in `017_couriers_and_payment_methods.sql` and registered in `admin-system/backend/db/db.go` `MigrationFiles`.
   - In `admin-system/backend/finance/payment_recording.go`, validates all method IDs against `payment_methods` table, cleanly satisfying the FK constraint `payment_records(payment_method_id) REFERENCES payment_methods(id)`.
2. **Explicit Bank Account Selection in UI:**
   - In `PaymentSlipCard.tsx`, added bank account selection dropdown under the `TRANSFER` tab with active accounts list.
   - Removed implicit `|| 'bcel_one'` fallback in `usePaymentSlipReview.ts`. Requires explicit `methodId || configuration?.payment_method_id` or errors with Lao message `'ກະລຸນາເລືອກບັນຊີຮັບເງິນ'`.
   - Wired `getEffectiveMethodId()` into `onConfirmFullPayment` and `onConfirmDepositPayment`.

---

## 3. Package Manifest & File SHA-256 Checksums

| File Path | SHA-256 Checksum | Change Description |
|---|---|---|
| `admin-system/migrations/048_cash_payment_method.sql` | `5304a469cbcd371204f2924408f0d6446dbbb56e16df1857bc2c53b9f51b2f61` | Canonical migration for cash payment method |
| `admin-system/migrations/017_couriers_and_payment_methods.sql` | `f3c19ced075a6438f973ef9edf51b0ce4fa3344d42ac712c73b180d463b37fde` | Seed cash payment method for fresh databases |
| `admin-system/backend/db/db.go` | `e14af3c986a6fa90d2161c533c18b564049fcff606bf48ba524659b74850a5ed` | Registered migration 048 in migration runner |
| `admin-system/backend/finance/payment_recording.go` | `0ad1fcc2549223b795db231cbb3316fbb451403cf14408e4e3dabaa6b893e203` | FK compliant method validation via DB query |
| `admin-system/backend/pricing/engine.go` | `c8f5ec9d0a5b19f3d9983541f1aa40be66c5338a88bf4fce9f0118e74ae574c5` | Imposition OFF multi-cut, oversized non-blocking resolution |
| `admin-system/backend/pricing/engine_test.go` | `f21569cc66c092979571a2a4b17d29316358327345ff27fde573bc1afe8905f4` | Added unit tests for zero coverage and printed area ink |
| `admin-system/frontend/src/features/orders/components/reception/PaymentSlipCard.tsx` | `8d3a220d3c9568a982ccd353b0da43cffdba8159c5cea26a0dac33fbd6a4fe58` | Bank account `<select>` dropdown, wired `getEffectiveMethodId()` |
| `admin-system/frontend/src/features/orders/components/OrderReceptionPage.tsx` | `61bf4dcc6f49bc1653f5934bd9f4f3ab507ec74d266302bbf5e54697dd5eccc0` | Passed `bankAccounts` to PaymentSlipCard |
| `admin-system/frontend/src/features/pricing/components/QuotationManager.tsx` | `09023881f0c2bf1d102001af33df922cf163e70e5dd76d387a60b2216e42d3b7` | Decoupled cuts, printed-area ink, zero coverage, removed save blockers |
| `admin-system/frontend/src/features/pricing/components/PaperAndCoverSection.tsx` | `38b8685083eb970f1bfd634982345d65fe36dd1fae67446c1564ff70b0fe4f4c` | Display cuts per sheet pill in OFF mode |
| `admin-system/frontend/src/features/pricing/utils/preflightMapper.ts` | `817bc0bf1a3c4a7b7f8448dcbbd0ab804c48176046dac84494e49e0097748d95` | Preserved cutsPerSheet and overrides in OFF mode |
| `admin-system/frontend/src/components/PreflightChecker.tsx` | `216444d393918c081b23e52268f4c875ce3ac2b1e8ad8cbbb5b5424081f0ecaf` | Preserved cuts override in preflight export payload |
| `admin-system/frontend/src/hooks/usePaymentSlipReview.ts` | `b9d4034259a91f0978166dd721e0ef3cabf1e18265f2bd1e0a59c06cfb456bb8` | Removed silent `bcel_one` fallback |
| `admin-system/frontend/tests/ag-p2-readiness-gaps.test.ts` | `36b2246178701829c9da6216c24b4a025037a7838f0640e19ba0996809117970` | Unit test suite covering all 4 readiness gaps |

---

## 4. Test Verification Results

### Backend (`admin-system/backend`)
1. `go test -v -run "TestZeroCoveragePreservation|TestPrintedAreaInkCalculation_DecoupledFromPaperStock" ./pricing/...` -> **PASS** (0.00s)
2. `go test ./pricing/...` -> **PASS** (1.54s)
3. `go test -v ./finance/...` -> **PASS** (1.25s)
4. `go test -v -run TestQuotationParts ./orders/...` -> **PASS** (0.27s)
5. `go test -v -run TestUpload ./orders/...` -> **PASS** (0.36s)
6. `go build ./...` -> **PASS** (Clean build, exit code 0)

### Frontend (`admin-system/frontend`)
1. `npm run typecheck` (`tsc --noEmit`) -> **PASS** (0 errors)
2. `npx vitest run tests/ag-p2-readiness-gaps.test.ts` -> **PASS** (9/9 tests passed in 5ms)
3. `npx vitest run tests/ag-p2-create-mounted.test.tsx` -> **PASS** (5/5 tests passed in 713ms)
4. `npm test -- --run` -> **PASS** (151/151 tests passed in 10 suites)
5. `npm run build` -> **PASS** (Vite production build completed in 575ms)

---

## 5. Constraints Adherence
- **Zero Git Commit / Zero Push:** Working directory remains dirty; no commits made.
- **Codex QA Containers Untouched:** Ports 55708, 55709, 55710 were neither modified nor restarted.
- **Data Integrity:** No database deletions or resets performed; migrations are purely additive.
- **Authentic Lao UI:** All new and modified user interface text uses 100% natural Lao language with Lucide icons (0 Unicode emojis).
- **Handoff State:** Set to `ready_for_review` for independent Codex acceptance testing.
