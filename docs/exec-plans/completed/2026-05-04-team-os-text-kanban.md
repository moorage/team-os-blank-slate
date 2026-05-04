# Team OS Text Kanban for Codex

## Purpose / Big Picture

Turn this repository from a generic Codex harness into a self-describing Team OS workspace with a text-native kanban layer, linked product artifacts, generated status views, reusable Codex skills, and a native-app architecture that treats Git branches and pull requests as the only write path.

The problem is not just missing board views. The problem is fragmented memory: workflow state, product context, rationale, and history tend to live in different tools. The goal of this ExecPlan is to make this repository itself the durable operating surface, where:

- `kanban/` is the canonical workflow layer
- `product-development/` is the durable context layer
- `.agents/skills/` captures repeatable Codex workflows
- `apps/native/` defines how macOS and iOS clients can read and propose changes safely without creating a second datastore

This plan intentionally implements a complete first slice that is verifiable in-repo today. That means the text kanban is fully functional, while the native client work is implemented as a testable `TeamOSCore` Swift package plus documented shell scaffolding rather than a full Xcode app.

## Progress

- [x] 2026-05-04T17:20Z Milestone 1 — Promote the idea into an active ExecPlan and align the repository framing docs.
- [x] 2026-05-04T17:32Z Milestone 2 — Add the Team OS repository structure, kanban data, templates, docs, and generated views.
- [x] 2026-05-04T17:46Z Milestone 3 — Implement the TypeScript kanban CLI, validation, rendering, history, and tests.
- [x] 2026-05-04T17:50Z Milestone 4 — Add Codex skills, `TeamOSCore`, native-app scaffolding docs, and repository command integration.
- [x] 2026-05-04T18:00Z Milestone 5 — Run verification, refresh knowledge artifacts, update the implementation log, and close the plan.

## Surprises & Discoveries

- 2026-05-04: The repository started as a minimal harness with no existing runtime modules, so every Team OS path in this plan must be created from scratch instead of integrated into a pre-existing app.
- 2026-05-04: `scripts/knowledge/check_docs.py` auto-creates the active and completed ExecPlan directories, so adding the first plan was immediately compatible with the current docs harness.
- 2026-05-04: Swift 6.3.1 is available locally, which makes a real `swift test --package-path apps/native` gate feasible for the `TeamOSCore` layer.
- 2026-05-04: YAML frontmatter values were parsed as `Date` objects by default, so the kanban schemas had to normalize timestamps at the boundary before validation and rendering would work on canonical files.
- 2026-05-04: `npm install` inside `kanban/scripts` failed against the default user cache due to existing root-owned cache files, but succeeded cleanly with `--cache /tmp/team-os-npm-cache`.

## Decision Log

- 2026-05-04: Promote the idea now because the user explicitly asked for implementation and the repository can now host valid file paths and verification commands.
- 2026-05-04: Scope the first implementation to a complete text kanban plus a compile-and-test native core, not a full Xcode app, because the repository has no existing Apple app project and the harness can reliably verify SwiftPM but not a GUI app bundle.
- 2026-05-04: Keep generated kanban views in source control because they are part of the repo-native operator surface, but treat card files and event files as the only canonical state.
- 2026-05-04: Require native edits to pass through branch and PR abstractions even in scaffolding so the security model is encoded before any future UI adds write controls.
- 2026-05-04: Integrate Team OS commands into root `package.json` and `.codex/local-environment.yaml` so repository verification exercises the new feature surfaces instead of treating them as sidecar tooling.

## Context and Orientation

Current repository facts:

- `AGENTS.md` defines the repo workflow and requires an ExecPlan for non-trivial work.
- `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`, `docs/KANBAN_SCHEMA.md`, and `docs/NATIVE_APPS.md` now describe the active Team OS boundaries and operating model.
- `package.json` now exposes Team OS typecheck, test, validate, render, and repo-wide verify commands.
- `kanban/`, `product-development/`, and `apps/native/` now exist with sample data, validation tooling, and Swift native-core scaffolding.

