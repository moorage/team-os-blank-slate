# Team Instructions

This folder stores canonical identity records used by Team OS.

## Rules

1. `team/people/` is the source of truth for identifiers referenced from `owner`, `assignees`, `reviewers`, `watchers`, `collaborators`, and `sitting_with`.
2. Support both `person` and `functional-alias` records because current Team OS cards use both human owners and routing aliases.
3. Do not invent handles. If a Slack, GitHub, email, phone, WhatsApp, Instagram, LinkedIn, or homepage value is unknown, omit it from `handles`.
4. Prefer work-facing or public handles over personal accounts. Do not commit private contact data unless the repository explicitly needs it.
5. When a new identifier appears in Team OS cards, add or update the matching record in the same change.
