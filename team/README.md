# Team Directory

`team/` stores the canonical identity data that Team OS cards point at.

Current surfaces:

- `team/people/index.yaml` lists the current roster entries.
- `team/people/*.yaml` stores one record per person or functional alias, including optional public profile-image metadata for people and optional canonical emoji for functional aliases.

Use this folder when card identifiers need durable ownership or handle context that should not live inline in workflow files.
