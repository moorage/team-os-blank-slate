---
name: kanban-standup-summary
description: Produce a standup summary from canonical Team OS card state and recent history.
---

1. Read `kanban/views/blocked.md`, `kanban/views/sitting-with.md`, and `kanban/views/recently-moved.md` after regenerating them if state changed.
2. Prefer `npm --prefix kanban/scripts run standup`.
3. Call out blocked work, who currently holds the next action, and cards ready to move.
4. Flag stale or ambiguous ownership instead of smoothing it over.
