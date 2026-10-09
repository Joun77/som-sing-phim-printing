# Independent QA Verification Report: Phase 2 Pricing Defect Corrections & Database Persistence Integrity

**Document ID:** `REPORT_PHASE2_INDEPENDENT_QA_PRICING_VERIFICATION_20261010`  
**Revision:** 2.1 (Final Frozen Package with Production Calculation Module & 17/17 Vitest Suite)  
**Role:** Independent QA-Tester (`6db59a2d-96c5-4580-95e3-3b87f569c103`)  
**Recipients:** Antigravity Coordinator (`bd98392b-e28c-4a8f-b78e-4715792b5d83`), Human Overseer  
**CC:** Back-end Developer (`c95266e6-1e7c-498d-8bf1-6c381fc09df9`), Front-end Developer (`fe1f77f6-f769-47b3-8e72-eb3f9916a505`)  
**Base Commit:** `63194e62fc82acaa2672824b9f5009a709137fcc`  
**Execution Date:** 2026-10-10  
**Test Environment:** Isolated Disposable Runtime (Backend: `127.0.0.1:55690`, PostgreSQL: `127.0.0.1:55432` container `49b0ced0613f`, Frontend Preview: `127.0.0.1:5175`)

---

## 1. Evidence Hierarchy & Verification Methodology

In strict accordance with the testing integrity standard, all findings and criteria are evaluated and reported across six distinct evidence levels:

1. **Source Review:** Static line-by-line inspection of code, DTO schemas, and mathematical algorithms.
2. **Production-Function Unit Test:** Automated unit tests directly executing production logic in Go or Vitest without network dependencies.
3. **Mounted UI with Mocked API:** Component mounting tests using mocked API boundaries (e.g. `ag-p2-create-mounted.test.tsx`). *Note: Explicitly treated as proof of UI caller error handling and component state only; NEVER cited as proof of database persistence or absence of duplicate rows.*
4. **Actual Runtime / API:** End-to-end HTTP requests executed against the live running Go backend daemon (`http://127.0.0.1:55690`) with authentic JWT authentication.
5. **Database Readback:** Direct SQL queries executed against the PostgreSQL database (`somsing_db` on container `49b0ced0613f`) inspecting raw table rows, JSONB columns, constraints, and record counts.
6. **Native Browser:** Automated or headless browser exercising the UI DOM. *(Status: Standby/Deferred; preview proxy verified alive at `http://127.0.0.1:5175`).*

---

## 2. Final Frozen Delivery Manifest & SHA-256 Checksums

| File Path | Component | Verified SHA-256 Checksum | Delivery Status |
| :--- | :--- | :--- | :--- |
| `admin-system/backend/pricing/engine.go` | Go Pricing Engine | `e9a2763ea23df81254fa764f3199701f76cf9c26671855f80199956c6b5221da` | **MATCH / VERIFIED** |
| `admin-system/backend/pricing/engine_test.go` | Go Pricing Unit Tests | `181309815d887b250184410f077164a01ff493f30fa42e8badafd2f083e61dd1` | **MATCH / VERIFIED** |
| `admin-system/backend/orders/models.go` | Go Order Models & DTOs | `e899e263c5a25806e57de653e52e650a9828f0a7eaa9c5261951ce43d2ef686c` | **MATCH / VERIFIED** |
| `admin-system/frontend/src/features/pricing/utils/quotationCalculation.ts` | Extracted Production Pricing Engine | `31d27a915a49cbbdb6db49c4a0f63fba11edfeb8e93f0542f3fe874a0a419651` | **MATCH / VERIFIED** |
| `admin-system/frontend/src/features/pricing/components/QuotationManager.tsx` | Quotation Management UI Component | `83d42eabdfdc66e5bf0c267345413fe443ed3b43d95df63b09efe264c488245b` | **MATCH / VERIFIED** |
| `admin-system/frontend/tests/ag-p2-readiness-gaps.test.ts` | Vitest Readiness Gaps Suite (17 tests) | `db41190cb04626c0605d35af48407b8b9f599105b8c4fd5934193d25eaaa9eab` | **MATCH / VERIFIED** |
| `admin-system/frontend/src/features/pricing/api/pricingApi.ts` | Frontend Pricing Client API | `8cf1da20981ed414c345facf3f50241a06e96c52e4e70756896b0f59d7183009` | **MATCH / VERIFIED** |
| `admin-system/frontend/src/features/pricing/utils/preflightMapper.ts` | Preflight & Specs Mapper | `649f8d32305971753cc20c32f3175ed7fd81ff5f3c3a4d7c509f68b521046d4f` | **MATCH / VERIFIED** |

---

## 3. Detailed Criteria Verification Matrix

