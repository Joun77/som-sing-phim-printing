# Somsin Printing ERP — Evidence Supplement & Locator Correction: AE-RECHECK-20261020

**Delivery Date:** 2026-10-20  
**Task Identifier:** `AE-RECHECK-20261020-SUPPLEMENT` (Clarification of Evidence Levels & Test Limitations)  
**Status:** `ready_for_review` (Awaiting Independent Codex Review)  
**Coordination Authority:** Delivery Coordinator (`bd98392b-e28c-4a8f-b78e-4715792b5d83`)  
**QA Specialist Authority:** Independent QA Owner (`6db59a2d-96c5-4580-95e3-3b87f569c103`)  

---

## 1. Evidence Locator Correction

In the initial delivery reports (`REPORT_CODEX_AE_RECHECK_20261020_DELIVERY.md` and `REPORT_AE_RECHECK_20261020_INDEPENDENT_QA.md`), the QA verification script was referenced as `verify_ae_recheck_20261020.mjs` relative to repository root. 

This locator is corrected as follows:
- **Incorrect Path:** `som-sing-phim-printing/verify_ae_recheck_20261020.mjs` (Does not exist in repo root)
- **Authoritative QA Execution Path:**  
  `/Users/joun/.gemini/antigravity/brain/6db59a2d-96c5-4580-95e3-3b87f569c103/scratch/verify_ae_recheck_20261020.mjs`
- **Authoritative Raw Test Output Artifact:**  
  `/Users/joun/.gemini/antigravity/brain/6db59a2d-96c5-4580-95e3-3b87f569c103/scratch/ae_recheck_probe_results.json`

The 1,629-file repository manifest (`.agents/reports/ae-recheck-20261020-manifest.json`) correctly indexes repository files and is verified with 0 drift.

---

## 2. Evidence Level Matrix & Granular Test Scope

In accordance with Codex's review observation, this section clarifies the exact testing tier and scope for each probe, explicitly separating static code checks, component-level unit tests, backend API queries, and native browser UI journeys.

