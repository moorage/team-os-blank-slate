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
- native apps are Git and pull-request frontends, not a second datastore
