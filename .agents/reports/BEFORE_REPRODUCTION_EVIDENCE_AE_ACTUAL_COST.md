# Independent Before-Reproduction Evidence: AE-ACTUAL-COST-CORRECTION

**Timestamp:** 2026-10-22T02:41:30+07:00  
**Role:** Independent QA Owner (`6db59a2d-96c5-4580-95e3-3b87f569c103`)  
**Round:** AE-ACTUAL-COST-CORRECTION  
**Target Git Working Directory:** `/Users/joun/Documents/GitHub/som-sing-phim-printing`

---

## 1. Executive Summary

Prior to any application code modification by developers, Independent QA has independently reproduced and confirmed both reported defects on the current unchanged codebase:

| Defect ID | Target Component | Reproduction Test File | Expected Behavior | Actual BEFORE Behavior | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Defect 1 (R20-01)** | `backend/finance/handlers.go` (`HandleGetJobProfitability`) | `admin-system/backend/finance/codex_zero_actual_test.go` | Complete explicitly recorded zero costs remain complete (`actual_cost_complete: true`, `actual_cost: 0.00`, `gross_profit: 1000.00`) | Rejects zero: returns `actual_cost: null`, `actual_cost_complete: false`, `gross_profit: 0` | **CONFIRMED DEFECT (FAIL)** |
| **Defect 2 (R20-02)** | `frontend/.../OrderCompletedSummaryPage.tsx` | `admin-system/frontend/tests/summary-provenance-with-codex-case.test.tsx` | Inconsistent PARTIAL costs (status `PARTIAL`, components $100+100+100 \neq 100$) must NOT display finalized 90.0% margin | Treats cost as complete: renders finalized `COGS LAK 100.00`, `Gross Profit LAK 900.00`, `Margin 90.0%` | **CONFIRMED DEFECT (FAIL)** |

---

## 2. Defect 1 Reproduction Log (Backend)

**Command:**
```bash
cd admin-system/backend && go test -v ./finance -run TestCodexCompleteZeroActualCost
```

**Verbatim Terminal Output:**
```
=== RUN   TestCodexCompleteZeroActualCost
    codex_zero_actual_test.go:9: Complete explicitly recorded zero costs must remain complete; actual response={"data":[{"id":"codex-zero","order_id":"codex-zero","job_id":"codex-zero","job_name":"Print Job #codex-zero","customer_name":"Fixture","revenue":1000,"estimated_cost":0,"actual_cost":null,"actual_cost_complete":false,"actual_cost_status":"INCOMPLETE","cost_completeness":"INCOMPLETE","total_cost":0,"gross_profit":0,"profit_margin_percent":0,"completed_date":"2026-10-20"}],"status":"success"}
--- FAIL: TestCodexCompleteZeroActualCost (0.00s)
FAIL
FAIL	somsing.local/backend/finance	0.425s
FAIL
```

**Root Cause Location in Source:**
`admin-system/backend/finance/handlers.go:726`:
```go
if !sumParts.Equal(totalDec) || totalDec.IsNegative() || totalDec.IsZero() {
    complete = false
}
```
The check `totalDec.IsZero()` unconditionally sets `complete = false` whenever total actual cost is 0.00, regardless of whether all 5 itemized costs are legitimately 0.00 and status/provenance is `RECORDED / LEGITIMATE_ZERO`.

---

## 3. Defect 2 Reproduction Log (Frontend)

**Command:**
```bash
cd admin-system/frontend && npx vitest run tests/summary-provenance-with-codex-case.test.tsx
```

**Verbatim Terminal Output:**
```
 FAIL  tests/summary-provenance-with-codex-case.test.tsx > Codex: PARTIAL costs whose components disagree with total must not show finalized profit
AssertionError: expected '...ຕົ້ນທຶນຜະລິດຕົວຈິງ (COGS)LAK 100.00...ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)LAK 900.00...ອັດຕາກຳໄລຂັ້ນຕົ້ນ (Margin %)90.0%Margin ສູງມາດຕະຖານ...' to not contain '90.0%'

 ❯ tests/summary-provenance-with-codex-case.test.tsx:328:20
    326|   await act(async () => { root.render(<AppProvider><OrderCompletedSummaryPage order={order} onBack={vi.fn()} onSelectStep={vi.fn()} formatLAK={formatLAK} currentLang="lo" /></AppProvider>); });
    327|   const text=container.textContent||'';
    328|   expect(text).not.toContain('90.0%');
       |                    ^
    329| });

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  02:41:14
   Duration  1.61s
```

**Root Cause Location in Source:**
`admin-system/frontend/src/features/orders/components/OrderCompletedSummaryPage.tsx:214-218`:
```tsx
const hasActualCost = (
  order.actual_cost_complete === true || 
  order.actual_cost_status === 'COMPLETE' || 
  order.cost_completeness === 'COMPLETE'
) || (allComponentsRecorded && hasRealizedTotal);
```
`allComponentsRecorded && hasRealizedTotal` evaluates to `true` when all numbers are non-null, completely bypassing `order.realized_cost_status === 'PARTIAL'` and ignoring internal sum discrepancies ($100+100+100 \neq 100$).

---

## 4. Next Step Handoff

Both defects are reproducibly locked in before-test suites. Independent QA will standby for the joined package fix delivered by Frontend and Backend specialists, then execute the full 8-criteria acceptance suite on isolated ports `55690`, `55432`, and `5176`.
