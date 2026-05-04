# Team OS Native Apps

## Intent

Provide the first buildable Apple-platform Team OS clients without replacing the repository as the source of truth.

## Current scope

- `TeamOSMacApp` and `TeamOSiOSApp` build from `apps/native/TeamOSApps.xcodeproj`.
- Both apps use the shared `TeamOSShellView` surface.
- The shell shows:
  - a repository access panel with owner, repository, and token inputs
  - a validation panel with current error count and report path
  - a branch and pull-request panel with session context
  - a sample Team OS card list plus card detail
- The repository access check uses the live GitHub service layer in `TeamOSCore`.

## Safety requirements

- Team OS files remain canonical; the app is a client, not a parallel datastore.
- Repository writes must remain branch- and pull-request-only.
- The app must not expose write-ready state until repository existence, permissions, and Team OS markers are verified.
- The current app targets must not persist GitHub tokens to disk.

## Non-goals in this slice

- no end-to-end card mutation actions from the UI yet
- no local draft sync beyond the sample-backed shell state
- no GitHub App or OAuth login flow yet

## Acceptance criteria

- `swift test --package-path apps/native` passes.
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build` passes.
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build` passes.
- The repository access panel can visibly represent `notConfigured`, `authRequired`, `checking`, `readOnly`, `writeReady`, `invalidRepo`, `missingTeamOSMarkers`, and `insufficientPermissions`.
- The card detail surface shows title, summary, owner, status, sitting-with context, and linked artifacts for the selected card.
