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

### Kanban rendering

- `npm run team-os:render` must regenerate all committed views deterministically from canonical files
- empty columns and empty groupings must render clearly instead of disappearing

### Native core

- `swift test --package-path apps/native` must cover branch naming, repo-access gating, mutation planning, and GitHub request construction
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build` must compile the macOS shell
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build` must compile the iOS shell
- live GitHub services must surface auth, repo, and write failures explicitly instead of silently downgrading to a success-looking state

## Required telemetry

Do not capture in logs:

- raw secrets
- copied external payload bodies
- generated views as if they were canonical audit logs

## Retry policy

- validation and rendering are local deterministic commands and should fail fast instead of retrying blindly
- native write operations should not auto-retry branch/file/PR mutations; future UI layers must gate retries behind explicit user-visible error handling

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
