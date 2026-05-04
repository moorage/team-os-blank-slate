---
name: kanban-history-summary
description: Summarize the event and comment timeline for a Team OS card from canonical history files.
---

1. Read the card under `kanban/cards/{CARD_ID}/`.
2. Prefer `npm --prefix kanban/scripts run history -- --card {CARD_ID}` for the ordered timeline.
3. Call out status moves, blockers, handoffs, and the latest comment separately.
4. Quote file paths instead of treating rendered views as source of truth.
