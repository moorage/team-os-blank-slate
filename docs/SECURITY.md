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

- repo-access gating types in `apps/native/TeamOSCore`
- transport-injected GitHub REST client and live services in `apps/native/TeamOSCore`
- branch-session, mutation-planning, and pull-request types in `apps/native/TeamOSCore`
- Team OS marker inspection before any write-ready state is exposed
- explicit documentation in `docs/NATIVE_APPS.md` and `apps/native/README.md`

## Secrets and credentials

- do not store GitHub tokens, app secrets, or private keys in Team OS files
- the current app targets accept a development PAT in memory only and do not persist it to disk
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
