---
name: agent-task-decomposer
description: Transforms QA analysis, system audit findings, or bug reports (such as from system-analyst-qa) into phased execution prompt files in Markdown for downstream AI agents. Use when the user asks to break down QA findings, generate phased task prompts, create agent prompt files, split audit fixes into execution phases, or write task markdown files into .agents/tasks/.
allowed-tools: client
---
# Agent Task Decomposer

Transforms QA audits, system analysis reports, and bug investigations into structured, phased Markdown prompt files for AI agents to execute sequentially with minimal token usage and zero regressions.

## When to Use

- After completing a system analysis, QA test cycle, or code audit (e.g. with system-analyst-qa).
- When preparing actionable task specifications for AI coding agents to implement fixes or features.
- When decomposing a complex multi-file bug or refactoring project into bite-sized execution phases.
- When creating prompt files inside the `.agents/tasks/` directory of a project.

## Core Responsibilities

1. **Token Economy**: Deconstruct large architectural fixes into isolated, bite-sized phases (e.g. Phase 1, Phase 2) so downstream agents focus only on immediate target files and tasks.
2. **Defensive Boundaries**: Explicitly define what files to edit (`Target Files`) and what code or modules must NOT be touched (`STRICT CONSTRAINTS`).
3. **Role Specialization**: Assign a concrete persona (e.g. Senior Full-Stack Engineer, Go backend engineer, React frontend specialist) tailored to each phase.
4. **Actionable Specifications**: Provide exact problem definitions, affected files, code signatures, and acceptance criteria rather than generic instructions.

## Workflow Steps

### 1. Ingest & Categorize Audit Findings

- Review the QA findings, bug reports, or recommendations from `system-analyst-qa` or system audits.
- Map out dependencies between issues (e.g. database schema/types -> backend API handlers -> frontend state/mappers -> UI presentation).
- Group fixes into sequential, logical phases:
  - **Phase 1: Data Contracts & Backend Foundations** (DB models, types, API endpoints, core calculations).
  - **Phase 2: Data Mapping & State Management** (API clients, mappers, stores, query hooks).
  - **Phase 3: User Interface & Component Integration** (Modals, forms, cards, user feedback).
  - **Phase 4: Verification, Polish & E2E Validation** (Edge cases, button labels, UI localization, cross-module sync).

### 2. Formulate Phase Constraints & Role Definition

For each identified phase, establish:

- **Role & Identity**: The technical domain and stack expertise needed (e.g. React 19 + TypeScript, Go Fiber + PostgreSQL).
- **Objective**: 2-3 sentences summarizing the exact goals of this phase.
- **Target Files to Modify**: Explicit, relative file paths that the agent is permitted to touch.
- **STRICT CONSTRAINTS (DO NOT TOUCH)**: Non-negotiable boundaries (e.g. core auth, unrelated pricing formulas, inventory deduction logic, database migrations not in scope).

### 3. Draft the Phased Prompt Markdown File

Structure each prompt file following this template:

```markdown
# Phase {N}: {Phase Title}

## 1. Role & Identity
{Targeted engineer persona and technology stack}

## 2. Objective
{High-level goal and key problems being solved}

---

## 3. Target Files to Modify
- `{path/to/file1}`
- `{path/to/file2}`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** {unrelated module or sensitive file}
- **DO NOT TOUCH** {critical business logic, e.g. pricing formulas or auth}
- {Any backwards compatibility or architectural rules}

---

## 5. Detailed Tasks & Implementation Instructions

### Task {N}.1: {Subtask Title}
- **Problem:** {Detailed explanation of the issue or requirement}
- **Action:**
  - {Step-by-step changes}
  - {Code snippet, interface definition, or function signature}

### Task {N}.2: {Subtask Title}
...

---

## 6. Verification & Acceptance Criteria
1. {Concrete, verifiable criteria 1}
2. {Concrete, verifiable criteria 2}
```

### 4. Save to Repository

- Save the generated prompt files directly into the target project's `.agents/tasks/` folder (e.g. `/Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/tasks/`).
- Use the standard naming convention: `PROMPT_PHASE{N}_{DESCRIPTIVE_UPPERCASE_NAME}.md` (e.g. `PROMPT_PHASE1_ORDER_DATA_AND_ITEMIZED_JOBS.md`).

## Gotchas & Guardrails

- **Avoid Monolithic Prompts**: Never lump backend, frontend, and schema changes into a single file unless the fix is trivial. Splitting preserves context window tokens and improves agent accuracy.
- **Enforce Negative Constraints**: Always specify what NOT to touch. Coding agents will often "clean up" or refactor surrounding code unless strictly forbidden.
- **Independent Verifiability**: Every phase must have acceptance criteria that can be checked immediately upon completion of that phase.
- **Preserve Business Logic**: When defining instructions for printing ERP systems (like Som Sing Phim), strictly protect core formulas (paper unit cost, ink coverage, depreciation, inventory stock deduction) unless the phase specifically targets them.
