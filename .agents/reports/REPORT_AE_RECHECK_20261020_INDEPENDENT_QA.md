# Independent QA Acceptance Report: Round AE-RECHECK-20261020 (With Evidence Supplement)

**Project:** Som Sing Phim Printing ERP  
**Round:** AE-RECHECK-20261020  
**Role:** Independent QA Owner (`6db59a2d-96c5-4580-95e3-3b87f569c103`)  
**Delivery Coordinator:** `bd98392b-e28c-4a8f-b78e-4715792b5d83`  
**Execution Timestamp:** 2026-10-20T02:26:55+07:00 (2026-10-19T19:26:55Z)  
**Supplement Timestamp:** 2026-10-20T02:40:00+07:00 (2026-10-19T19:40:00Z)  
**Status:** **READY_FOR_REVIEW**

---

## 1. Executive Summary & Verdict

Independent QA has conducted an isolated, end-to-end acceptance verification of the joined codebase delivered across Front-end, Back-end, and Database specialists for round `AE-RECHECK-20261020`.

All 5 core QA findings and historical Phase A regression invariants were verified using dedicated automated test suites, static AST/source audits, direct PostgreSQL container queries, and live HTTP API integration against the refreshed disposable backend daemon (`http://127.0.0.1:55690`) and isolated fixture database (`da2c2cd18551` on `127.0.0.1:55432`).

### Evidence Level & Verification Matrix
| Probe ID | Target / Feature | Verification Method / Tier | Result | Exact Scope & Limitation |
| :--- | :--- | :--- | :---: | :--- |
| **PROBE-1A** | No Fabricated Verifier | Static Code / AST Audit | **PASS** | `OrderCompletedSummaryPage.tsx` lines checked. Generic accounting fallback removed. |
| **PROBE-1B** | No Fabricated CONFIRMED Receipt | Static Code / AST Audit | **PASS** | `OrderCompletedSummaryPage.tsx` lines checked. Synthesized receipt fallback removed. |
| **PROBE-1C** | Summary Component Provenance | Frontend Unit Test (Vitest + jsdom) | **PASS** | 6/6 tests in `order-completed-summary-provenance.test.tsx` passed in 145ms. |
| **PROBE-1D** | Orders Summary List Readback | Live HTTP API (`GET /api/orders`) | **PASS** | 117 orders read back from disposable backend on port 55690. |
| **PROBE-1-E2E** | Native Browser E2E Reopen Journey | Live Headless/Headed Browser UI | **NOT VERIFIED** | **Explicit Limitation:** No Vite preview/dev server or browser automation runner was active during test execution. Verified at Component DOM (Vitest) and API levels only; native browser navigation across live router is NOT VERIFIED. |
| **PROBE-2A** | Migration 050 Applied in Fixture DB | Container DB SQL Query | **PASS** | Verified in `schema_migrations` in container `da2c2cd18551`. |
| **PROBE-2B** | Fresh & Upgrade Scenarios | Go DB Test Suite (`go test`) | **PASS** | Fresh (001..050) & Upgrade (001..048 -> seed -> 049 -> 050) passed in 1.05s on disposable databases. |
| **PROBE-2C** | Legitimate Zero Cost Preservation | Container DB SQL Query | **PASS** | `ORD-VIP-DEMO-01` verified as `RECORDED / LEGITIMATE_ZERO / 0.00`. |
| **PROBE-2D** | Partial Cost Preservation | Container DB SQL Query | **PASS** | `ae-bfb99a-partial-cost` verified as `PARTIAL / HISTORICAL_PRESERVED`. |
| **PROBE-2E** | Actual Cost Audit Logs | Container DB SQL Query | **PASS** | 117 records in `order_actual_cost_logs` with `action='MIGRATED'`. |
| **PROBE-3A** | Legacy In-Memory Bypass Removal | Static Code / AST Audit | **PASS** | `payment_recording.go` verified: `legacyPaidApproved` completely removed. |
| **PROBE-3B** | Financial 409 Enforcement | Go Unit Test Suite (`go test`) | **PASS** | 4/4 statuses (`COMPLETED`, `PAID_PREPRESS`, `IN_PRODUCTION`, `DELIVERED`) reject with 409. |
| **PROBE-3C** | Live Legacy Order Rejection | Live HTTP API (`POST .../review`) | **PASS** | Strict rejection verified on orders without durable receipts. |
| **PROBE-4A** | Density Continuity at 15% | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | Sweep across 14.0%..16.0% yields smooth monotonic ratio 0.9933. |
| **PROBE-4B** | Explicit 0.0% Coverage | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | Yields `ink_cost = 0.00 LAK`. |
| **PROBE-4C** | Missing Coverage Guard | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | Returns HTTP 400 `MISSING_COVERAGE` (no silent 15% fallback). |
| **PROBE-4D** | Negative Coverage Guard | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | Returns HTTP 400 `INVALID_COVERAGE`. |
| **PROBE-5A** | 6 Color + 9 Mono Population Split | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | Exact 321.83 LAK (K: 36.83, CMY: 285.00), rejecting old 891.83 LAK. |
| **PROBE-5B** | 6 Color + 9 Mono Multi-Process | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | Exact 321.83 LAK (K: 36.83, CMY: 285.00). |
| **PROBE-6A** | Machinery Cost (168.00 LAK) | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | PRN-9614: 90.00 depreciation + 78.00 wear parts = 168.00 LAK. |
| **PROBE-6B** | Direct Impression Baseline (217.96) | Live HTTP API (`POST /api/pricing/calculate`) | **PASS** | 168.00 machinery + 49.96 ink = 217.96 LAK. |
| **PROBE-6C** | Odd Duplex & Imposition Decoupling | Go Pricing Test Suite (`go test`) | **PASS** | `TestOddDuplex_DecoupledSheetsAndImpressions` and `TestTwoUpA4OnA3_WithManualSheetOverride` PASS. |

