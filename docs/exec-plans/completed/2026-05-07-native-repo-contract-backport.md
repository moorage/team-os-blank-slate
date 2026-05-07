# Native Repo Contract Backport

## Purpose / Big Picture
`team-os-blank-slate` now shares the same Apple client as `team-os-souschefstudio`, but its repository-facing Team OS contract is still behind the app-era changes that landed in `team-os-souschefstudio`. The goal is to backport the markdown, YAML, and supporting CLI/schema surfaces that the shared native app now expects, while preserving `team-os-blank-slate` as the generic reference repo instead of copying Sous Chef branding.

## Progress
- [x] 2026-05-07T01:00Z Milestone 1 — Inspect `team-os-souschefstudio` history and current runtime drift to identify the repo contract changes.
- [x] 2026-05-07T01:06Z Milestone 2 — Backport the shared Team OS schema, sample canonical files, and maintainer docs into `team-os-blank-slate`.
- [x] 2026-05-07T01:08Z Milestone 3 — Verify the repo-side Team OS tooling and native package still pass in `team-os-blank-slate`.

## Surprises & Discoveries
- 2026-05-07: `team-os-souschefstudio` has uncommitted runtime mutations in `kanban/cards/KAN-2026-0001/card.md`, `kanban/views/recently-moved.md`, and two append-only event files from the native app run. The user explicitly asked to treat those changes as source material.
- 2026-05-07: `team-os-blank-slate` is missing the repo-side native bridge (`kanban/scripts/src/native.ts`) and the related CLI/schema updates that make the shared Apple client's repository mutations work.
- 2026-05-07: The blank-slate repo still carries the older generated repo-map workflow, while `team-os-souschefstudio` removed it and updated docs/tooling accordingly.

## Decision Log
- 2026-05-07: Use `team-os-souschefstudio` committed history plus the current runtime drift as the source of truth for repo-facing Team OS changes, because the user wants both the landed app contract and the latest live canonical state reflected in the backport.
- 2026-05-07: Backport current shared contract files directly instead of replaying every historical commit, because the important requirement is final schema/tooling alignment in `team-os-blank-slate`, not preserving identical commit ancestry.
- 2026-05-07: Preserve `team-os-blank-slate` identity in tenant-specific files such as the top-level repo name and installer framing, while copying generic Team OS docs, schema rules, scripts, and sample content.

## Context and Orientation
- Source repo: the sibling `team-os-souschefstudio` checkout
- Target repo: this repository
- History reviewed: `5e5d4a8`, `b369c7b`, `3ff4128`, `397d072`, `9da4160`, plus the current uncommitted runtime changes to `kanban/cards/KAN-2026-0001/` and `kanban/views/recently-moved.md` in the source checkout
- Shared repo-contract surfaces expected by the native app:
  - `kanban/scripts/src/*.ts`
  - `kanban/scripts/test/*.ts`
  - `kanban/scripts/package.json`
  - `kanban/boards/*.board.yaml`
  - `kanban/cards/**/card.md`
  - `kanban/cards/**/events/*.yaml`
  - `kanban/views/*.md`
  - `team/README.md`
  - `team/people/*.yaml`
  - `docs/KANBAN_SCHEMA.md`
  - `docs/RELIABILITY.md`
  - `docs/TEAM_OS_SPEC.md`
  - `docs/GITHUB_APP_SETUP.md`
  - `docs/product-specs/team-os-native-apps.md`
  - `docs/product-specs/team-os-text-kanban.md`
- Maintainer/tooling alignment also needs:
  - `AGENTS.md`
  - `package.json`
  - `scripts/knowledge/check_docs.py`
  - `scripts/git-hooks/pre-commit.mjs`
  - removal of the checked-in repo-map artifact and obsolete repo-map generator script

## Milestones

### Milestone 1 — Inspect source contract
Files:
- `docs/PLANS.md`
- `kanban/`
- `team/`
- `docs/`
- `kanban/scripts/`

Tasks:
1. Compare `team-os-souschefstudio` history and current runtime state against `team-os-blank-slate`.
2. Separate tenant-specific content from shared Team OS schema/tooling.
3. Record the exact files that define the current native app repository contract.

Verification:
- `git -C ../team-os-souschefstudio log --oneline --decorate -n 12`
- `git diff --no-index --stat kanban ../team-os-souschefstudio/kanban`

### Milestone 2 — Backport shared contract
Files:
- `kanban/scripts/`
- `kanban/boards/`
- `kanban/cards/`
- `kanban/views/`
- `team/`
- `docs/`
- `AGENTS.md`
- `package.json`
- `scripts/knowledge/check_docs.py`
- `scripts/git-hooks/pre-commit.mjs`

Tasks:
1. Copy the generic native-bridge and schema/render/validation changes into `kanban/scripts/`.
2. Backport the current canonical board/card/event/view/team sample files and schema docs.
3. Remove the stale generated repo-map contract and add the missing GitHub App setup documentation.

Verification:
- `git diff --stat`

### Milestone 3 — Verify target repo
Files:
- `kanban/scripts/`
- `apps/native/`
- `docs/exec-plans/active/2026-05-07-native-repo-contract-backport.md`

Tasks:
1. Run the Team OS repo validation and test suite in `team-os-blank-slate`.
2. Run the shared native package tests against the target repo.
3. Update this ExecPlan with the actual outcome and move it to completed when done.

Verification:
- `npm run team-os:typecheck`
- `npm run team-os:test`
- `npm run team-os:validate`
- `npm run team-os:render`
- `npm run verify:docs`

## Acceptance / Verification
- `team-os-blank-slate` can export and mutate canonical Team OS state through the repo-side native bridge commands in `kanban/scripts/package.json`.
- The blank-slate Team OS sample files include the current schema fields the shared native app expects: card emoji, `column_order`, board emoji, column emoji, dual-theme lane colors, team-directory emoji/profile-image metadata, and append-only status/sitting-with events.
- The blank-slate docs describe the current schema and maintainer GitHub App workflow without referencing the removed generated repo map.
- `npm run team-os:typecheck`, `npm run team-os:test`, `npm run team-os:validate`, `npm run team-os:render`, and `npm run verify:docs` pass in `team-os-blank-slate`.

## Outcomes & Retrospective
- `team-os-blank-slate` now carries the same repo-side Team OS contract as the shared native app and the `team-os-souschefstudio` tenant checkout: the native export/mutate CLI bridge, board/card/team schema additions, sample append-only events, and maintainer GitHub App documentation are all present locally.
- The older blank-slate-only generated repo-map workflow is removed from docs and automation, matching the current Team OS maintenance flow.
- Verification passed with `npm run team-os:typecheck`, `npm run team-os:test`, `npm run team-os:validate`, `npm run team-os:render`, and `npm run verify:docs`.
