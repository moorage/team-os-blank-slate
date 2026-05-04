# Native GitHub Services and App Targets

## Purpose / Big Picture

Extend the Team OS baseline from a text-first workflow system plus native-core scaffolding into a usable Apple-client foundation. This phase should do three concrete things:

1. replace placeholder GitHub services in `apps/native/TeamOSCore` with real REST-backed implementations that can authenticate, inspect repository access, create or reuse branches, write Team OS files, and create or update pull requests
2. upgrade mutation planning so write operations can carry real file contents instead of only change metadata
3. turn the documented macOS and iOS shells into buildable app targets that compile locally and surface the Team OS repository setup, validation state, and branch/PR mutation contract

The goal is not to finish the full product UI. The goal is to cross the line from “architecture only” into “real GitHub services plus real app targets” while keeping the write model safe: verified repository access, no default-branch writes, and deterministic Team OS file generation.

## Progress

- [x] 2026-05-04T11:12Z Milestone 1 — Extend `TeamOSCore` models and protocols for real GitHub-backed file mutations.
- [x] 2026-05-04T11:13Z Milestone 2 — Implement REST-backed GitHub services and comprehensive Swift tests.
- [x] 2026-05-04T11:16Z Milestone 3 — Create a buildable Apple app project with macOS and iOS targets.
- [x] 2026-05-04T11:23Z Milestone 4 — Update docs, verify end to end, and commit the completed phase.

## Surprises & Discoveries

- 2026-05-04: `xcodegen` and `tuist` are not installed locally, so the smallest reliable path for buildable app targets is either a generated `.xcodeproj` created by script or a carefully authored project file.
- 2026-05-04: SwiftPM remains the easiest place to keep `TeamOSCore` tests, even if the app targets live in an Xcode project.
- 2026-05-04: `ContentUnavailableView` would have forced the macOS target to 14.0+, so the empty state needed a macOS 13-compatible fallback view instead.

## Decision Log

- 2026-05-04: Keep the GitHub service layer token- and transport-injected so tests can validate real request construction without needing live credentials.
- 2026-05-04: Build app targets around a local Xcode project under `apps/native/` instead of inflating the Swift package into something it cannot represent cleanly.
- 2026-05-04: Check in both the generated `TeamOSApps.xcodeproj` and the Ruby generator script so the harness has a buildable default plus a reproducible regeneration path.
- 2026-05-04: Keep the first app shells read-only outside the repository access check so the UI can demonstrate the trust gate without faking full mutation support.

## Context and Orientation

Current foundation:

- `apps/native/Package.swift` defines `TeamOSCore` as a SwiftPM library with tests for repo-access gating, branch naming, and mutation planning.
- `apps/native/TeamOSCore/Sources/TeamOSCore/GitHub/GitHubLiveServices.swift` now handles authenticated repo inspection, branch creation, file writes, and PR upserts through the GitHub REST API.
- `docs/NATIVE_APPS.md` and the completed Team OS ExecPlan document the intended branch/PR-only write contract.
- `kanban/` and `product-development/` now provide real canonical Team OS files that GitHub-backed mutations can target.

Files expected to be created or updated in this phase:

- `apps/native/Package.swift`
- `apps/native/README.md`
- `apps/native/TeamOSCore/Sources/TeamOSCore/**`
- `apps/native/TeamOSCore/Tests/TeamOSCoreTests/**`
- `apps/native/TeamOSApps.xcodeproj/project.pbxproj`
- `apps/native/AppShared/**`
- `apps/native/TeamOSMacApp/**`
- `apps/native/TeamOSiOSApp/**`
- `docs/NATIVE_APPS.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/RELIABILITY.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/QUALITY_LEDGER.md`
- `docs/product-specs/index.md`
- `docs/product-specs/team-os-native-apps.md`

## Framing Notes

### Expert panel

- Security reviewer — protect the repository access gate and default-branch prohibition.
- Reliability engineer — ensure REST-backed writes are testable and fail loudly.
- SwiftUI reviewer — keep the first app targets intentionally small but buildable.
- Platform engineer — minimize project-file sprawl while creating real targets.

### What problem are we actually solving?

We are replacing “future app architecture” with a small but real native foundation: real GitHub service code plus real build targets that prove the model can compile and run.

### Critique changes folded into this plan before coding

- Real GitHub services must be test-first and transport-injected.
- Mutation plans must carry contents and SHA/update context where file writes need them.
- App targets should prove repository setup, validation state, and mutation visibility, not attempt full kanban editing in one jump.
- The finished phase should end in a real commit because the user explicitly approved doing all follow-up work.

