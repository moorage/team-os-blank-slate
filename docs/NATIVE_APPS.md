# NATIVE_APPS.md

## Purpose

The native app layer lets macOS and iOS clients inspect Team OS state and verify repository write readiness without creating a second system of record.

## Current shipped surfaces

- `apps/native/TeamOSApps.xcodeproj` builds `TeamOSMacApp` and `TeamOSiOSApp`.
- `apps/native/AppShared/TeamOSShellView.swift` provides the shared UI shell for both platforms.
- `apps/native/AppShared/TeamOSWorkspaceModel.swift` wires the repository access check to `LiveGitHubService`.
- `apps/native/TeamOSCore` now owns live GitHub REST-backed auth, repo inspection, branch creation, file writes, and pull-request upserts.

The current UI deliberately exposes repository access readiness, sample card detail, validation summary, and branch/PR context. End-to-end card mutations from the app UI are still a follow-up slice.

## Repository setup

- user selects a GitHub repository
- app authenticates with GitHub
- app checks repository existence, read access, Team OS markers, and write permissions
- app enables write controls only when `RepoAccessStatus.writeReady`

## Authentication options

- current development path: fine-grained PAT entered into the app and held in memory only
- future production target: GitHub App or OAuth-based login with explicit repository selection

## Required permissions

- read repository contents
- write repository contents on non-default branches
- create and update branches
- create and update pull requests

## Branch-per-edit-session model

- branch format: `teamos/{github-user}/{yyyy-mm-dd}/{card-or-operation-slug}`
- reuse an open branch session when continuing the same edit session
- never write directly to the default branch

## Team OS marker gate

Write readiness requires all of the following repository markers:

- `AGENTS.md`
- `kanban/AGENTS.md`
- `kanban/cards`

## Pull request model

- create a PR when a branch session first produces a mutation plan
- update the existing PR when more mutations are added to the same session
- show branch name, commit message, PR URL, and draft state in the client

## Conflict handling

- detect drift against the base branch before applying a mutation
- if validation or render fails, keep the mutation as a local draft instead of pretending it landed cleanly

## Offline draft behavior

- offline edits are drafts only
- canonical Team OS changes exist only after a branch write plus PR update succeeds

## Current UI

- macOS: sidebar card list, workspace panels for repo access, validation, and branch/PR state, plus card detail
- iPhone: list-first navigation using the shared split-view shell
- iPad: sidebar plus detail using the same shared shell
- both platforms show sample cards and PR context even when GitHub access is not configured

## Security rules

- repository access must be explicit and re-checkable
- default-branch writes are forbidden
- mutation planning requires `RepoAccessStatus.writeReady`
- tokens are not persisted to disk by the current app targets

## Testing strategy

- `swift test --package-path apps/native`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`
- cover repo-access gating states, branch naming, mutation planning, and GitHub request construction
