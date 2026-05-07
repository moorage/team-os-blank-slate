# NATIVE_APPS.md

## Purpose

The native app layer lets macOS and iOS clients inspect Team OS state and, on macOS, commit Team OS changes without creating a second system of record.

## Current shipped surfaces

- `apps/native/` is a shared submodule checkout from the local `team-os-native-apps` repository.
- `apps/native/TeamOSApps.xcodeproj` builds `TeamOSMacApp` and `TeamOSiOSApp`.
- `apps/native/AppShared/TeamOSShellView.swift` provides the shared UI shell for both platforms.
- `apps/native/AppShared/TeamOSWorkspaceModel.swift` wires the repository access check to `LiveGitHubService`.
- `apps/native/TeamOSCore` now owns live GitHub REST-backed auth, repo inspection, branch creation, file writes, and pull-request upserts.
- `native-app/TeamOSAppConfig.json` is the repo-owned config surface for bundle IDs, repo defaults, GitHub App identity, and local persistence names.
- `scripts/github_app/update_native_public_config.py` is the tenant-owned helper that updates the public GitHub App metadata inside `native-app/TeamOSAppConfig.json`.

## Ownership boundary

- Keep shared Apple client code, the Swift package, app targets, and the Xcode project inside `apps/native/`.
- Keep tenant-owned bundle IDs, default repository settings, GitHub App metadata, and local persistence namespaces in `native-app/TeamOSAppConfig.json`.
- Regenerate the checked-in Xcode project from the tenant repo with `ruby apps/native/scripts/generate_xcodeproj.rb` whenever target layout changes.

The current UI deliberately exposes GitHub App onboarding, repository access readiness, a board-first kanban shell, canonical repository-backed board/card/comment state when a local Team OS checkout is available, validation summary, branch/PR context, a first-class processing queue, and first-class directory workspaces backed by the canonical `team/people/*.yaml` records. Unsigned users open a GitHub sheet from a workspace prompt, and signed-in users reopen the same sheet from platform menus. Once sign-in is restored, the shared workspace model now automatically rechecks the persisted repository selection on relaunch and also rechecks after the owner/repository fields settle on a new target, while immediately removing any stale write-ready state from the previous repository. The shell also exposes a new-card prompt, with `Cmd-N` mapped to that action on macOS, a directory-backed owner combobox that still allows free-form values, directory-backed person profile images and functional-alias emoji next to names throughout the current board, detail, suggestion, and comment surfaces, canonical card emoji pickers for both new cards and the selected card detail surface, searchable selected-card comboboxes for `owner`, `sitting_with`, and `status` that write canonical markdown immediately on macOS, a selected-card status picker that renders the canonical lane emoji plus readable lane-color chips and can launch the same pendulum-style drag ghost into a new column before the queued move lands when the destination lane is valid, a sidebar status-lane list for the selected board that can reveal or locally hide lanes while scrolling the viewport to a chosen column, fixed-bottom `People Directory` and `Team Directory` sidebar destinations that remain visible while the board list scrolls above them, searchable directory workspaces for person and functional-alias records, top-right `New Person` and `New Team` header actions that open create sheets, a searchable People Directory status combobox with likely availability presets, a Team Directory emoji authoring control for functional aliases, preview-first read-only reference links inside those directory editors, canonical board emoji rendered in the sidebar board list and selected-board header with a matching macOS Character Viewer authoring control in that header, and canonical lane emoji rendered in the lane sidebar, kanban header, and selected-card status controls with a matching Character Viewer-backed macOS authoring control in the column header. The board surface now stays top-aligned within the viewport, the board header exposes a top-right app-background color affordance that reuses the persisted shared tint preference, the detail header now uses the emoji itself as the picker trigger plus inline title and description editors with `Esc` cancel and `Return` commit semantics, and comment rows now keep a small relative timestamp at the bottom with the full datetime available on hover. Artifact rows and repository-relative directory file links now open an in-app text preview first, keep the repo-relative path visible, and expose explicit follow-up actions instead of jumping straight into the system app. The board and detail panes now fill the split-view height and keep their top headers fixed while their bodies scroll, and the right-hand detail pane can be collapsed, reopened from a top-right toolbar toggle, reopened by double-clicking a card on macOS, or reopened by long-pressing a card on iOS. Validation and branch/PR now live as a one-line bottom status bar plus a dedicated workspace-status sheet rather than permanent detail-pane cards, and the same bottom bar now exposes a `Network & Logs` item that opens a dedicated macOS window or iOS sheet showing `Active`, `Future`, and `Archive` work like a printer queue. macOS also exposes a standard Settings window where users can enable a custom shared app background tint, choose its color, tune its intensity, and reset to the default shell look, with that preference persisted locally across launches. On macOS, committed Team OS actions now save canonical markdown immediately through the local CLI bridge, project queued follow-up card drops over the last persisted snapshot so the board reorders instantly, serialize the actual local markdown writes behind the scenes, and then enqueue GitHub branch and draft pull-request publication separately. Before a lane move enters that local save path, the shared workspace model now preflights lane rules that the native snapshot already knows about, including required artifact gates and destination WIP limits, so invalid drag/drop or status-picker moves fail immediately with a specific explanation instead of triggering a generic validator rollback alert. The same macOS authoring path now also updates existing directory records under `team/people/*.yaml`, creates new person and functional-alias records through the header sheets, and keeps the selected directory pane focused on the created record, while iOS keeps those editors read-only in this slice. The remote publisher now waits at least one second between publish attempts, coalesces queued same-branch work down to the latest file contents per path, retries stale-SHA `409` publish conflicts through a short bounded refetch/backoff loop plus up to two throttled queue cycles, and only then surfaces a pending sync if GitHub still fails. The new processing queue tracks repository access checks, GitHub device-flow authorization, local canonical saves, and queued GitHub publication without becoming part of the save path itself; once work leaves `Future` or `Active`, it moves into `Archive`, and explicit retry creates a new live queue row while the failed history stays visible. If the local save succeeds but GitHub sync still fails after that throttled publish path, the shell keeps the local markdown change, pauses the remaining remote-sync queue, marks PR sync as pending, and offers an explicit retry path. The visible macOS drag card now comes from a custom in-window drag ghost instead of relying on the system drag snapshot alone, hangs below the pointer from a centered suspension point above the card instead of pivoting around the literal grab point, swings through a short post-stop oscillation before settling, springs back immediately on invalid release, and cancels cleanly on `Esc`, app deactivation, or a monitored mouse-up that SwiftUI would otherwise miss. The app can replay that ghost deterministically with `./script/build_and_run.sh --verify -- --team-os-drag-motion-loop`.

