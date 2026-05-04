---
name: kanban-link-artifact
description: Link a durable product artifact to a card and record the link as append-only history.
---

1. Read `kanban/AGENTS.md`, `product-development/AGENTS.md`, and `docs/KANBAN_SCHEMA.md`.
2. Add or update the artifact reference in `card.md`.
3. Append an `artifact-linked` event under `events/`.
4. Keep `product-development/feature-index.yaml` consistent when the artifact should be indexed.
5. Run `npm run team-os:validate` and `npm run team-os:render`.