| Probe ID | Target Description | Verification Tier / Method | Exact Command / Probe Logic | Evidence Result | Native UI / Reopen Status |
|---|---|---|---|:---:|:---:|
| **PROBE-1A** | Summary Page: No Fabricated Verifier | Static Source Inspection | Scanned `OrderCompletedSummaryPage.tsx` AST for `'Verified by Som-Sing Accounting'` | **PASS** (Static Code) | N/A (Source check) |
| **PROBE-1B** | Summary Page: No Fake CONFIRMED Receipt | Static Source Inspection | Scanned `OrderCompletedSummaryPage.tsx` AST for `? 'CONFIRMED' : '—'` | **PASS** (Static Code) | N/A (Source check) |
| **PROBE-1C** | Frontend Provenance Rendering (6 Cases) | Component Unit Test (Vitest / JSDOM) | `npx vitest run tests/order-completed-summary-provenance.test.tsx` | **PASS** (6/6 Component Tests) | **NOT VERIFIED** (JSDOM mock; not real browser) |
| **PROBE-1D** | Orders List API Readback | Backend HTTP API Probe | `GET /api/orders` against backend on port 55690 (117 orders returned) | **PASS** (HTTP API 200) | **NOT VERIFIED** (No headless browser navigation) |
| **PROBE-2A** | Migration 050 Applied in Fixture DB | SQL Schema Inspection | `SELECT version FROM schema_migrations;` in container `da2c2cd18551` | **PASS** (PostgreSQL) | N/A (Database level) |
| **PROBE-2B** | Migration 050 Fresh & Upgrade Isolation | Go Database Integration Test | `go test -v ./db/test_fixtures -run TestMigration050_FreshAndUpgradeScenarios` | **PASS** (Go DB Test) | N/A (Database level) |
| **PROBE-2C** | Legitimate Zero Cost Preservation | SQL Fixture Inspection | Queried `ORD-VIP-DEMO-01` (`status=RECORDED`, `provenance=LEGITIMATE_ZERO`, `total=0.00`) | **PASS** (PostgreSQL) | N/A (Database level) |
| **PROBE-2D** | Partial Cost Provenance Preservation | SQL Fixture Inspection | Queried `ae-bfb99a-partial-cost` (`status=PARTIAL`, `provenance=HISTORICAL_PRESERVED`) | **PASS** (PostgreSQL) | N/A (Database level) |
| **PROBE-2E** | Audit Trail Logging | SQL Fixture Inspection | Counted 117 `MIGRATED` rows in `order_actual_cost_logs` | **PASS** (PostgreSQL) | N/A (Database level) |
| **PROBE-3A** | Excised `legacyPaidApproved` Bypass | Static Source Inspection | Inspected `payment_recording.go` lines 265–275 for removed waiver | **PASS** (Static Code) | N/A (Source check) |
| **PROBE-3B** | 409 Enforcement Across All Statuses | Go Unit Test Suite | `go test -v ./finance -run TestFinancialReconciliation` | **PASS** (Go Finance Tests) | N/A (API/Transaction level) |
| **PROBE-3C** | Unreconciled Order HTTP 409 Rejection | Live HTTP API Probe | `POST /api/orders/{id}/payments/review` with opening=0 & no receipts | **PASS** (HTTP 409) | **NOT VERIFIED** (Browser UI modal review not re-run) |
| **PROBE-4A** | Continuous Monotonic Curve at 15% | Live HTTP API Probe | `POST /api/pricing/calculate` at 14.0%, 14.9%, 15.0%, 15.1%, 16.0% | **PASS** (Ratio: 0.9933) | N/A (Pricing Engine API) |
| **PROBE-4B** | Explicit 0.0% Coverage | Live HTTP API Probe | `POST /api/pricing/calculate` with `average_density_pct: 0.0` | **PASS** (0.00 LAK) | N/A (Pricing Engine API) |
| **PROBE-4C** | Missing Coverage Guard | Live HTTP API Probe | `POST /api/pricing/calculate` without density | **PASS** (HTTP 400 `MISSING_COVERAGE`) | N/A (Pricing Engine API) |
| **PROBE-4D** | Negative Coverage Guard | Live HTTP API Probe | `POST /api/pricing/calculate` with `avg_cov_k: -5.0` | **PASS** (HTTP 400 `INVALID_COVERAGE`) | N/A (Pricing Engine API) |
| **PROBE-5A** | 6-Color/9-Mono Ink Oracle (Population Split) | Live HTTP API Probe | `POST /api/pricing/calculate` with 15 pages (6 color, 9 mono) | **PASS** (Exact 321.83 LAK) | N/A (Pricing Engine API) |
| **PROBE-5B** | 6-Color/9-Mono Ink Oracle (Multi-Process) | Live HTTP API Probe | `POST /api/pricing/calculate` with 2 processes (6 color, 9 mono) | **PASS** (Exact 321.83 LAK) | N/A (Pricing Engine API) |
| **PROBE-6A** | Machinery Baseline (PRN-9614: 168.00 LAK) | Live HTTP API Probe | `POST /api/pricing/calculate` (90 depreciation + 78 maintenance) | **PASS** (Exact 168.00 LAK) | N/A (Pricing Engine API) |
| **PROBE-6B** | Direct Impression Baseline (217.96 LAK) | Live HTTP API Probe | `POST /api/pricing/calculate` (168 machinery + 49.96 ink) | **PASS** (Exact 217.96 LAK) | N/A (Pricing Engine API) |
| **PROBE-6C** | Odd Duplex & Imposition Decoupling | Go Unit Test Suite | `go test -v ./pricing -run "TestOddDuplex\|TestTwoUpA4OnA3"` | **PASS** (Go Pricing Tests) | **NOT VERIFIED** (Quotation UI Allocator browser re-check) |

---

## 3. Explicit Clarification on Test Limitations & Scope

