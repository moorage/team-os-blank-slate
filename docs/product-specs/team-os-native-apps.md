# Team OS Native Apps

## Intent

Provide the first buildable Apple-platform Team OS clients without replacing the repository as the source of truth.

## Current scope

- `TeamOSMacApp` and `TeamOSiOSApp` build from `apps/native/TeamOSApps.xcodeproj`.
- Both apps use the shared `TeamOSShellView` surface.
- The shell shows:
  - a modal GitHub App sheet that includes repository access controls with owner and repository inputs that persist locally across launches and automatically recheck GitHub readiness after sign-in, relaunch, and settled repository changes
  - an unsigned workspace prompt that opens the GitHub App sheet when the user is not signed in
  - a sidebar that lists every available kanban board from the current repository snapshot when available, including any canonical board emoji, followed by a status-lane list for the selected board with local eye toggles and a plus action for creating a canonical lane, while fixed-bottom `People Directory` and `Team Directory` destinations stay visible underneath the scrolling board list
  - a drag-and-drop kanban surface for the currently selected board, with the pane filling the viewport height, visible lanes pinned to the top of the scrollable viewport instead of floating mid-surface, canonical board emoji shown in the selected-board header, canonical lane emoji shown anywhere the lane label is visible, the board header staying fixed above the scrollable board body, a top-right background-color affordance that reuses the shared app tint preference, readable foreground treatment chosen automatically for configured column backgrounds, visible lanes widening to absorb the available board width when other lanes are hidden, and a macOS drag treatment where a custom in-window drag ghost hangs below the pointer, swings visibly with pointer speed, lift, lateral lag, and a short post-stop oscillation, then settles quickly once a drop target is effectively locked in, while known-invalid hovered lanes switch to reject styling and the system not-allowed cursor instead of pretending they can accept the drop; locally hidden lanes are omitted from this viewport until the user reveals them again from the sidebar
  - a People Directory and Team Directory main-pane workspace that swaps in when those fixed-bottom destinations are selected, with searchable record lists, top-right `New Person` / `New Team` actions, polished detail editors for the canonical `team/people/*.yaml` fields, preview-first file / reference affordances, and save / revert controls; the People Directory status field uses a searchable combobox with likely availability presets, the Team Directory authors a canonical team emoji instead of a profile-image URL for `functional-alias` records, referenced files remain previewable but not hand-editable, macOS writes both record edits and newly created records back to the repository through the native Team OS mutation path, and iOS keeps the same surfaces read-only in this slice
  - macOS-only column appearance and emoji editors in each kanban column header that can always open for inspection, show write-gating reasons when save is unavailable, and persist optional canonical lane emoji plus `light_background_hex` and `dark_background_hex` values back to `kanban/boards/*.board.yaml` when write-ready; iOS currently reads those values but does not author them
  - macOS pane-focus commands for the sidebar, main board, and detail pane
  - a collapsible detail pane focused on selected-card detail plus a canonical comment thread and composer on macOS, with the selected-card header fixed above the scrollable detail body, a top-right toggle button, `Esc` to close on macOS, a clickable header emoji that opens the macOS Character Viewer-backed picker or the iOS system-input fallback sheet, inline title and description editors with click-to-edit plus `Esc` cancel and `Return` commit semantics, signed-in GitHub commenters resolved through the Team OS directory when a matching GitHub handle exists so the canonical name/avatar appears in comment history while new comments save under the canonical identifier, comment rows that place a compact relative timestamp at the bottom and expose the full human-readable datetime on hover, a searchable status combobox that shows the canonical lane emoji and lane color chip and can launch a pendulum-style flyover into another board column when the destination is valid, searchable combobox controls for both `owner` and `sitting_with`, and artifact rows that open an in-app text preview first, keep the repo-relative path visible, and offer explicit external follow-up actions instead of only showing the raw path
  - a new-card prompt that can open from macOS `Cmd-N`, the macOS menu bar, or the iOS hamburger menu, and that lets the user assign a card emoji from a shared picker
  - a directory-backed owner combobox in the new-card flow that still allows free-form owner entry and shows person profile images or functional-alias emoji when available
  - `@mention` autocomplete in every current multiline editor, namely the new-card summary and the comment composer
  - directory-backed identity badges next to names across the current board, detail, suggestion, and comment surfaces, showing person profile images when available, functional-alias emoji when available, and a safe fallback when neither exists
  - a shared app background tint that can be customized from macOS Settings and persists across launches
  - a one-line bottom status bar with validation, branch/PR, and `Network & Logs` quick checks; validation and branch/PR open a dedicated workspace-status sheet, while `Network & Logs` opens a dedicated macOS window or iOS sheet that separates `Active`, `Future`, and `Archive` work
