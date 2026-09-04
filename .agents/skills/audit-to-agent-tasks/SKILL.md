---
name: audit-to-agent-tasks
description: Conducts an end-to-end QA audit on a codebase and decomposes findings into structured, phased Markdown prompt files in .agents/tasks/. Use when the user asks to audit a module and generate agent task prompts, perform full-cycle system analysis with actionable task breakdowns, or turn QA findings directly into phased execution files.
allowed-tools: client
---
# Audit to Agent Tasks

An end-to-end pipeline that combines system architecture auditing, QA analysis, and phased task decomposition. Audits target modules, diagnoses defects, and produces self-contained prompt files for AI agents in `.agents/tasks/`.

## When to Use

- When the user asks for a comprehensive audit of a feature, module, or codebase that must result in actionable implementation tasks.
- When transforming detected runtime errors, schema mismatches, or architectural flaws into phased prompt specifications.
- When automating the workflow from problem discovery to `.agents/tasks/PROMPT_PHASE{N}_*.md` file generation.

## Workflow Steps

### Step 1: System Architecture and Module Inspection

- Identify the target codebase stack, routing entry points, state management layers, and API boundaries.
- Trace data contracts, database models, and API schema parity across backend and frontend layers.
- Check environment variables, input sanitization, error boundaries, and race conditions.

### Step 2: QA and Defect Diagnosis

- Inspect core workflows across relevant user roles and portals.
- Identify bugs, edge cases, and architectural regressions with exact file paths and line numbers.
- Verify business logic integrity (e.g. calculation engines, inventory deductions, state machine transitions).
- Document each finding with severity (Critical, High, Medium, Low), root cause, and concrete resolution.

### Step 3: Dependency Mapping and Phasing Strategy

- Map dependencies between identified issues (Data contracts -> API/Backend -> State/Mappers -> UI/Components -> Verification).
- Group fixes into sequential, logical phases:
  - Phase 1: Data Contracts and Backend Foundations (schemas, models, endpoints, core logic).
  - Phase 2: State Management and Data Mapping (API clients, stores, mappers, query hooks).
  - Phase 3: User Interface and Component Integration (views, modals, forms, user feedback).
  - Phase 4: Polish, Edge Cases, and E2E Verification (boundary testing, localization, cross-module sync).

### Step 4: Generate Phased Prompt Files

For each phase, compose a self-contained Markdown prompt following this structure:

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

- Write generated prompt files directly into `.agents/tasks/` in the project root.
- Follow the naming standard: `PROMPT_PHASE{N}_{DESCRIPTIVE_UPPERCASE_NAME}.md`.
- Present a concise executive summary of the audit findings and the generated phases to the user.

## Gotchas and Guardrails

- Enforce strict negative constraints ("DO NOT TOUCH") to prevent downstream agents from refactoring out-of-scope code.
- Keep each phase isolated to avoid context exhaustion and regressions.
- Every phase must contain verifiable acceptance criteria that can be checked independently.
- Always preserve critical domain calculations and formulas unless the audit specifically targets them.
