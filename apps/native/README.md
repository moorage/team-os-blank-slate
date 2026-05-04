# Native Team OS

`apps/native/` defines the Apple-platform contract for Team OS.

## Current layout

- `Package.swift` exposes the shared `TeamOSCore` Swift library.
- `TeamOSApps.xcodeproj` builds `TeamOSMacApp` and `TeamOSiOSApp`.
- `AppShared/` holds the shared SwiftUI shell and workspace model.
- `scripts/generate_xcodeproj.rb` regenerates the checked-in Xcode project when targets or source layout change.

## Verification

- `swift test --package-path apps/native`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`

## Runtime behavior

- `TeamOSCore` owns repo-access gating, branch naming, mutation planning, and live GitHub REST-backed repository operations.
- `TeamOSShellView` shows repository access readiness, validation status, branch/PR context, and sample Team OS cards on both Apple platforms.
- `TeamOSWorkspaceModel.checkAccess()` uses `LiveGitHubService` with an in-memory token so a user can verify repository ownership, marker presence, and write readiness before any future mutation UI is enabled.
- The current shells intentionally keep cards, validation output, and PR state sample-backed while only the repository access check talks to GitHub.

## Project regeneration

```sh
gem install xcodeproj --user-install
ruby apps/native/scripts/generate_xcodeproj.rb
```
