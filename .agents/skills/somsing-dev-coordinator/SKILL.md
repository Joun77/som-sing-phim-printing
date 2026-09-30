---
name: somsing-dev-coordinator
description: Coordinate implementation in Antigravity for the Som Sing Phim printing project. Select existing specialist skills, maintain a shared task, and hand off evidence to Codex for independent review. Use for Som Sing Phim feature development and bug fixes requiring development coordination.
---

# Som Sing Phim development coordinator

Operate inside the Som Sing Phim project. Antigravity owns development; Codex owns independent review. There are two work-owning sides. Specialist skills are instructions you load as needed, not a requirement to launch additional agents.

Read `.agents/rules/somsing-coordinator/SKILL.md` and applicable project rules. Reuse existing tasks in `.agents/tasks/` when they match the request. Preserve existing edits and capture a baseline before implementation. Keep one task owner per shared task; avoid overlapping edits from another active task.

## Select the relevant capability

Choose one primary skill and additional skills only where scope actually crosses domains. Read the actual `SKILL.md` from these folders; folder names may differ from frontmatter names.

| Task | Folder under `.agents/skills/` |
| --- | --- |
| Pricing, material consumption, BOM | `somsing-formula-analyst` |
| Business workflow and order states | `somsing-system-analyzer` |
| Database schema, migration, integrity | `db-analyst` |
| Go API, services, transactions | `backend-developer` |
| React UI, state, API wiring | `frontend-developer` |
| Layout, interaction, visual consistency | `somsing-ui-ux-designer` |
| Authentication, permissions, uploads | `somsing-security-specialist` |
| Integration and delivery preparation | `somsing-delivery-lead` |
| Development-side checks | `somsing-qa-orchestrator` |

## Shared task and execution

Before code changes, create or update the task according to the project coordinator rule. Record outcome, relevant skills, scope, constraints, and observable acceptance checks. For cross-layer features, implement a complete feature slice; a UI-only fix need not change the database or API.

Use these statuses: `planned`, `implementing`, `ready_for_review`, `changes_requested`, `verified`, `blocked`. Antigravity updates implementation status and evidence; Codex owns review findings, `verified`, and final archiving. Where older delivery/QA instructions imply local sign-off, treat that as development pre-check only in this two-side workflow.

Understand the actual flow and reuse existing code/components before adding dependencies or abstractions. Preserve explicitly requested behavior and meaningful checks. Do not automatically install Caveman, Ponytail, SkillRouter, or other external skills. Load optional installed skills only if they improve this task and do not conflict with project rules.

Use project build commands, Go tests, Vitest and targeted API checks. Do not introduce Playwright by default; existing rules differ on optional E2E use. Report any browser-check gap rather than claiming it passed.

## Deliver to Codex

Set `ready_for_review` only after recording:
- Changed files and the baseline/revision or uncommitted snapshot being delivered.
- Behavior implemented against each acceptance criterion.
- Checks actually run, their results, and checks not run.
- Migration/data implications and known gaps when relevant.

Add a delivery section to the existing task. Do not overwrite Codex review sections or archive the task yourself. Supply a short handoff: task path, primary skill, scope, and evidence to inspect. Send to Codex only through an available authorized mechanism; otherwise provide the copyable handoff and state that it has not been sent. File writes alone do not start Codex.

On `changes_requested`, reproduce the reported issue, fix within task scope, rerun affected checks, and update delivery evidence for another Codex review. If blocked, record the actual missing input or environment capability. Do not report completion without Codex independent verification.

## One phase per handoff

For substantial work, keep an overall phase list in the existing task file, but dispatch only the current phase to Antigravity. A phase has one observable outcome, bounded code scope, prerequisites, selected skills, acceptance checks, and explicit deferred work. Split independent outcomes into separate phases. Complete a small end-to-end behavior across DB/API/UI where needed; do not group unrelated modules simply because they share a technology.

Allow only one implementation phase active at a time. Antigravity stops at `ready_for_review` and reports evidence; Codex verifies that phase before releasing the next one. Verification releases the next already-authorized phase without a new human approval requirement. If `changes_requested`, dispatch only the corrections for the current phase. Do not start later phases to work around unfinished failures. Archive the overall task only after every required phase is verified.

If a phase expands beyond its agreed outcome, keep completed work, record discoveries and gaps, and divide remaining work into smaller phases. Do not quietly omit requirements or declare a partial outcome complete. A blocked phase may be followed by an independent planned phase only when the coordinator records the dependency analysis and the reason for reordering.

Each handoff names the task path and phase ID, one-sentence outcome, primary skill, relevant files/modules, acceptance checks, deferred scope, and the stop condition: deliver this phase for Codex review. Later phases are background context, not execution instructions.

## Optional skills by stage

- Planning with Files: for substantial multi-phase work, if installed. Use the project task as the authoritative phase ledger; supporting findings/progress files may supplement it but must not become a conflicting plan.
- Ponytail lite: optional implementation guidance if installed; reuse existing solutions while preserving requested behavior and acceptance checks.
- Caveman lite: optional concise user reporting if installed. Keep failures, evidence and limitations visible; shared task records remain clear normal prose.
- Strategic Compact: optional checkpoint advice if installed and supported by the host. Save delivery/review state, next phase and unresolved decisions before compaction; prefer a verified phase boundary, not mid-implementation.
- SkillRouter: not required for this small project skill catalog. Select from the existing matrix.

Codex commands complement these skills: `/plan` for defining substantial work; `/review` for code review plus the task-specific verification; `/goal` only for an explicitly requested durable outcome scoped to Codex coordination/review; `/compact` only through supported host mechanisms. Do not claim a Markdown skill invokes a native command or controls another app automatically. Do not create a Goal from an ordinary task request alone.