---

## 2. Evidence Locators & Test Artifacts

The test scripts and raw machine-readable probe results are located in both the agent scratch space and repository reports directory:

1. **Test Harness Script:**
   - Scratch Path: `/Users/joun/.gemini/antigravity/brain/6db59a2d-96c5-4580-95e3-3b87f569c103/scratch/verify_ae_recheck_20261020.mjs`
   - Repository Path: `.agents/reports/verify_ae_recheck_20261020.mjs`
2. **Raw JSON Results Artifact:**
   - Scratch Path: `/Users/joun/.gemini/antigravity/brain/6db59a2d-96c5-4580-95e3-3b87f569c103/scratch/ae_recheck_probe_results.json`
   - Repository Path: `.agents/reports/ae_recheck_probe_results.json`
3. **Target Fixture Environment:**
   - Backend URL: `http://127.0.0.1:55690`
   - PostgreSQL Container: `da2c2cd18551` (`somsing_fixture_db` on port `55432`)
   - Protected Shop DB (`port 5432`): 100% untouched.

---

## 3. Frozen Deliverable Manifest & SHA-256 Hashes

Every file included in the delivered package was independently hashed and matched the release manifest 100%:

```
53b2a9aee122d4aa24f4459c5740970179ce6fb568a810d3e8f67d61e39d3686  admin-system/frontend/src/features/orders/components/OrderCompletedSummaryPage.tsx
c8197e15014d3653339b606532d0938ecc63c34143c6fed7738279cff270a0a4  admin-system/frontend/tests/order-completed-summary-provenance.test.tsx
e012b5ced26de18b94b089a3bb07939b85eeee908598ff77ed174663610f4e28  admin-system/backend/finance/payment_recording.go
c213441d85ed6f3822e7714e6ac27e360b46358b54649f0cf21aabe2d79007dc  admin-system/backend/pricing/engine.go
f06fd97cb8314d16c2f4eeee6f42e073051b6080ffb40c0dc4be23baa49cad25  admin-system/backend/pricing/engine_test.go
6dcddf241dd39994ea5ce387c66a3585e4494ac690def51781212668c1b18db6  admin-system/backend/finance/payment_reconciliation_test.go
702702d7187a7c7b63b114762b0e0749b753ab17d9fd92d1bb70ce2f0162e594  admin-system/backend/migrations/049_ae_payment_context_and_actual_cost_provenance.sql
7119c64583536529dd3a6dc1c18c7b31ff389c03e3637fc0df86b82d1f71a307  admin-system/backend/migrations/050_actual_cost_provenance_and_reconciliation.sql
c4b908e0d8cc90c576d9753c8eb0e503656ae00db499615344b578a810871c65  admin-system/backend/db/db.go
cb766e0e3eaed11b3119a3f8a0ebb80b4fa41508b1d01d9dfedd9a80a947e7e5  /tmp/somsing-backend-disposable
```