### 3.1 Native UI Browser & Reopen Journeys (Marked NOT VERIFIED)
- **Observation:** As identified by Codex, Probe 1A & 1B are static AST checks, Probe 1C is a component-level Vitest unit test with simulated JSDOM, and Probe 1D only checks that `GET /api/orders` returns HTTP 200 with an array.
- **Clarification:** A full end-to-end browser automation run (e.g. Playwright navigating real Chromium instances to `http://127.0.0.1:5176/orders/:id/summary`, performing hard browser refresh, and asserting rendered DOM strings) was **NOT executed** during this correction cycle.
- **Status:** **NOT VERIFIED (Native Browser / Reopen Journey)**. The delivered UI changes are certified at the React component unit test level (`order-completed-summary-provenance.test.tsx`) and API contract level, awaiting full end-to-end browser certification by Codex QA.

### 3.2 Unrecoverable Historical Provenance Limitation
- **Observation:** In legacy orders created prior to Migration 049/050 where cost breakdown components (finishing, spoilage, labor, plate) were never recorded or were permanently zeroed out in historical databases, original values are physically unrecoverable.
- **Clarification:** Neither Migration 050 nor the Backend attempts to guess, reconstruct, or synthesize historical cost breakdowns.
- **Enforcement:**
  - Where actual cost fields are genuinely null or unrecorded, `realized_cost_status` is explicitly set to `UNKNOWN` and `realized_cost_provenance` to `HISTORICAL_UNKNOWN`. The UI truthfully displays `"ຍັງບໍ່ໄດ້ບັນທຶກ"` (Not Recorded) and suppresses fabricated profit margins.
  - Where costs were partially recorded, they are marked `PARTIAL / HISTORICAL_PRESERVED`.
  - Only genuine zero-cost transactions are preserved as `RECORDED / LEGITIMATE_ZERO`.

---

## 4. Raw Verification Outputs & Test Payloads

### 4.1 Probe 4A: Monotonic Density Curve Raw Output
```json
[
  { "density": 14.0, "inkCost": 13987.49 },
  { "density": 14.9, "inkCost": 14886.69 },
  { "density": 15.0, "inkCost": 14986.60 },
  { "density": 15.1, "inkCost": 15086.51 },
  { "density": 16.0, "inkCost": 15985.71 }
]
```
- **Monotonicity Metric:** Ratio $(14.9\% / 15.0\%) = 14886.69 / 14986.60 = 0.993333$
- **Delta:** Exactly $+99.91\text{ LAK}$ per $0.1\%$ coverage step. Zero heuristic cliff at $15\%$.

### 4.2 Probe 5: Mixed Color / Mono Ink Oracle Raw Output
- **Preflight Split (`POST /api/pricing/calculate`):**
  ```json
  {
    "ink_cost": 321.83,
    "ink_cost_cmy": 285.00,
    "ink_cost_k": 36.83,
    "page_count": 15,
    "color_pages_count": 6,
    "mono_pages_count": 9
  }
  ```
- **Multi-Process Routing (`POST /api/pricing/calculate`):**
  ```json
  {
    "ink_cost": 321.83,
    "ink_cost_cmy": 285.00,
    "ink_cost_k": 36.83
  }
  ```
- **Mathematical Oracle Match:** Exact match ($285.00 + 36.83 = 321.83\text{ LAK}$). The erroneous $891.83\text{ LAK}$ is completely eliminated.

### 4.3 Probe 3: Financial Reconciliation 409 Raw HTTP Output
- **Request:** `POST /api/orders/ORD-UNRECONCILED-01/payments/review` with `payment_opening_received_lak = 0` and no confirmed receipts.
- **Response:**
  ```json
  {
    "status": 409,
    "code": "LEGACY_MONEY_RECONCILIATION_REQUIRED",
    "message": "Order has an opening balance of 0 with unverified payments; audited reconciliation receipt record is required before approval"
  }
  ```

---

## 5. Frozen State & Next Steps

1. **No Code Mutations:** The application source code, configuration files, and database migrations remain completely frozen as indexed in `ae-recheck-20261020-manifest.json` (1,629 files).
2. **Current Delivery Status:** Remains **`ready_for_review`** (Awaiting Independent Codex Review & Final Browser Verification).
