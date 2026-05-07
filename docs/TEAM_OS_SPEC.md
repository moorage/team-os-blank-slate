# TEAM_OS_SPEC.md

Team OS stores product workflow state, durable context, and team identity together in text files so humans and Codex can answer four questions from the repository alone:

1. What is happening now?
2. Why does this work matter?
3. What happened before, and who holds the next action?
4. Which person or routing alias does a card identifier refer to?

## Layers

- `kanban/` is the temporal workflow layer
- `team/` is the identity layer for people and functional aliases
- `product-development/` is the durable context layer
- `.agents/skills/` is the reusable agent workflow layer
- `apps/native/` is the client layer that must respect the same canonical files and write guards

## Principles

- text files are canonical
- card directories stay stable
- generated views are derived state
- history is append-only
- comments are first-class files
- every important card should link to durable artifacts
- team identity records may include optional public profile-image URLs for people and optional canonical emoji for functional aliases, but private or secret-bearing media references do not belong in the repo
- native apps are Git and pull-request frontends, not a second datastore, and canonical native mutations should flow through the Team OS CLI bridge instead of rewriting markdown rules separately
