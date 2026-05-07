# KANBAN_SCHEMA.md

## Card schema

Each card lives in `kanban/cards/{CARD_ID}/card.md` and uses YAML frontmatter with these primary fields:

- `id`
- `title`
- `emoji` (optional)
- `type`
- `board`
- `status`
- `column_order`
- `priority`
- `severity`
- `owner`
- `assignees`
- `reviewers`
- `watchers`
- `collaborators`
- `sitting_with`
- `sitting_reason`
- `sitting_since`
- `sitting_expected_action`
- `created_at`
- `updated_at`
- `summary`
- `feature_index_key`
- `artifacts`

## Event schema

Each event is a YAML file in `kanban/cards/{CARD_ID}/events/` with:

- `timestamp`
- `type`
- `actor`
- `card_id`
- event-specific state such as `status`, `from_status`, `sitting_with`, or artifact fields
- `summary`

Allowed event types:

- `created`
- `status-changed`
- `sitting-with-changed`
- `blocked`
- `unblocked`
- `artifact-linked`

## Comment schema

Each comment is a Markdown file in `kanban/cards/{CARD_ID}/comments/` with frontmatter:

- `card_id`
- `author`
- `created_at`
- `role`

## Board schema

Each board YAML file defines:

- `id`
- `name`
- `emoji` (optional)
- `description`
- `card_types`
- `columns`
- optional `done_rules`

Columns may define:

- `id`
- `label`
- `emoji` (optional)
- `light_background_hex` (optional)
- `dark_background_hex` (optional)
- `background_hex` (legacy optional fallback)
- `wip_limit`

Board column IDs must be unique within each board file.

## Column appearance metadata

- `light_background_hex` and `dark_background_hex` are the canonical board-column appearance fields stored in `kanban/boards/*.board.yaml`
- `background_hex` remains a supported fallback for older board files and is treated as both light and dark until a board is rewritten through the dual-theme editor
- all stored hex values must be quoted YAML strings like `"#D97706"` because an unquoted `#...` token is parsed as a YAML comment, not a hex color
- generated board views should surface the stored light and dark background metadata inline when present so text-only operators can still inspect it

## Ownership and handoff semantics

- `owner` is the single accountable person
- `assignees` are the people actively doing the work
- `reviewers` are the required approvers or reviewers
- `watchers` want updates but do not own the work
- `collaborators` help regularly without becoming the accountable owner
- `sitting_with` means who currently holds the next action
- every value in those fields must exist in `team/people/index.yaml`

## Generated views

The CLI generates:

- `kanban/views/product-dev.md`
- `kanban/views/bugs.md`
- `kanban/views/blocked.md`
- `kanban/views/sitting-with.md`
- `kanban/views/recently-moved.md`
- `kanban/views/stale-cards.md`
- `kanban/views/shipped-this-week.md`
- `kanban/views/by-owner.md`
- `kanban/views/validation-errors.md`

## Column ordering

- `column_order` is the canonical 1-based stack position inside a card's current `(board, status)` column
- `column_order` values must be contiguous within each column with no gaps or duplicates
- generated board views sort cards by `column_order` before card ID

## Emoji metadata

- `emoji` is optional and lives in `card.md` frontmatter so the visual marker is canonical instead of UI-only
- `emoji` must be a single emoji grapheme such as `✨`, `🧪`, or `🐛`
- generated views should show the emoji inline with the card title when present
- boards may also define optional root-level `emoji` metadata, with the same single-emoji-grapheme rule, so board markers are canonical board metadata instead of app-local decoration
- board columns may also define optional `emoji` metadata, with the same single-emoji-grapheme rule, so lane markers are canonical board metadata instead of app-local decoration
