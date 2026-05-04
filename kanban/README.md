# Team OS Kanban

`kanban/` is the canonical workflow layer for Team OS.

## Rules

- cards live in stable directories under `kanban/cards/`
- `card.md` stores current state
- `events/*.yaml` stores append-only state history
- `comments/*.md` stores conversation as separate files
- `views/*.md` is generated output

## Commands

- `npm run team-os:validate`
- `npm run team-os:render`
- `npm --prefix kanban/scripts run history -- --card KAN-2026-0001`
- `npm --prefix kanban/scripts run standup`