## Repository setup

- user selects a GitHub repository, and that selection persists locally across launches
- when a valid GitHub session is available, the app automatically rechecks access for the saved repository on relaunch and after repository selection changes settle
- when no repository has been saved yet, the app can infer a default from the GitHub App installations and repositories accessible to the signed-in user
- app authenticates with GitHub
- app checks repository existence, read access, Team OS markers, and write permissions
- app enables write controls only when `RepoAccessStatus.writeReady`

## Authentication options

- current shipped path: GitHub App device flow with refreshable user access tokens stored in platform secure storage
- public GitHub App metadata is committed in `native-app/TeamOSAppConfig.json`
- maintainer rotation of public app metadata is handled by `python3 scripts/github_app/update_native_public_config.py --client-id <client-id> --app-slug <app-slug>`
- admin-only GitHub App secrets stay outside git and outside the native client

## Required permissions

- read repository contents
- write repository contents on non-default branches
- create and update branches
- create and update pull requests

## Branch-per-edit-session model

- branch format: `teamos/{github-user}/{yyyy-mm-dd}/{card-or-operation-slug}`
- reuse an open branch session when continuing the same edit session
- never write directly to the default branch
- ordered card moves can require multiple `kanban/cards/**/card.md` rewrites because source and destination siblings may need `column_order` renumbering

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
- if GitHub returns a same-branch content `409` because a file SHA is stale, refetch the current branch file SHA through a short bounded backoff loop before surfacing a pending sync
- if the local mutation pipeline fails validation or render, roll back the touched local Team OS files instead of leaving a partial save behind
- if the local mutation succeeds but branch or PR sync fails, keep the canonical local save visible and mark remote sync as pending
- if remote sync fails after one or more optimistic local saves, pause the remaining remote-sync queue until the user explicitly retries instead of auto-restarting it on the next save
- remote GitHub publication must wait at least one second between attempts, coalesce contiguous same-branch queued work to the latest file contents per path, and only auto-retry the stale-SHA `409` branch-write case through that bounded refetch loop plus up to two throttled queue cycles before surfacing pending sync
- the visible processing queue must reflect the real authoring pipeline, separate live `Active` and `Future` work from archived terminal rows, and never block the underlying repository access, local save, or GitHub sync path if a log row cannot be updated

## Offline draft behavior

