# Ideation Index

`docs/ideas/index.md` is the authoritative backlog for work that is being explored, shaped, or queued, but not yet implemented.

Every document under `docs/ideas/backlog/` must appear here.

## Workflow

1. Add new ideas here first, even if they begin as a one-line seed.
2. Expand any idea that needs more context into `docs/ideas/backlog/<slug>.md`.
3. Keep the table sorted by `Priority lane`, then by how ready the idea is to promote.
4. Move implementation detail into an ExecPlan only when the work is actually being started.

## Priority lanes

- `now` — best candidate for the next implementation cycle
- `next` — important, but not first
- `later` — valuable to preserve, not near-term
- `parked` — intentionally held without active planning pressure

## Backlog

| Priority lane | Status | Impact | Confidence | Effort | Idea | Why now | Doc |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `now` | `promoted` | `high` | `medium` | `high` | Central auth platform | Shared auth boundary, stale repo docs, and external-app compatibility work all need one coordinated execution plan. | `docs/ideas/backlog/central-auth-platform.md` |
