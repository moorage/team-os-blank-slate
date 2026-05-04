# OPERATING_RHYTHM.md

## Daily standup

- run `npm --prefix kanban/scripts run standup`
- review `kanban/views/blocked.md`
- review `kanban/views/sitting-with.md`

## Weekly planning

- review `kanban/views/product-dev.md`
- review `kanban/views/bugs.md`
- review `kanban/views/stale-cards.md`
- confirm `product-development/feature-index.yaml` still reflects the important work

## Launch gate

- before a card reaches `shipped`, ensure the required launch artifacts exist
- rerun `npm run team-os:validate` and `npm run team-os:render`

## Post-launch review

- link the post-launch review doc from the owning card
- summarize learnings in a new comment or artifact-link event, depending on whether state changed

## When to create cards

- create a card when work needs explicit ownership, a durable next action, or linked artifacts
- do not create cards for purely ephemeral chatter

## Comments vs events

- use events when current state changes
- use comments when conversation or context changes without changing state