Relevant files that will be created or updated in this plan:

- `README.md`
- `AGENTS.md`
- `package.json`
- `.codex/local-environment.yaml`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/RELIABILITY.md`
- `docs/QUALITY_LEDGER.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/product-specs/index.md`
- `docs/product-specs/team-os-text-kanban.md`
- `docs/KANBAN_SCHEMA.md`
- `docs/TEAM_OS_SPEC.md`
- `docs/OPERATING_RHYTHM.md`
- `docs/NATIVE_APPS.md`
- `docs/ideas/index.md`
- `docs/ideas/backlog/team-os-text-kanban.md`
- `kanban/AGENTS.md`
- `kanban/README.md`
- `kanban/boards/*.board.yaml`
- `kanban/cards/**`
- `kanban/templates/**`
- `kanban/views/**`
- `kanban/scripts/**`
- `product-development/**`
- `.agents/skills/kanban-*/SKILL.md`
- `.agents/skills/product-artifact-indexing/SKILL.md`
- `apps/native/README.md`
- `apps/native/Package.swift`
- `apps/native/TeamOSCore/Sources/TeamOSCore/**`
- `apps/native/TeamOSCore/Tests/TeamOSCoreTests/**`
- `apps/native/TeamOSMac/**`
- `apps/native/TeamOSiOS/**`

## Framing Notes

### Expert panel

- Architect — ensure the repo shape, file ownership, and validation boundaries stay coherent.
- Reliability engineer — ensure generated views are deterministic and state drift is visible.
- Security reviewer — ensure future native clients cannot silently write to the wrong repo or to the default branch.
- Workflow/UX reviewer — ensure ownership, assignee, reviewer, watcher, collaborator, and `sitting_with` semantics stay human-legible.

### What problem are we actually solving?

We are building a repository-native operating system for product work, where the workflow tracker and the durable context are stored together in inspectable text instead of split across tools and memory.

### Roundtable highlights

- Architect: stable card directories plus append-only events avoid history loss and merge-heavy board files.
- Reliability engineer: validation must write a human-readable report even when it exits non-zero so broken state is visible in diffs and PRs.
- Security reviewer: the native layer must model repo access gating and branch/PR writes now, otherwise later UI work will inherit an unsafe default.
- Workflow/UX reviewer: `owner`, `assignees`, and `sitting_with` must be distinct in both schema docs and rendered views or the system will become ambiguous immediately.

### Critique changes folded into this plan before coding

- Limit native implementation to `TeamOSCore` plus shell scaffolding that the repo can verify today.
- Require deterministic fixture-based tests for validation, rendering, history, branch naming, repo-access gating, and mutation planning.
- Add rollout and recovery notes to the acceptance section.
- Wire root repository commands to the new Team OS verification surfaces so the harness does not report green while the feature code is broken.

## Milestones

### Milestone 1 — Promote the brief and reframe the repository

Files:

- `docs/exec-plans/completed/2026-05-04-team-os-text-kanban.md`
- `docs/ideas/index.md`
- `docs/ideas/backlog/team-os-text-kanban.md`
- `README.md`
- `AGENTS.md`
- `docs/product-specs/index.md`
- `docs/product-specs/team-os-text-kanban.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/RELIABILITY.md`

Tasks:

1. Promote the idea brief to `promoted`.
2. Create the active ExecPlan and keep it updated while implementing.
3. Reframe the root docs so the repository clearly presents itself as Team OS plus its harness commands and invariants.
4. Add a product spec for the text kanban workflow and native write-gating expectations.
5. Replace the placeholder architecture, security, and reliability sections with repository-specific guidance.

Verification:

- `npm run verify:ideas`
- `npm run verify:docs`

### Milestone 2 — Create the Team OS repository structure and canonical sample data

Files:

- `kanban/AGENTS.md`
- `kanban/README.md`
- `kanban/boards/product-dev.board.yaml`
- `kanban/boards/bugs.board.yaml`
- `kanban/boards/launch.board.yaml`
- `kanban/cards/KAN-2026-0001/**`
- `kanban/cards/KAN-2026-0002/**`
- `kanban/templates/**`
- `kanban/views/**`
- `product-development/AGENTS.md`
- `product-development/feature-index.yaml`
- `product-development/product/AGENTS.md`
- `product-development/engineering/AGENTS.md`
- `product-development/analytics/AGENTS.md`
- `product-development/launches/AGENTS.md`
- linked product artifact docs under `product-development/**`
- `docs/KANBAN_SCHEMA.md`
- `docs/TEAM_OS_SPEC.md`
- `docs/OPERATING_RHYTHM.md`

Tasks:

1. Create the Team OS directory layout and nested `AGENTS.md` guidance.
2. Add board definitions, card templates, event templates, and comment templates.
3. Add realistic sample cards, events, comments, and linked product artifact placeholders.
4. Add the schema, operating-rhythm, and Team OS overview docs that explain how the text system works.
5. Leave `kanban/views/` ready for generated outputs, with committed outputs rendered from the sample data by Milestone 3.

Verification:

- `npm run verify:docs`

### Milestone 3 — Implement the kanban CLI and tests

Files:

- `kanban/scripts/package.json`
- `kanban/scripts/package-lock.json`
- `kanban/scripts/tsconfig.json`
- `kanban/scripts/src/cli.ts`
- `kanban/scripts/src/dates.ts`
- `kanban/scripts/src/history.ts`
- `kanban/scripts/src/ids.ts`
- `kanban/scripts/src/links.ts`
- `kanban/scripts/src/load.ts`
- `kanban/scripts/src/render.ts`
- `kanban/scripts/src/schemas.ts`
- `kanban/scripts/src/validate.ts`
- `kanban/scripts/test/**`

Tasks:

1. Implement schema validation for cards, boards, events, and comments.
2. Implement loaders that parse the Team OS files from disk and preserve event/comment chronology.
3. Implement validation rules for duplicate IDs, board/status mismatches, latest-event consistency, broken links, feature-index consistency, and WIP violations.
4. Implement renderers for board views, blocked work, sitting-with state, recently moved work, stale cards, shipped work, by-owner grouping, and validation errors.
5. Implement `history` and `standup` summaries plus deterministic fixture-based tests.
6. Render committed views from the sample repository state.

Verification:

- `npm --prefix kanban/scripts install`
- `npm --prefix kanban/scripts run typecheck`
- `npm --prefix kanban/scripts test`
- `npm --prefix kanban/scripts run validate`
- `npm --prefix kanban/scripts run render`

### Milestone 4 — Add reusable skills and native-core scaffolding

Files:

- `.agents/skills/kanban-create-card/SKILL.md`
- `.agents/skills/kanban-move-card/SKILL.md`
- `.agents/skills/kanban-add-comment/SKILL.md`
- `.agents/skills/kanban-link-artifact/SKILL.md`
- `.agents/skills/kanban-history-summary/SKILL.md`
- `.agents/skills/kanban-standup-summary/SKILL.md`
- `.agents/skills/product-artifact-indexing/SKILL.md`
- `apps/native/README.md`
- `apps/native/Package.swift`
- `apps/native/TeamOSCore/Sources/TeamOSCore/**`
- `apps/native/TeamOSCore/Tests/TeamOSCoreTests/**`
- `apps/native/TeamOSMac/README.md`
- `apps/native/TeamOSiOS/README.md`
- `docs/NATIVE_APPS.md`
- `package.json`
- `.codex/local-environment.yaml`

Tasks:

1. Add the kanban skills and ensure each points to the canonical repo paths plus the validate/render commands.
2. Create `TeamOSCore` with models for cards, events, comments, boards, repo access, branch sessions, pull request state, and mutation planning.
3. Add the required service protocols and placeholder implementations for GitHub-bound behavior.
4. Add repo-access gating, branch naming, and mutation-planning tests under SwiftPM.
5. Document the macOS and iOS shell approach and make it explicit that write controls are impossible without verified repo access.
6. Update root commands so Team OS tests, typechecks, validation, and render steps are discoverable from the harness.

Verification:

- `swift test --package-path apps/native`
- `npm run test:unit`
- `npm run typecheck`

### Milestone 5 — Verify, refresh, and close the loop

Files:

- `docs/exec-plans/completed/2026-05-04-team-os-text-kanban.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/generated/repo-map.json`
- `docs/QUALITY_LEDGER.md`

Tasks:

1. Run the narrow feature checks first, then the repo-wide verification commands.
2. Refresh generated knowledge artifacts after the tree and quality ledger changes.
3. Update the implementation log with exact commands run, evidence, and remaining risks.
4. Complete the ExecPlan `Progress`, `Decision Log`, `Surprises & Discoveries`, and `Outcomes & Retrospective`.
5. Move the plan from the active ExecPlan directory to the completed ExecPlan directory once every milestone is complete.

Verification:

- `npm run team-os:typecheck`
- `npm run team-os:test`
- `npm run team-os:validate`
- `npm run team-os:render`
- `npm run verify`
- `npm run verify:docs`
- `python3 scripts/check_execplan.py docs/exec-plans/completed/2026-05-04-team-os-text-kanban.md`

## Acceptance / Verification

Acceptance criteria:

- The repository contains a functioning text kanban under `kanban/` with stable card directories, append-only events, separate comments, templates, and generated views.
- The sample cards demonstrate the distinction between `owner`, `assignees`, and `sitting_with`, and link to durable product artifacts in `product-development/`.
- `product-development/feature-index.yaml` links to the sample work and validation checks that those references stay consistent.
- `kanban/scripts` can validate, render, summarize standup output, and show per-card history using deterministic tests.
- Codex skills exist for repeated kanban operations and point back to the canonical commands.
- `apps/native/TeamOSCore` compiles and tests successfully, including repo-access gating and branch/PR mutation planning.
- Native app documentation and shell scaffolding explicitly state that edits require verified repository access and must go through branches and pull requests.
- Root repository commands expose the Team OS checks so the harness can verify the new feature set directly.

Required commands:

- `npm --prefix kanban/scripts install`
- `npm --prefix kanban/scripts run typecheck`
- `npm --prefix kanban/scripts test`
- `npm --prefix kanban/scripts run validate`
- `npm --prefix kanban/scripts run render`
- `swift test --package-path apps/native`
- `npm run test:unit`
- `npm run typecheck`
- `npm run verify`
- `npm run verify:docs`
- `npm run verify:execplan`
- `npm run knowledge:refresh`

Rollout and recovery notes:

- The new repository structure is additive. Recovery is a revert of the Team OS directories, root command integrations, and documentation updates if the system proves too heavy.
- Generated views are always recoverable by rerunning `npm run team-os:render`.
- Validation errors are recoverable by fixing card/event/comment state and rerunning `npm run team-os:validate`.
- Native app write behavior remains safe-by-default because `TeamOSCore` models and docs do not permit default-branch writes or unauthenticated repo edits.

## Outcomes & Retrospective

- Implementation status: complete.
- What changed: the repository now contains a working text-native kanban, linked product-context corpus, reusable Codex skills, generated operator views, and a compile-and-test `TeamOSCore` Swift package that models repo-access gating plus branch/PR mutation planning.
- Verification evidence: `npm run team-os:typecheck`, `npm run team-os:test`, `npm run team-os:validate`, `npm run team-os:render`, `npm run knowledge:refresh`, `npm run verify`, and `python3 scripts/check_execplan.py docs/exec-plans/completed/2026-05-04-team-os-text-kanban.md` all passed before closeout.
- Remaining risks to monitor after implementation:
  - Native macOS and iOS shells are documented scaffolding rather than real app targets.
  - Real GitHub authentication and network-backed writes remain intentionally unimplemented in the first slice.
  - The first schema will likely need refinement once more card types and board policies are added.
  - Validation coverage will need to grow if external tracker sync or richer artifact policies are added later.
