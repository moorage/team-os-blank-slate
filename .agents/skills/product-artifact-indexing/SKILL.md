---
name: product-artifact-indexing
description: Keep Team OS product artifacts and feature-index references consistent with their owning cards.
---

1. Read `product-development/feature-index.yaml` and the linked card files.
2. Ensure every indexed entry points to a real card and real artifact paths.
3. Update the index whenever a new durable PRD, investigation, analytics note, or launch doc becomes important to a card.
4. Run `npm run team-os:validate` after changing artifact references.