## Milestones

### Milestone 1 — Upgrade the native mutation model

Files:

- `apps/native/Package.swift`
- `apps/native/TeamOSCore/Sources/TeamOSCore/Models/**`
- `apps/native/TeamOSCore/Sources/TeamOSCore/Workflow/**`
- `apps/native/TeamOSCore/Sources/TeamOSCore/GitHub/**`
- `apps/native/TeamOSCore/Tests/TeamOSCoreTests/**`

Tasks:

1. Add typed credential, repository, branch, file-write, and pull-request models for real GitHub-backed mutations.
2. Extend mutation plans so they can carry file contents, expected branch state, commit metadata, and PR metadata.
3. Add any missing helper types for repository loading, file serialization, and branch-session reuse.

Verification:

- `swift test --package-path apps/native`

### Milestone 2 — Implement real GitHub services

Files:

- `apps/native/TeamOSCore/Sources/TeamOSCore/GitHub/**`
- `apps/native/TeamOSCore/Sources/TeamOSCore/Workflow/**`
- `apps/native/TeamOSCore/Tests/TeamOSCoreTests/**`

Tasks:

1. Implement a real GitHub REST client with injected base URL, token provider, and transport.
2. Implement authentication-aware repo access checks, Team OS marker inspection, branch lookup/creation, file writes, and PR create/update flows.
3. Add tests for request construction, error mapping, repo access evaluation, branch reuse, and content writes.

Verification:

- `swift test --package-path apps/native`

### Milestone 3 — Create buildable app targets

Files:

- `apps/native/TeamOSApps.xcodeproj/project.pbxproj`
- `apps/native/AppShared/**`
- `apps/native/TeamOSMacApp/**`
- `apps/native/TeamOSiOSApp/**`
- `apps/native/README.md`
- `docs/NATIVE_APPS.md`
- `docs/product-specs/team-os-native-apps.md`

Tasks:

1. Create a real Xcode project with macOS and iOS app targets.
2. Add shared SwiftUI views for repository setup, access-state display, basic card list/detail display, validation state, and PR status.
3. Wire the first app targets to `TeamOSCore` using local/mock services so they compile without production credentials while still surfacing the real access gate.

Verification:

- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`

### Milestone 4 — Verify, document, and commit

Files:

- `docs/exec-plans/completed/2026-05-04-native-github-app-targets.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/QUALITY_LEDGER.md`
- `docs/generated/repo-map.json`

Tasks:

1. Update architecture, reliability, security, and product-spec docs for the real native phase.
2. Run Team OS and native verification commands.
3. Refresh generated knowledge artifacts.
4. Move the plan into `docs/exec-plans/completed/2026-05-04-native-github-app-targets.md`.
5. Commit the full working tree with the required `AI-Model` trailer.

Verification:

- `npm run team-os:typecheck`
- `npm run team-os:test`
- `npm run team-os:validate`
- `npm run team-os:render`
- `swift test --package-path apps/native`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`
- `npm run verify`
- `npm run knowledge:refresh`

## Acceptance / Verification

Acceptance criteria:

- `TeamOSCore` no longer relies on placeholder-only GitHub services for the primary authenticated repository flows.
- Real GitHub-backed code can evaluate repository access, inspect Team OS markers, create or reuse branches, write Team OS files, and prepare or update pull requests.
- Those flows are test-covered without requiring live credentials.
- macOS and iOS app targets exist and build successfully from `apps/native/TeamOSApps.xcodeproj`.
- The app UI visibly reflects repository setup, access state, validation status, and branch/PR context.
- The finished phase is committed.

Required commands:

- `swift test --package-path apps/native`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`
- `npm run verify`
- `npm run knowledge:refresh`

Rollout and recovery notes:

- The service layer remains credential-injected, so recovery from auth issues is configuration rollback rather than code rollback.
- The app project is additive under `apps/native/`; recovery is a revert of the project and app sources if the target structure proves too heavy.
- If GitHub write flows regress, fall back to the prior text-first CLI workflow while keeping the repository canonical.

## Outcomes & Retrospective

Implementation status: completed.

Observed outcome:

- Team OS gains a real Apple-client foundation with safe GitHub-backed operations and real build targets.
- The repository can prove the native contract through both Swift tests and Xcode builds.

Remaining risks to monitor:

- live GitHub auth still cannot be fully end-to-end verified without credentials
- the first real app targets should stay intentionally thin to avoid turning this phase into a full product rewrite
- the checked-in Xcode project and the generator script must stay in sync when native sources move