---

## 4. Unrecoverable Historical Provenance Limitation (Explicit Notice)

As established by DB Analyst and verified by QA:
- **Historical Orders Erased Prior to Migration 050:** In earlier migration 049 execution, orders that had `realized_total_cost = 0.00` alongside estimated costs were converted to `NULL`. The actual itemized breakdown for those specific historical orders is permanently unrecoverable from the database.
- **Strict Anti-Fabrication Policy:** Migration 050 purposefully does **NOT** synthesize, guess, or backfill these erased values. Instead, they are truthfully classified as `realized_cost_status = 'UNKNOWN'` and `realized_cost_provenance = 'HISTORICAL_UNKNOWN'` with explicit audit notes (`"Actual cost unrecorded prior to migration 050. Irrecoverable if wiped by migration 049."`).
- **Legitimate Complete Zeroes Preserved:** Orders that had estimated cost 0.00 (e.g. `ORD-VIP-DEMO-01`, internal samples) are fully protected and classified as `RECORDED / LEGITIMATE_ZERO` with `realized_total_cost = 0.00`.

---

## 5. Raw Output Logs by Criterion

### Probe 1C: Frontend Provenance Vitest Suite
```
 ✓ tests/order-completed-summary-provenance.test.tsx (6 tests) 145ms
   ✓ OrderCompletedSummaryPage Canonical Provenance & Honest Costs > 1. Never invents CONFIRMED receipt, generic reviewer, or method when unrecorded 55ms
   ✓ OrderCompletedSummaryPage Canonical Provenance & Honest Costs > 2. Truthfully displays PENDING review state without false 100% PAID or false settlement 20ms
   ✓ OrderCompletedSummaryPage Canonical Provenance & Honest Costs > 3. Renders canonical receipt, verifier, and 100% PAID when CONFIRMED 15ms
   ✓ OrderCompletedSummaryPage Canonical Provenance & Honest Costs > 4. Renders REVERSED payment state and provenance record truthfully 14ms
   ✓ OrderCompletedSummaryPage Canonical Provenance & Honest Costs > 5. Protects against fake margin when actual costs are incomplete (unrecorded) 20ms
   ✓ OrderCompletedSummaryPage Canonical Provenance & Honest Costs > 6. Preserves legitimate zero costs (0 LAK finishing & spoilage) with truthful margin 21ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### Probe 2B: Migration 050 Fresh & Upgrade Isolation Test
```
=== RUN   TestMigration050_FreshAndUpgradeScenarios
    migration_provenance_test.go:90: [FRESH] Running all migrations 001..050 on disposable database...
    migration_provenance_test.go:101: [FRESH] All migrations through 050 successfully applied and tracked.
    migration_provenance_test.go:147: [FRESH PASS] Case 1 Legitimate Complete Zero: status=RECORDED, provenance=LEGITIMATE_ZERO, total=0.00
    migration_provenance_test.go:171: [FRESH PASS] Case 2 Missing/Unrecorded Cost: status=UNKNOWN, provenance=UNRECORDED, total=NULL
    migration_provenance_test.go:201: [FRESH PASS] Case 3 Partial Cost: status=PARTIAL, provenance=MANUAL_ENTRY, paper=45000.00, total=NULL
    migration_provenance_test.go:231: [FRESH PASS] Case 4 Positive Cost: status=RECORDED, provenance=MANUAL_ENTRY, total=70000.00
    migration_provenance_test.go:262: [FRESH PASS] Case 5 Loss Order: status=RECORDED, revenue=60000.00, actual_cost=85000.00, gross_profit=-25000.00
    migration_provenance_test.go:299: [UPGRADE] Successfully applied migrations up to 048.
    migration_provenance_test.go:302: [UPGRADE] Seeding pre-049 historical data...
    migration_provenance_test.go:375: [UPGRADE BEFORE 049] hist-legit-zero total=0.00, hist-unrecorded total=0.00
    migration_provenance_test.go:379: [UPGRADE] Applying Migration 049...
    migration_provenance_test.go:386: [UPGRADE AFTER 049] hist-legit-zero totalValid=true (kept 0.00 because total_cost=0)
    migration_provenance_test.go:388: [UPGRADE AFTER 049] hist-unrecorded totalValid=false (wiped to NULL because total_cost>0)
    migration_provenance_test.go:394: [UPGRADE] Applying Migration 050 reconciliation...
    migration_provenance_test.go:421: [UPGRADE RECONCILED] ID=ORD-VIP-DEMO-01    Status=RECORDED   Provenance=LEGITIMATE_ZERO      TotalValid=true
    migration_provenance_test.go:421: [UPGRADE RECONCILED] ID=hist-legit-zero    Status=RECORDED   Provenance=LEGITIMATE_ZERO      TotalValid=true
    migration_provenance_test.go:421: [UPGRADE RECONCILED] ID=hist-partial       Status=PARTIAL    Provenance=HISTORICAL_PRESERVED TotalValid=true
    migration_provenance_test.go:421: [UPGRADE RECONCILED] ID=hist-positive      Status=RECORDED   Provenance=HISTORICAL_PRESERVED TotalValid=true
    migration_provenance_test.go:421: [UPGRADE RECONCILED] ID=hist-unrecorded    Status=UNKNOWN    Provenance=HISTORICAL_UNKNOWN   TotalValid=false
    migration_provenance_test.go:456: [UPGRADE PASS] Audit logs recorded for all 5 migrated orders.
