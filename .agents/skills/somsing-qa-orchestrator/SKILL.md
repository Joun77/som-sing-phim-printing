---
name: somsing-qa-orchestrator
description: Audits the Somsin Printing (Som Sing Phim) ERP ecosystem, verifies business logic and pricing formulas, diagnoses bugs, and decomposes findings into structured, phased execution prompt files in .agents/tasks/. Use when the user asks to audit a module in Som Sing Phim, run QA verification on printing workflows, or generate phased implementation tasks for AI agents.
allowed-tools: client
---
# Somsin QA Orchestrator

End-to-end QA auditing, domain verification, and phased task decomposition specifically tailored for the Somsin Printing (Som Sing Phim) ERP ecosystem.

## When to Use

- When auditing modules, features, or workflows in Som Sing Phim Printing (Admin ERP, Customer Service, or Go backend).
- When verifying printing domain formulas (paper unit cost, ink coverage, machine depreciation, inventory moving average cost).
- When diagnosing order lifecycle transitions, artwork file binding, quotation-to-order mapping, or multi-currency handling).
- When generating structured, phased execution prompt files in `.agents/tasks/TASK_{FEATURE}.md` for downstream AI coding agents.
- When verifying completed tasks, running unit tests, and archiving completed task files from `.agents/tasks/` into `.agents/reports/`.

## Somsin Printing Domain Guardrails

### 1. Pricing and Cost Engine Formulas

- **Paper Unit Cost:**
  `Unit Cost (LAK/Sheet) = Total Import Cost / (Pack Count * Sheets Per Pack)`
- **Ink Cost Formula:**
  `Ink Cost = Coverage % * 0.007 * Ink Cost per ml * Total Sheets`
- **Machine Overhead:**
  `Depreciation per Sheet = Purchase Price / Expected Lifetime Pages`
  `Maintenance per Sheet = Depreciation * (Maintenance Rate % / 100)`
  `Total Base Cost = Paper + Ink + (Machine Cost per Sheet * Total Sheets) + Finishing/Labor`

### 2. Order Lifecycle and State Machine

Order state flow:
`PENDING_SLIP_CHECK` -> `PAID_PREPRESS` -> `PREPRESS_CHECK` -> `WAITING_APPROVAL` -> `PROOF_REJECTED` -> `FILE_CONFIRMED` -> `READY_TO_PRINT` -> `IN_PRODUCTION` -> `POST_PRESS` -> `SHIPPED` -> `DELIVERED`

- Digital Proof sync: Customer Service `TrackingPage` <-> Admin `ArtworkPrepressCard`.
- Multi-Item Jobs: 1 quotation item = 1 order job item. Never allow raw material cutting tickets (Parent Sheets) to become standalone ghost jobs.
- Artwork Binding: Maintain 1:1 artwork binding per job item.

### 3. Inventory and Inbound Lifecycle

- Single-Record Master Integrity: 1 row per SKU in `materials`.
- Dynamic Moving Average Cost calculation on stock inbound.
- Zero-stock retention: Update status to `OUT_OF_STOCK` on zero quantity without deleting records.

### 4. UI and Localization Standards

- **No Emojis:** Strictly use Lucide icons (`lucide-react`).
- **Lao Primary UI:** All client-facing text in Admin and Customer Service must default to Lao (`lo`) terminology.
- **Decimal Safety:** Round LAK to integer (0 decimals) and THB to 2 decimal places.

## End-to-End Workflow

### Step 1: System Architecture and Module Inspection

- Identify the target layers:
  - Admin ERP: `admin-system/frontend/src/` (React 19, TanStack Query, Zustand)
  - Customer Service: `customer-service/src/` (React 18, PWA, Three.js)
  - Backend Services: `backend/internal/` and `admin-system/backend/` (Go Fiber / Net-HTTP, PostgreSQL)
- Verify data contract parity between Go models and TypeScript interfaces.
- Inspect routes, state management, API endpoints, and database models.

### Step 2: QA Defect Diagnosis and Scenario Testing

- Check core workflows for Admin, Reception, Prepress, Production, and Customer roles.
- Formulate scenario-based test cases (positive, negative, boundary, and permissions).
- Identify bugs, edge cases, and schema mismatches with exact file paths and line numbers.
- Categorize findings by severity: Critical, High, Medium, Low.

### Step 3: Feature-Driven Phasing Strategy (Vertical Slicing)

- **Do NOT slice horizontally** by tech layer (Phase 1 DB, Phase 2 API, Phase 3 UI) as this wastes token context and creates integration friction.
- **Group tasks into complete vertical slices per problem/feature:**
  - **Phase 1: Core Priority Problem** (e.g. Printer Dashboard Data Incompleteness) -> Includes full-stack delivery:
    - 🗄️ Database: Schema migrations, missing columns
    - ⚙️ Backend: API handlers, pricing services
    - 🎨 Frontend: UI components, data tables, responsive cards
  - **Phase 2: Secondary Feature or Workflow Enhancement** (Next cohesive problem slice)
- Every phase must deliver an independently testable, working feature slice.

### Step 4: Compose Phased Task Files

Before coding begins, compose the structured Task File following this template in `.agents/tasks/TASK_{FEATURE}.md`:

```markdown
# Task: {Feature / Problem Title}

## 1. Problem & Objective
- **Problem:** {Clear explanation of the issue}
- **Objective:** {High-level goal and expected end-to-end outcome}

## 2. Phase Breakdown (Complete Full-Stack Slices)
### Phase 1: {Core Feature Name}
- 🗄️ **Database:** {Exact tables, migrations, constraints}
- ⚙️ **Backend:** {Handlers, services, calculation engine}
- 🎨 **Frontend:** {UI components, hooks, table columns}

## 3. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** {unrelated files or sensitive modules}
- **DO NOT TOUCH** {critical core formulas or auth not in scope}

## 4. Verification and Acceptance Criteria
1. {Concrete, verifiable criteria}
2. {Expected UI or data behavior}
```

### Step 5: Verification and Task Archiving (Tasks -> Reports)

1. **Strict Verification Check:**
   - Compile Check: `go build ./...` and `npm run build` (or `tsc --noEmit`)
   - Unit Tests: Run `go test ./...` and `npm run test:unit:frontend` (Vitest)
2. **Task Archiving Workflow:**
   - When all acceptance criteria and tests pass 100%:
   - Move the completed task file from `.agents/tasks/TASK_{NAME}.md` to `.agents/reports/REPORT_{NAME}.md`
   - In the report file, append the execution summary: Changes Made, Unit Test Results, Verification Status, and Final Sign-off
   - Notify `somsing-coordinator` that the phase is certified complete so Coordinator can deliver the final briefing to the user.

## Gotchas and Guardrails

- **Strict Rule: Never start coding before the task file in `.agents/tasks/` is finalized.**
- **Enforce Negative Constraints:** Always explicitly state what downstream agents must NOT touch.
- **Preserve Business Logic:** Never alter core pricing formulas or inventory deduction logic unless the task specifically targets them.
- **Strict Testing Policy (No Playwright):**
  - **Unit Testing:** ห้ามสั่งรันหรือติดตั้ง Playwright โดยเด็ดขาด ให้ใช้ `go test` หรือ `vitest` เท่านั้น
  - **Fast & Reliable:** การทดสอบความถูกต้องของระบบให้ใช้ Compile Check (`go build`, `npm run build`), Unit Tests และ Direct API Verification
