# RELIABILITY.md

This document defines current reliability expectations for Team OS.

## Reliability goals

- Team OS state is always reconstructable from canonical text files.
- Validation failures are visible and actionable.
- Rendered views are deterministic so diffs stay meaningful.
- Future native clients fail closed when repo access or write prerequisites are missing.

## Active service expectations

### Kanban validation

- `npm run team-os:validate` must parse all committed board, card, event, comment, feature-index, and team-directory files.
- validation must always write `kanban/views/validation-errors.md`, even when it exits non-zero
- card ownership and routing identifiers must resolve through `team/people/index.yaml`
- canonical board-column `light_background_hex` and `dark_background_hex` values must remain quoted YAML strings like `"#D97706"` so validation reads the actual color token instead of an empty value caused by YAML comment parsing
- legacy `background_hex` must continue to load as a compatibility fallback until older board files are rewritten

### Kanban rendering

- `npm run team-os:render` must regenerate all committed views deterministically from canonical files
- empty columns and empty groupings must render clearly instead of disappearing
- configured board-column light/dark background metadata must appear deterministically in rendered board views instead of being silently dropped

### Native core

- `swift test --package-path apps/native` must cover branch naming, repo-access gating, GitHub App device-flow request construction, token refresh, and mutation planning
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build` must compile the macOS shell
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build` must compile the iOS shell
- live GitHub services must surface auth, repo, and write failures explicitly instead of silently downgrading to a success-looking state
- expired or revoked native GitHub sessions must fail closed and return the shell to a reauthorization state instead of leaving stale write-ready UI
- macOS Team OS mutations must write canonical files through the local CLI bridge, rerun Team OS validation and render before they are considered successful, and roll back the touched files if the local mutation pipeline fails
- local native mutation timestamps must preserve fractional seconds so rapid append-only event writes do not collide within the same second and trigger false validation failures
- if a local canonical Team OS save succeeds but the branch write or PR update fails, the shell must reload the saved local snapshot, surface that PR sync is pending, and preserve an explicit retry path instead of reverting the markdown write
- remote GitHub publication must be paced behind local canonical saves, wait at least one second between publish attempts, and coalesce contiguous same-branch queued work to the latest file contents per path so rapid local edits do not thrash the contents API
- the visible native processing queue must track repository access checks, GitHub auth, local canonical saves, and remote GitHub publication without becoming a dependency for the actual save/sync path; finished, failed, and cancelled rows must leave live sections and archive immediately

## Required telemetry

Do not capture in logs:

- raw secrets
- copied external payload bodies
- generated views as if they were canonical audit logs

## Retry policy

- validation and rendering are local deterministic commands and should fail fast instead of retrying blindly
- local canonical mutations should not auto-retry blindly; the current shell may only auto-retry stale-SHA `409` remote publication conflicts through a short bounded refetch/backoff loop plus up to two throttled GitHub sync queue cycles, while all other branch/file/PR failures remain explicit pending-sync work that requires user retry

## Startup and smoke checks

- Team OS typecheck: `npm run team-os:typecheck`
- Team OS tests: `npm run team-os:test`
- Team OS validation: `npm run team-os:validate`
- Team OS render: `npm run team-os:render`
- native core tests: `swift test --package-path apps/native`
- native macOS build: `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- native iOS build: `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`
- repository verify: `npm run verify`
- docs verify: `npm run verify:docs`
- ExecPlan verify: `npm run verify:execplan`

Optional capture helper:

- `npm run capture:screencast -- --output artifacts/screencasts/<feature-name>.mp4`

## Incident learning loop

After a material Team OS failure:

- add or update a regression test or fixture
- update this file if the failure exposed a missing invariant
- update `docs/QUALITY_LEDGER.md` if the issue reflects structural debt