--- PASS: TestMigration050_FreshAndUpgradeScenarios (1.05s)
```

### Probe 3B: Financial Reconciliation Go Tests
```
=== RUN   TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409
=== RUN   TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409/Status_COMPLETED
=== RUN   TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409/Status_PAID_PREPRESS
=== RUN   TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409/Status_IN_PRODUCTION
=== RUN   TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409/Status_DELIVERED
--- PASS: TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409 (0.00s)
=== RUN   TestFinancialReconciliation_DurableProvenance_ConfirmedRecordReconciles
--- PASS: TestFinancialReconciliation_DurableProvenance_ConfirmedRecordReconciles (0.00s)
```

### Probe 4A: Coverage Density Sweep
```
       Density 14.0% => Ink Cost: 13987.49 LAK
       Density 14.9% => Ink Cost: 14886.69 LAK
       Density 15.0% => Ink Cost: 14986.60 LAK
       Density 15.1% => Ink Cost: 15086.51 LAK
       Density 16.0% => Ink Cost: 15985.71 LAK
       Ratio (14.9% / 15.0%): 0.9933 (Monotonic, continuous slope)
```

### Probe 5A & 5B: Mixed 6 Color + 9 Mono Ink Oracle (321.83 LAK)
```
Preflight Population Split:
  Reported Total Ink Cost: 321.83 LAK (Expected: 321.83 LAK)
  Reported Ink Cost K:     36.83 LAK (Expected: 36.83 LAK)
  Reported Ink Cost CMY:   285.00 LAK (Expected: 285.00 LAK)

Multi-Process Split:
  Reported Total Ink Cost: 321.83 LAK (Expected: 321.83 LAK)
  Reported Ink Cost K:     36.83 LAK (Expected: 36.83 LAK)
  Reported Ink Cost CMY:   285.00 LAK (Expected: 285.00 LAK)
```

### Probe 6A & 6B: Phase A Baseline Machinery & Impression
```
Machine Cost: 168.00 LAK (Depreciation: 90.00 LAK + Maintenance: 78.00 LAK)
Ink Cost:     49.96 LAK (K: 2.46 LAK + CMY: 47.50 LAK)
Direct Cost:  217.96 LAK (168.00 + 49.96)
```

---

## 6. Conclusion & Handoff

The joined delivery package across Frontend, Backend, and Database Analyst completely resolves all findings in `AE-RECHECK-20261020` without introducing regressions into Phase A machinery baselines or imposition contracts.

The package is marked **READY_FOR_REVIEW** for independent Codex acceptance.
