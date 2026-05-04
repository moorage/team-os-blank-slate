# Team OS text kanban for Codex

## Snapshot

- Status: `promoted`
- Priority lane: `now`
- Impact: `high`
- Confidence: `medium`
- Effort: `high`
- Last reviewed: `2026-05-04`

## Why this matters

Product-development context, workflow state, and historical rationale are easy to fragment across docs, chat, issue trackers, and people. That fragmentation creates a routing and memory bottleneck, makes handoffs brittle, and leaves Codex without a durable repo-native workflow spine. A text-based kanban embedded in the same repository as the product knowledge would make work state, audit history, and linked artifacts inspectable and automatable from one place.

## Current evidence

- The draft proposes a repository-native operating model where cards, comments, events, and generated views all live as text.
- The repo harness already prefers layered `AGENTS.md`, durable docs, and Codex-friendly workflows over hidden context.
- The draft identifies concrete operational gaps: ownership vs. handoff ambiguity, scattered artifact links, and poor historical visibility into why work moved.
- The proposal also defines validation needs up front, which matches the repo bias toward preventing documentation drift instead of relying on convention.

## Proposed direction

Create a `team-os/` structure where:

- `kanban/` stores stable card directories, append-only events, separate comment files, board definitions, templates, and generated views.
- `product-development/` stores the durable product context linked from cards, including PRDs, engineering plans, analytics artifacts, and launch docs.
- `.agents/skills/` carries repeatable Codex workflows for creating cards, moving work, linking artifacts, and summarizing history.
- validation and rendering scripts keep the text system consistent and make stale or invalid workflow state obvious.
- future native macOS and iOS/iPadOS clients act as Git and pull-request frontends rather than introducing a second datastore.

The raw draft has now been promoted into the active ExecPlan at `docs/exec-plans/active/2026-05-04-team-os-text-kanban.md`, which owns implementation sequencing and verification.

## Non-goals

- build a web UI in the first iteration
- introduce a database or live-sync backend
- treat generated views as canonical state
- let native apps write directly to the default branch
- replace external trackers immediately instead of linking to them when needed

## Priority and sequencing

This is now `promoted` because the repository has accepted the Team OS shape and implementation has started under an ExecPlan. The first implementation slice still prioritizes the text workflow spine before any richer native-client UI work.

## Open questions

- Which parts are truly phase-one requirements: text kanban only, or text kanban plus native app scaffolding?
- What minimum artifact-linking rules are required before the system is useful without creating placeholder-document sprawl?
- Should external-tracker linkage be modeled in v1, or deferred until the text workflow is stable?
- What level of board policy and workflow enforcement is acceptable before the system becomes too heavy for day-to-day use?

## Promotion trigger

Promotion happened on `2026-05-04` when the repository accepted the Team OS implementation scope and created `docs/exec-plans/active/2026-05-04-team-os-text-kanban.md`.
