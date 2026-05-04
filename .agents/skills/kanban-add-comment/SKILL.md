---
name: kanban-add-comment
description: Add a first-class Team OS comment file without mutating historical comments in place.
---

1. Read `kanban/AGENTS.md` and the existing card context.
2. Create a new timestamped Markdown file under `comments/` with frontmatter matching `kanban/templates/comment.md`.
3. Only append an event if state changed as well.
4. Run `npm run team-os:validate` and `npm run team-os:render`.
5. Summarize the comment author, timestamp, and whether state changed.
