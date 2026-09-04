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
- When diagnosing order lifecycle transitions, artwork file binding, quotation-to-order mapping, or multi-currency handling.
- When generating structured, phased execution prompt files in `.agents/tasks/PROMPT_PHASE{N}_*.md` for downstream AI coding agents.

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

### Step 3: Dependency Mapping and Phasing Strategy

Group fixes into sequential, logical phases:

- **Phase 1: Data Contracts and Backend Foundations** (DB models, Go structs, API endpoints, core calculation formulas).
- **Phase 2: Data Mapping and State Management** (API clients, mappers, stores, query hooks, data sanitization).
- **Phase 3: User Interface and Component Integration** (Modals, forms, cards, user feedback, responsive layout).
- **Phase 4: Polish, Localization, and E2E Validation** (Lao/Thai language keys, edge cases, boundary testing).

### Step 4: Compose Phased Prompt Files

For each phase, write a Markdown prompt file following this template:

```markdown
# Phase {N}: {Phase Title}

## 1. Role and Identity
{Targeted engineer persona and technology stack}

## 2. Objective
{High-level goal and specific problems solved}

---

## 3. Target Files to Modify
- `{path/to/file1}`
- `{path/to/file2}`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** {unrelated files or sensitive modules}
- **DO NOT TOUCH** {critical core formulas, auth, or migrations not in scope}
- {Compatibility and architectural guardrails}

---

## 5. Detailed Tasks and Implementation Instructions

### Task {N}.1: {Subtask Title}
- **Problem:** {Clear explanation of the issue}
- **Action:**
  - {Step-by-step modification}
  - {Interface, signature, or code example}

---

## 6. Verification and Acceptance Criteria
1. {Concrete, verifiable criteria}
2. {Expected UI or data behavior}
```

### Step 5: Save Task Files to Repository

- Save all generated files into `.agents/tasks/` in the project root.
- Follow the naming standard: `PROMPT_PHASE{N}_{DESCRIPTIVE_UPPERCASE_NAME}.md`.
- Present a clear summary of findings and the generated phases to the user.

## Gotchas and Guardrails

- **Enforce Negative Constraints:** Always explicitly state what downstream agents must NOT touch.
- **Preserve Business Logic:** Never alter core pricing formulas or inventory deduction logic unless the task specifically targets them.
- **Independent Verifiability:** Each phase must have clear acceptance criteria that can be validated before proceeding to the next phase.
