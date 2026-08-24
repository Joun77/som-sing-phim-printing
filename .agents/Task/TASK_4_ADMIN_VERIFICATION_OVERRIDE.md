# Phase 4 - Task 4: Admin Pre-flight Verification & Override Management

## Objective
Develop the Admin verification dashboard in `somsingphim` using React and TypeScript. Display detailed pre-flight scan results (page count, DPI, raw CMYK channels, TAC %), provide manual override tools with real-time recalculation, and persist complete audit trails.

## Target Files
- `src/types/adminVerification.ts` (Create)
- `src/components/admin/PreFlightVerificationCard.tsx` (Create)
- `src/components/admin/CoverageChannelBreakdown.tsx` (Create)
- `src/components/admin/ManualOverrideModal.tsx` (Create)
- `src/pages/admin/OrderDetailVerificationPage.tsx` (Create)

## Technical Requirements

### 1. Verification Data Contracts (`src/types/adminVerification.ts`)
- Interfaces for `InternalCostAudit`, `RawChannelCoverage` (C, M, Y, K, TAC), `OverrideHistoryLog`.

### 2. Admin Telemetry Views (`src/components/admin/`)
- `PreFlightVerificationCard.tsx`:
  - Show verification badge (`Auto-Verified`, `Pending Manual Verification`, `Admin Overridden`).
  - Google Drive source link, file size (MB), detected page count, and scanning log messages.
- `CoverageChannelBreakdown.tsx`:
  - Visual channel progress bars for $C\%$, $M\%$, $Y\%$, $K\%$, and total $TAC\%$.
  - Color-coded indicator for heavy TAC (> 240% ink limit warning).

### 3. Manual Override Tool (`src/components/admin/ManualOverrideModal.tsx`)
- Editable inputs for Actual Page Count and Actual CMYK TAC %.
- Real-time price recalculation button invoking `POST /api/v1/admin/orders/:id/override-pricing`.
- Action buttons: "Confirm & Approve Production" and "Request Drive Permission".
- Audit trail display showing previous scan values vs. new admin overrides.

## Constraints & Output Rules
- Full type safety in TypeScript.
- Clean integration with existing Admin design system and modal components.

---

### 🚀 IDE Execution Prompt (Copy & Paste to IDE Assistant)
> "Act as a senior frontend engineer. Implement Phase 4 Task 4 based on the specification above. Create `src/types/adminVerification.ts`, `src/components/admin/PreFlightVerificationCard.tsx`, `src/components/admin/CoverageChannelBreakdown.tsx`, `src/components/admin/ManualOverrideModal.tsx`, and `src/pages/admin/OrderDetailVerificationPage.tsx` in `somsingphim`. Implement the pre-flight telemetry view with full CMYK/TAC metrics, manual override form with recalculation, and audit history."
