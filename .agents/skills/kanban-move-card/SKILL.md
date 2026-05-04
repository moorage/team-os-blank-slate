---
name: kanban-move-card
description: Move a Team OS card by updating current state, appending the right event, and regenerating views.
---

1. Read `kanban/AGENTS.md` and inspect the card directory under `kanban/cards/{CARD_ID}/`.
2. Update `card.md` current state without moving the directory.
3. Append the matching event under `events/`, including `status`, `sitting_with`, and rationale when relevant.
4. Run `npm run team-os:validate` and `npm run team-os:render`.
5. Summarize the new status, blocker state, and next action holder.