- The repository access check uses the live GitHub service layer in `TeamOSCore`.

## Safety requirements

- Team OS files remain canonical; the app is a client, not a parallel datastore.
- Repository writes must remain branch- and pull-request-only.
- The app must not expose write-ready state until repository existence, permissions, and Team OS markers are verified.
- The current app targets must not commit GitHub secrets to disk or to Team OS files.
- User-scoped GitHub App sessions may be stored in platform secure storage for reauthentication and refresh.

## Non-goals in this slice

- no per-keystroke autosave of unfinished drafts
- no default-branch writes
- no embedded client-secret or private-key flow in the native client

## Acceptance criteria

- `swift test --package-path apps/native` passes.
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build` passes.
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build` passes.
- The repository access panel can visibly represent `notConfigured`, `authRequired`, `checking`, `readOnly`, `writeReady`, `invalidRepo`, `missingTeamOSMarkers`, and `insufficientPermissions`.
- The repository access controls live inside a modal GitHub App sheet that can be opened from an unsigned workspace prompt or reopened from platform menus when signed in.
- Restoring a valid GitHub session with a saved repository selection automatically rechecks repository access without requiring a manual `Check Access` click, and editing the repository selection immediately removes the old write-ready state before auto-rechecking the new target.
- `Cmd-N` on macOS opens a new-card prompt instead of creating a second Team OS window, and the same prompt is reachable from the shared workspace menu surfaces.
- macOS workspace commands can focus the sidebar, main board, and detail panes, and the focused main board pane responds to up/down arrow card navigation.
- The new-card owner control suggests current Team OS directory identifiers while still accepting a free-form owner value.
- Typing `@` in the new-card summary or comment composer opens directory autocomplete, inserts canonical Team OS identifiers, and removes the derived tagged state automatically if the mention text is deleted later.
- Directory-backed names in the current native shell show person profile images when the directory provides a public image URL, show functional-alias emoji when the directory defines one, and fall back cleanly when neither is available.
- Validation and branch/PR details move out of the detail pane into a one-line bottom status bar plus a dedicated workspace-status sheet that is also accessible from the macOS menu bar and the iOS hamburger menu.
- The same bottom bar also exposes a `Network & Logs` status item that opens a printer-queue-style surface showing repository access checks, GitHub authorization, local canonical saves, and queued GitHub publication in `Active`, `Future`, and `Archive` sections.
- The selected-card detail pane can be hidden without clearing card selection, closed with `Esc` on macOS, reopened from a top-right toolbar icon, reopened by double-clicking a board card on macOS, and reopened by long-pressing a board card on iOS.
- When no repository has been saved yet, the repository access panel can default from the repositories available through the signed-in GitHub App context and then persist that choice locally.
- The board sidebar shows all available boards rather than individual cards.
- The board sidebar renders canonical board emoji when the selected repository snapshot defines them.
- The board sidebar also shows the selected board's status lanes, lets the user scroll to a lane by clicking it, and lets the user locally hide or reveal lanes without mutating canonical Team OS files.
- The board list scrolls independently from fixed-bottom `People Directory` and `Team Directory` destinations, so those directory entries stay reachable even when the repository contains many boards.
- The currently selected board renders kanban columns sourced from the board definition, keeps every currently visible board-defined column visible even when it has no cards, shows any canonical board emoji in the selected-board header, shows any canonical board-column emoji on the lane header/sidebar/status controls plus any canonical card emoji on the board card, and orders cards by canonical `column_order` inside each status.
- The user can create a new lane from the sidebar plus action, and saving it appends that lane to the selected board's canonical `columns` array in `kanban/boards/*.board.yaml`.
- Selecting `People Directory` opens a searchable editor workspace for `kind == person` records from `team/people/*.yaml`, with read-only identifier/kind metadata, an editable display name, a searchable likely-status combobox, editable summary/profile image URL/handles, and preview-only canonical reference links.
- Selecting `Team Directory` opens the parallel editor workspace for `kind == functional-alias` records from `team/people/*.yaml`, with an editable canonical emoji in place of a profile-image URL.
- The header for each directory workspace exposes a top-right create action, opening a native sheet that suggests a canonical identifier from the typed display name and creates a new `team/people/<id>.yaml` record plus matching `team/people/index.yaml` entry on macOS.
- Saving a directory edit on macOS updates the canonical YAML record through the native Team OS mutation bridge, refreshes the native snapshot immediately, and keeps the rest of the app's owner/avatar/mention/commenter resolution aligned with the updated directory data.
- When a board column has canonical `light_background_hex` or `dark_background_hex` metadata, the native shell renders the correct background for the active color scheme and chooses readable text automatically instead of relying on a fixed dark/light theme.
- macOS can assign or clear a canonical lane emoji from the column header through the system Character Viewer-backed picker, and that action updates `kanban/boards/*.board.yaml` plus regenerated Team OS markdown views; iOS does not expose that authoring control in this slice.
- macOS can assign or clear a canonical board emoji from the selected-board header through the system Character Viewer-backed picker, and that action updates `kanban/boards/*.board.yaml` plus regenerated Team OS markdown views; iOS renders the canonical board emoji without exposing board-metadata authoring in this slice.
- When the main board pane is focused on macOS, the up and down arrow keys move the current card selection in the board's visible display order without moving past the first or last card.
- Dragging a visible card within a column or onto another valid column on macOS updates canonical Team OS files immediately, preserves contiguous `column_order`, reloads the local repository snapshot, and then enqueues the active Team OS branch and draft PR for throttled remote publication.
- While a macOS drag is in flight, the dragged card hangs below the pointer from a centered suspension point above the card instead of swinging around the literal grab point, sways side to side based on horizontal pointer speed, carries through a short back-and-forth oscillation after a quick stop, damps down as the drag slows, and settles almost immediately when the pointer is still over an active drop target.
- Releasing a macOS drag over no valid target restores the card to rest immediately instead of leaving it stranded in a drag state.
- Pressing `Esc` during a macOS drag or switching away from the app cancels the drag immediately.
- A deterministic macOS replay loop for the visible drag ghost is available through the launch argument `--team-os-drag-motion-loop`, with optional targeting through `--team-os-drag-motion-card-id <card-id>`, so the rendered drag path can be verified without relying only on manual pointer feel.
- macOS can save or clear canonical light/dark board-column colors from the column header, and that action updates `kanban/boards/*.board.yaml` plus regenerated Team OS markdown views; iOS does not expose that authoring control in this slice.
- Creating a card from the native prompt on macOS creates canonical Team OS files immediately, preserves any chosen emoji, selects the created card in the shell, and updates the active branch and PR.
- The selected-card detail pane can assign or clear canonical card emoji on macOS from the clickable Character Viewer-backed header emoji picker and on iOS from the system-input fallback sheet without affecting card ordering or selection state.
- The selected-card detail pane can move the current card to another board status from a searchable combobox on macOS, and that interaction shows the canonical lane emoji plus lane-color chip while using the same pendulum-style drag-ghost flyover plus queued canonical move pipeline as a manual drop.
- Before a drag/drop or selected-card status change enters the local Team OS command path, the native app should preflight any move rules already knowable from the current snapshot, especially required-artifact done-lane gates and destination WIP limits, and block the move immediately with a direct explanation when those rules would fail.
- The card detail surface shows an inline-editable title, summary, a searchable owner combobox, a searchable sitting-with combobox backed by canonical `sitting_with` saves, a searchable status combobox that renders lane emoji and colors, linked artifacts that open a preview-first text sheet with explicit Finder/GitHub/Terminal/native follow-up actions on macOS and Files/browser/native-viewer equivalents on iOS, and canonical comments with a minimal `New comment` composer plus bottom-aligned relative timestamps and full hover datetimes while validation and branch/PR remain read-only status surfaces elsewhere.
- If a macOS canonical save succeeds locally but the branch write or PR update fails, the shell keeps the saved local markdown state visible, marks PR sync as pending, and exposes an explicit retry path from Workspace Status.
- If a macOS branch write hits a GitHub file-SHA `409` during a same-branch follow-up save, the client refetches the branch file SHA through a short bounded backoff loop before it surfaces PR sync as failed.
- Rapid consecutive valid drops are accepted while earlier local saves or GitHub sync are still in flight, with the visible board projecting the queued drop order immediately and the local markdown writes staying serialized behind the scenes.
- GitHub publication drains through a second queue with at least a one-second gap between attempts, coalesces contiguous same-branch pending work to the latest file contents per path, and only auto-retries the stale-SHA `409` publish case through that bounded refetch loop plus up to two throttled queue cycles before surfacing pending sync.
- If GitHub sync fails after one or more local saves, the pending remote-sync queue stays paused until the user explicitly retries from Workspace Status instead of restarting automatically on the next local save.
- `Network & Logs` must archive finished, failed, or cancelled work immediately after it leaves `Future` or `Active`, and explicit retry must create a fresh live queue row while keeping the failed history visible in `Archive`.
- The processing-log surface is observational only; logging a queue row must never become a prerequisite for the actual access check, local save, or GitHub sync to continue.
- The main board and detail panes fill their split-view height, and any scrolling happens under a fixed top header row instead of scrolling the header out of view.
- macOS exposes a Settings/Preferences surface where users can enable a custom app background tint, choose its color, adjust its strength, and reset to the default look, and that preference persists across relaunches.
