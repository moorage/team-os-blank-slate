# KANBAN_SCHEMA.md

## Card schema

Each card lives in `kanban/cards/{CARD_ID}/card.md` and uses YAML frontmatter with these primary fields:

- `id`
- `title`
- `type`
- `board`
- `status`
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
- `description`
- `card_types`
- `columns`
- optional `done_rules`

Columns may define:

- `id`
- `label`
- `wip_limit`

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