| Criterion / Gate | Target Scope | Evidence Levels Executed | Canonical Evidence & Values | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **GATE-R1**<br>(Odd Duplex Decoupling) | Decouple physical paper sheets ($\lceil N/2 \rceil$) from printed side impressions ($N \times Q$). Blank 4th side must consume 0 ink and 0 wear clicks. | 1. Source Review<br>2. Unit Tests (Go & Vitest)<br>4. Actual Runtime API<br>5. Database Readback | • `engine.go:520-530` calculates sheets as $\lceil 3/2 \rceil = 2$ and impressions as $3 \times 100 = 300$.<br>• `quotationCalculation.ts:165-175` removes duplex `sideFactor = 2` multiplier on ink.<br>• Go Test `TestOddDuplex_DecoupledSheetsAndImpressions`: 200 sheets (20,000 LAK), 300 impressions (18,750 LAK ink). 0 phantom ink.<br>• Vitest `ag-p2-readiness-gaps.test.ts` test (a): computes 2 physical sheets per copy and exactly 3 ink impressions without phantom 4th side ink (PASS).<br>• Actual Runtime: Synthetic 3-page duplex quotation saved and converted; order item persists 3 pages, duplex, and correct impressions. | **PASS**<br>*(Runtime & DB Verified)* |
| **GATE-R2**<br>(Zero vs Missing Coverage) | Measured 0.0% coverage must not be overwritten with 100% or default to 15%. Negative coverages strictly rejected with HTTP 400. | 1. Source Review<br>2. Unit Tests (Go & Vitest)<br>4. Actual Runtime API<br>5. Database Readback | • `engine.go:718` removed `avgDensity <= 0` overwrite; coverage fields use `*float64`.<br>• Negative coverage triggers `finance.OperationError{Status: 400, Code: "INVALID_COVERAGE"}`.<br>• Go Test `TestZeroCoverage_TopLevelPreflight_ExplicitZeroCMY`: yields `0.00 LAK` ink.<br>• Go Test `TestNegativeCoverage_RejectedWithHTTP400`: returns HTTP 400.<br>• Vitest `ag-p2-readiness-gaps.test.ts` test (c): preserves 0.0% coverage without defaulting to 15% fallback in production calculation (PASS).<br>• Actual Runtime: Quotation with `avg_cov_c: 0.0`, `avg_cov_m: 0.0`, `avg_cov_y: 0.0` saved and converted.<br>• Direct DB Readback: PostgreSQL `items_json` contains `avg_cov_c: 0.0`, `avg_cov_m: 0.0`, `avg_cov_y: 0.0` preserved verbatim without inflation. | **PASS**<br>*(Runtime & DB Verified)* |
| **GATE-R3**<br>(Mixed Color/Mono Population) | Document with 1 color + 9 mono pages must not bill CMY across all 10 pages (+900% overcharge). | 1. Source Review<br>2. Unit Tests (Go & Vitest)<br>4. Actual Runtime API<br>5. Database Readback | • `engine.go:800-845` calculates CMY strictly on $P_{color} \times Q$, K on $(P_{color} \times \text{CovK}) + (P_{mono} \times \text{MonoCovK})$.<br>• `quotationCalculation.ts:40-60` implements document-weighted coverage with zero-division guards.<br>• Go Test `TestMixedColorAndMonoPages_PopulationSplit`: CMY charged on 100 impressions (56,250 LAK instead of 562,500 LAK).<br>• Vitest `ag-p2-readiness-gaps.test.ts` test (b): isolates CMY strictly to the 1 color page population and K across all pages (PASS).<br>• Actual Runtime & DB: Quotation with `color_pages_count: 1`, `mono_pages_count: 9` saved, converted to order; PostgreSQL `order_items.specs` contains `color_pages_count: 1`, `mono_pages_count: 9` intact. | **PASS**<br>*(Runtime & DB Verified)* |
| **GATE-STOCK**<br>(Stock Geometry & Manual Override) | 2-up A4 on A3 precut stock uses A4 piece area for ink. `manual_sheet_count` overrides auto calculation and persists across lifecycle. | 1. Source Review<br>2. Unit Tests (Go & Vitest)<br>4. Actual Runtime API<br>5. Database Readback | • `engine.go:440-460` auto-resolves cuts per sheet ($2$) while ink area factor remains A4 piece area ($S = 1.0$).<br>• Go Test `TestTwoUpA4OnA3_WithManualSheetOverride`: overrides sheets from 275 to 300, paper cost from 275,000 to 300,000 LAK.<br>• Vitest `ag-p2-readiness-gaps.test.ts` tests (d) & (e): A4 on A3 calculates 2-up sheet yield correctly and ink area on A4 area; manual sheet override updates paper cost without altering ink (PASS).<br>• Actual Runtime: Synthetic quote created with `manual_sheet_count: 130`, `cuts_per_sheet: 2`.<br>• Direct DB Readback: PostgreSQL `quotations.items_json` and `order_items.specs` persist `manual_sheet_count: 130` and `cuts_per_sheet: 2` through conversion. | **PASS**<br>*(Runtime & DB Verified)* |
| **GATE-PERSISTENCE**<br>(Save $\to$ Convert $\to$ Replay $\to$ Readback) | Complete end-to-end lifecycle: Quote Save $\to$ Order Convert $\to$ Replay $\to$ DB Readback. Zero duplicate quotes/orders; exact money and identities; draft preserved on failure with Lao message. | 1. Source Review<br>2. Unit Tests<br>3. Mounted UI (Mocked)<br>4. Actual Runtime API<br>5. Database Readback | • Executed live script `scratch/verify_phase2_isolated_e2e.mjs`.<br>• Authenticated via `POST /api/v1/auth/login` (admin token generated).<br>• Saved quote `qt-synth-1791570078469` via `POST /api/v1/quotations` (HTTP 201).<br>• Direct DB query confirms quote status `Draft`, selling price 160,500 LAK.<br>• Converted quote via `POST /api/v1/quotations/.../convert` with header `Idempotency-Key: quotation-conversion:qt-synth-1791570078469`. Order `order-3379bc694c2239f924df2a24822f4af3` created (HTTP 201).<br>• Canonical API readback `GET /api/v1/orders/...`: 160,500 LAK, embedded `_somsing_quote_snapshot`.<br>• Direct DB query: `SELECT COUNT(*) FROM orders WHERE idempotency_key=...` yields **EXACTLY 1**.<br>• Idempotent Replay: re-sent conversion request; received HTTP 200 with `replayed: true` and identical Order ID. Re-query of DB confirms **EXACTLY 1 order** and **EXACTLY 1 quotation** (PROVED NO DUPLICATES).<br>• Failed Save Handling: invalid quote rejected with HTTP 400 `invalid_request`; DB confirms zero dirty row inserted.<br>• Vitest test: confirms draft data preserved and displays actionable Lao message `ຂໍ້ມູນສະບັບຮ່າງຂອງທ່ານຍັງຖືກຮັກສາໄວ້ ຄົບຖ້ວນ` (PASS). | **PASS**<br>*(Runtime & DB Verified)* |
| **GATE-NATIVE-UI**<br>(End-to-End Browser UI Flow) | Native browser automation exercising DOM clicks across Quotation Manager and Order Reception pages. | 6. Native Browser | • Google Chrome verified present at `/Applications/Google Chrome.app`.<br>• Frontend preview verified listening and proxying at `http://127.0.0.1:5175`.<br>• Component interaction tested via Vitest mounted suite (`ag-p2-create-mounted.test.tsx` 5/5 passed).<br>• Native headless browser DOM drive was not executed in this isolated batch. | **NOT VERIFIED**<br>*(Browser UI automation unexercised; runtime API/DB paths verified)* |

