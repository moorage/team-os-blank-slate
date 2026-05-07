# SECURITY.md

This document defines the current security posture for the Team OS reference repository.

## Security goals

- keep Team OS content inspectable and text-native without introducing hidden write paths
- prevent future native clients from editing the wrong repository or the default branch
- avoid storing secrets or sensitive full-message payloads inside workflow artifacts

## Active trust boundaries

### Local Team OS files

Threats:

- malformed card, event, or comment files
- broken artifact links that silently hide missing context
- generated views mistaken for canonical state

Controls:

- schema validation in `kanban/scripts/src/schemas.ts`
- consistency validation in `kanban/scripts/src/validate.ts`
- source-of-truth guidance in `kanban/AGENTS.md` and `docs/KANBAN_SCHEMA.md`

### Native client mutation layer

Threats:

- a client writes to a repo the user did not verify
- a client writes directly to the default branch
- credentials or repo metadata are assumed instead of checked

Controls:

- `apps/native/` is a shared submodule checkout, while tenant-owned native settings stay outside it in `native-app/TeamOSAppConfig.json`
- repo-access gating types in `apps/native/TeamOSCore`
- transport-injected GitHub REST client and live services in `apps/native/TeamOSCore`
- branch-session, mutation-planning, and pull-request types in `apps/native/TeamOSCore`
- local canonical mutation bridging through `apps/native/TeamOSCore/Sources/TeamOSCore/Workflow/LocalTeamOSRepositoryBridge.swift`, which invokes the Team OS CLI with structured arguments instead of interpolated shell strings
- Team OS marker inspection before any write-ready state is exposed
- explicit documentation in `docs/NATIVE_APPS.md`, `apps/native/README.md`, and `native-app/TeamOSAppConfig.json`

### Team directory

Threats:

- private personal contact data committed without clear repository need
- invented or stale handles causing misrouting across Slack, GitHub, or other platforms
- profile image URLs that leak secrets, signed parameters, or private endpoints
- cards duplicating contact data instead of pointing to one canonical roster

Controls:

- `team/AGENTS.md` requires business-scoped, non-invented roster data
- `team/people/index.yaml` is the canonical directory for current person and alias identifiers
- `team/people/*.yaml` should use only public HTTPS `profile_image_url` values with no tokens, signed query strings, or private image hosts on `person` records; `functional-alias` records should prefer canonical emoji instead of remote image URLs
- cards and artifacts should reference stable roster keys rather than embedding handle data inline

## Secrets and credentials

- do not store GitHub tokens, app secrets, or private keys in Team OS files
- do not store personal private contact details in `team/people/**` unless the repository explicitly needs them and the value is meant to be committed
- the native app commits only public GitHub App metadata in `native-app/TeamOSAppConfig.json`; GitHub App client secrets and private keys stay outside git
- the native app may store user-scoped GitHub App sessions in platform secure storage, but not in Team OS files or plain checked-in config
- live GitHub services must authenticate and inspect repository permissions before reporting `RepoAccessStatus.writeReady`
- use repo-relative links to durable artifacts instead of pasting secret-bearing URLs or payloads into cards

## Security review triggers

- changes to native write flows
- changes to repo-access validation or permission semantics
- new artifact types that may contain sensitive data
- any proposal to add network sync, external tracker writes, or default-branch automation

## Tests and validation

Security-relevant changes should include:

- malformed card or event validation tests
- repo-access gating tests
- GitHub request-construction and error-mapping tests
- mutation-planning tests that prove branch/PR-only writes
- `npm run team-os:validate`
- `swift test --package-path apps/native`
