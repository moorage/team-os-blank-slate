# Kanban Instructions

This folder implements the text-native workflow spine for Team OS.

## Source of truth

- current state: `cards/{CARD_ID}/card.md`
- audit history: `cards/{CARD_ID}/events/*.yaml`
- comments: `cards/{CARD_ID}/comments/*.md`
- board policy: `boards/*.board.yaml`
- generated views: `views/*.md`

## Required behavior

1. Never move card folders to represent state changes.
2. Every state-changing edit to `card.md` must be paired with an append-only event.
3. Treat generated views as disposable outputs, not canonical data.
4. Prefer repo-relative artifact links so validation can check them.
5. Run `npm run team-os:validate` and `npm run team-os:render` after changing kanban state.

## Important distinction

- `owner` = accountable person
- `assignees` = active workers
- `reviewers` = required approvers
- `watchers` = update subscribers
- `collaborators` = regular contributors without ownership
- `sitting_with` = who currently holds the next action
