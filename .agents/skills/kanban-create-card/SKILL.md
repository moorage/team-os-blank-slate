---
name: kanban-create-card
description: Create a Team OS kanban card, matching created event, linked artifacts, and regenerated views.
---

1. Read `kanban/AGENTS.md`, `docs/KANBAN_SCHEMA.md`, and the relevant template under `kanban/templates/`.
2. Create `kanban/cards/{CARD_ID}/card.md` plus a created event in `events/`.
3. Update `product-development/feature-index.yaml` when the card links to durable artifacts.
4. Run `npm run team-os:validate` and `npm run team-os:render`.
5. Report the card id, owning artifacts, and who the next action sits with.
