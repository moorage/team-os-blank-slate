# People Directory

`team/people/` is the canonical roster for Team OS identifiers.

## Record shape

Each record file should contain:

- `id` - stable identifier used by cards and views
- `kind` - `person` or `functional-alias`
- `display_name` - human-readable label
- `status` - typically `active` or `inactive`
- `summary` - short explanation of who or what the identifier represents
- `emoji` - optional single emoji grapheme for `functional-alias` records that the native app shows anywhere the team is displayed or selected
- `profile_image_url` - optional public HTTPS image URL the native app may show next to `person` identifiers
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
- Use `emoji` for `functional-alias` records when the team should render with a canonical symbol instead of a remote avatar.
- Use `profile_image_url` only for public, non-secret HTTPS image URLs on `person` records. Do not commit signed URLs, token-bearing URLs, or private image endpoints.
- Keep personal contact data out of the repo unless it is intentionally meant to be committed.
- Use `functional-alias` for routing identities like `analytics` or `backend-eng`.
- Update `index.yaml` when adding or removing a record file.