- local canonical Team OS changes exist after the local mutation pipeline succeeds, even if the later GitHub branch or PR sync step fails
- a failed branch/PR sync must remain visible as pending work until the user retries or resolves it outside the client
- rapid consecutive valid card drops can queue behind the local-save worker without blocking the visible board reordering, and their local append-only event writes must keep sub-second precision so same-second moves do not overwrite each other
- invalid lane moves should be rejected before the local Team OS command runs whenever the destination rules are already knowable from the native snapshot, especially done-lane artifact gates and WIP limits
- rapid consecutive local saves may also queue behind the throttled GitHub publisher, which publishes at most once per second per running app instance while preserving the latest canonical local state

## Current UI

- macOS: sidebar board list with canonical board emoji, a selected-board status-lane list with local eye toggles and a new-lane plus action, fixed-bottom `People Directory` and `Team Directory` destinations that stay visible while the board list scrolls independently, a drag-and-drop kanban board for the selected board with between-card insertion targets and visible empty columns for every currently shown lane, top-aligned visible lanes, canonical board emoji shown in the selected-board header, canonical lane emoji shown directly on lane rows, lane headers, and status controls, canonical card emoji shown directly on board cards, a board-header appearance button for the shared app tint, a Character Viewer-backed board-emoji picker in that same header that saves canonical board YAML when write-ready, readable foreground styling for configured light/dark column backgrounds, lanes that widen to absorb the available board width as other lanes are hidden, a column-header appearance editor plus a Character Viewer-backed lane-emoji picker that can still open in read-only mode to explain write gating and that save canonical lane emoji plus `light_background_hex` and `dark_background_hex` metadata back to board YAML when write-ready, neutral cards that stay white in light mode and dark in dark mode, a custom in-window drag ghost that hangs below the pointer from a centered suspension point above the card, swings much more obviously with pointer speed, lift, lateral lag, and a short post-stop oscillation, then settles quickly when a drop target is effectively locked, switches to the system not-allowed cursor plus reject styling when the hovered lane is already known to be blocked, springs back immediately on invalid release, and cancels on `Esc` or app deactivation, a deterministic launch-argument replay loop for that drag ghost, a selected-card searchable status combobox that shows the canonical lane emoji and lane color chips and can trigger that same flyover before the queued move lands, an optimistic queued-drop path that lets later valid drops land immediately while earlier local saves are still serializing and the throttled GitHub publisher trails behind at one-second minimum intervals, directory-backed person profile images plus functional-alias emoji next to the current name surfaces, a repository-backed new-card prompt on `Cmd-N` with system emoji selection, a directory-backed owner combobox plus `@mention` autocomplete in the summary/comment editors, `Workspace` menu commands for focusing the boards, board, details, and `Network & Logs` window, searchable People Directory and Team Directory workspaces that edit the canonical `team/people/*.yaml` fields for person and functional-alias records, top-right `New Person` / `New Team` header actions that open native create sheets, a Team Directory emoji authoring control for functional aliases, preview-first file and reference affordances inside those editors, save / revert footer controls, up/down arrow navigation through cards when the board pane is focused, full-height board/detail panes with fixed top headers and scrollable bodies, a collapsible detail pane with a toolbar toggle, `Esc` to close on macOS, plus double-click reopen from board cards, a Finder-style one-line workspace-status bar, a dedicated `Network & Logs` queue window with `Active`, `Future`, and `Archive` sections, a modal workspace-status sheet, a modal GitHub connection sheet that includes repository access, a Settings window for persistent app background tint customization, `Workspace` and `GitHub` menu-bar command groups, and a detail pane focused on the selected card plus a header emoji Character Viewer trigger, inline title and description editing, preview-first artifact buttons, canonical comments with bottom-aligned relative timestamps and full hover datetimes, a searchable status picker, a searchable owner combobox, and a searchable sitting-with combobox
- iPhone: board-first navigation using the shared split-view shell plus a hamburger menu that opens new-card, GitHub connection, workspace-status, and `Network & Logs` actions, a top-bar details toggle, and long-press reopen for the shared detail pane; canonical Team OS authoring remains disabled in this slice
- iPad: sidebar board navigation plus the same shared kanban/detail shell with a one-line bottom status bar, the shared new-card prompt, the same directory-backed comments and mention affordances, the shared collapsible detail pane behavior, and an iOS sheet version of `Network & Logs`; canonical Team OS authoring remains disabled in this slice
- both platforms can still fall back to sample boards/cards when no local repository snapshot can be loaded

## Security rules

- repository access must be explicit and re-checkable
- default-branch writes are forbidden
- mutation planning requires `RepoAccessStatus.writeReady`
- the native client stores only user-scoped GitHub App sessions in platform secure storage
- GitHub App client secrets and private keys stay out of git and out of the shipped client

## Testing strategy

- `swift test --package-path apps/native`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`
- cover repo-access gating states, branch naming, mutation planning, and GitHub request construction