---

## 4. Automated Unit & Regression Test Summaries

- **Go Backend Pricing Unit Tests (`go test -v ./pricing/...`):**
  - **36/36 tests PASS** (0 failures).
  - Explicitly tests: `TestOddDuplex_DecoupledSheetsAndImpressions`, `TestZeroCoverage_TopLevelPreflight_ExplicitZeroCMY`, `TestNegativeCoverage_RejectedWithHTTP400`, `TestMixedColorAndMonoPages_PopulationSplit`, `TestTwoUpA4OnA3_WithManualSheetOverride`, `TestLAKCurrencyDecimalPrecision`.
- **Frontend Typecheck (`npm run typecheck`):**
  - **0 errors** across full React TypeScript codebase.
- **Frontend Vitest Readiness Suite (`tests/ag-p2-readiness-gaps.test.ts`):**
  - **17/17 tests PASS** (Directly tests `calculateSingleItemFinancials` from `quotationCalculation.ts`, preflight mapping, and draft preservation with Lao error messages).
- **Frontend Vitest Mounted Suite (`tests/ag-p2-create-mounted.test.tsx`):**
  - **5/5 tests PASS** (caller recovery, conversion money mismatch rejection, replay envelope rejection under mocked API).
- **Frontend Production Build (`npm run build`):**
  - Successful in 670ms.

---

## 5. System Integrity & Resource Isolation

- **Repository Working Tree:** All pre-existing dirty files and scratch directories were preserved untouched. Zero commits, zero pushes, zero remote deployments.
- **Codex Resources Isolation:** Ports `55683`, `34664`, `78687` and Docker containers `64479dd998d0`, `55550fae2209` remain completely isolated and unaffected.
- **Disposable Test Cleanup:** All synthetic quotation and order rows created during the verification runs were cleaned up from `somsing_db`.

---

## 6. QA Final Verdict

1. **Phase 2 Pricing Defect Corrections (R1, R2, R3) and Precut / Manual Overrides:**
   - **PASS (VERIFIED via Production Unit Tests, Actual HTTP Runtime API, and Direct PostgreSQL Database Readback).**
2. **Quotation Save $\to$ Order Conversion $\to$ Idempotent Replay:**
   - **PASS (VERIFIED via Live API and Database Row Count Assertions; Zero Duplicate Rows Proved).**
3. **End-to-End Native Browser Automation:**
   - **NOT VERIFIED (Retracted blanket pass; live preview server verified alive on port 5175, but full browser DOM click automation remains unexercised in this batch).**
