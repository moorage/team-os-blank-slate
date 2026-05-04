# People Directory

`team/people/` is the canonical roster for Team OS identifiers.

## Record shape

Each record file should contain:

- `id` - stable identifier used by cards and views
- `kind` - `person` or `functional-alias`
- `display_name` - human-readable label
- `status` - typically `active` or `inactive`
- `summary` - short explanation of who or what the identifier represents
- `handles` - optional map of business-relevant handles
- `references` - repo-relative files that currently use the identifier

Supported `handles` keys:

- `email`
- `phone`
- `slack`
- `github`
- `linkedin`
- `whatsapp`
- `instagram`
- `homepage`

## Rules

- Omit unknown handles instead of guessing.
- Keep personal contact data out of the repo unless it is intentionally meant to be committed.
- Use `functional-alias` for routing identities like `analytics` or `backend-eng`.
- Update `index.yaml` when adding or removing a record file.
