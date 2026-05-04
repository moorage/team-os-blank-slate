# Team OS Text Kanban

## Status

- State: `implemented`
- Last updated: `2026-05-04`

## Problem

Team workflow state, product context, and historical rationale are usually spread across tools. This repository should let humans and Codex inspect and update the workflow spine and the linked product context from one durable text-first system.

## User-visible behavior

- `kanban/cards/**/card.md` stores the current state for each work item.
- `kanban/cards/**/events/*.yaml` stores append-only audit history for state changes and handoffs.
- `kanban/cards/**/comments/*.md` stores first-class comments as separate files.
- `kanban/views/*.md` provides generated summaries for board state, blocked work, stale work, recent movement, ownership, and validation output.
- `product-development/feature-index.yaml` links cards to durable artifacts such as PRDs, analytics notes, engineering plans, and bug investigations.
- Native app architecture is documented so future UI clients must verify repository access and write only through branches and pull requests.

## Non-goals

- no web UI
- no external database
- no direct default-branch writes from native clients
- no generated views treated as canonical state

## Acceptance

- `npm run team-os:typecheck` passes.
- `npm run team-os:test` passes.
- `npm run team-os:validate` passes and writes `kanban/views/validation-errors.md`.
- `npm run team-os:render` regenerates the committed views deterministically.
- `swift test --package-path apps/native` passes.
- `npm run verify` passes.
