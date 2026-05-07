# ARCHITECTURE.md

This document is the top-level code map for the Team OS reference repository.

## System overview

Purpose:

The repository stores product workflow state, team identity, and product context in the same tree so humans and Codex can inspect, validate, and update work without relying on hidden systems of record.

The current user flow is:

1. Read or update canonical work state in `kanban/cards/**`.
2. Read or update canonical board definitions in `kanban/boards/*.board.yaml` when board-level workflow metadata changes.
3. Resolve owners and routing aliases in `team/people/**` when identifiers need contact or handle context.
4. Link durable supporting context in `product-development/**`.
5. Run `kanban/scripts` commands to validate state and regenerate views.
6. Use `.agents/skills/**` for repeatable Codex workflows.
7. Use the shared `apps/native` submodule plus `native-app/TeamOSAppConfig.json` to inspect repository readiness and branch/PR mutation context from Apple clients.

## Active modules

### Kanban data model

Purpose:

Store the canonical workflow state, board-column appearance metadata, audit history, per-column ordering, and generated operator views.

Current files:

- `kanban/AGENTS.md`
- `kanban/README.md`
- `kanban/boards/*.board.yaml`
- `kanban/cards/**`
- `kanban/templates/**`
- `kanban/views/**`

### Kanban automation

Purpose:

Load, validate, render, and summarize Team OS state from the text files.

Current files:

- `kanban/scripts/src/*.ts`
- `kanban/scripts/test/*.test.ts`
- `kanban/scripts/package.json`

### Product context corpus

Purpose:

Store durable product artifacts linked from cards so workflow state is not detached from evidence and plans.

Current files:

- `product-development/feature-index.yaml`
- `product-development/product/**`
- `product-development/design/**`
- `product-development/customer-insights/**`
- `product-development/growth/**`
- `product-development/customer-journeys/**`
- `product-development/customer-success/**`
- `product-development/sales-enablement/**`
- `product-development/engineering/**`
- `product-development/analytics/**`
- `product-development/security-privacy-compliance/**`
- `product-development/platform-infrastructure-reliability/**`
- `product-development/support/**`
- `product-development/quality/**`
- `product-development/ux-writing/**`
- `product-development/pricing-packaging/**`
- `product-development/partnerships/**`
- `product-development/trust-safety/**`
- `product-development/localization/**`
- `product-development/accessibility/**`
- `product-development/marketing/**`
- `product-development/launches/**`

### Team directory

Purpose:

Store durable identity, handle metadata, optional public profile-image metadata for people, and optional canonical emoji for functional aliases referenced by Team OS cards.

Current files:

- `team/AGENTS.md`
- `team/README.md`
- `team/people/index.yaml`
- `team/people/*.yaml`

### Native app stack

Purpose:

Provide shared GitHub mutation logic plus thin Apple-platform shells that surface repository access, canonical repository-backed board/card/comment state, editable team-directory records, directory-backed mention assistance, validation state, branch sessions, and pull-request context.

Current files:

- `.gitmodules`
- `native-app/TeamOSAppConfig.json`
- `scripts/github_app/update_native_public_config.py`
- `apps/native/Package.swift`
- `apps/native/TeamOSCore/Sources/TeamOSCore/**`
- `apps/native/TeamOSCore/Tests/TeamOSCoreTests/**`
- `apps/native/AppShared/**`
- `apps/native/TeamOSMacApp/**`
- `apps/native/TeamOSiOSApp/**`
- `apps/native/TeamOSApps.xcodeproj/project.pbxproj`
- `apps/native/scripts/generate_xcodeproj.rb`

### Repository guidance

Purpose:

Keep the repo self-describing for Codex and human maintainers.

Current files:

- `AGENTS.md`
- `.agents/skills/**`
- `docs/KANBAN_SCHEMA.md`
- `docs/TEAM_OS_SPEC.md`
- `docs/OPERATING_RHYTHM.md`
- `docs/NATIVE_APPS.md`

## Layering rules

- `kanban/cards/**` is the canonical current-state layer for work items.
- `kanban/boards/*.board.yaml` is the canonical board-definition layer, including optional root board `emoji`, optional per-column `emoji`, optional quoted `light_background_hex` and `dark_background_hex` values such as `"#D97706"` for appearance metadata, and legacy `background_hex` fallback support.
- `kanban/cards/**/card.md` frontmatter includes canonical optional `emoji` metadata plus the canonical `column_order` field, which must stay contiguous within each `(board, status)` column.
- `kanban/cards/**/events/*.yaml` is the canonical audit-history layer.
- `kanban/views/*.md` is generated output and never the source of truth.
- `team/people/**` stores durable identity metadata for human and functional-alias identifiers used by cards, including optional public profile-image URLs for people and optional canonical emoji for functional aliases, and existing records there are now editable from the shared native shell through the repo-backed mutation bridge.
- `product-development/**` stores durable linked artifacts and should not duplicate the current-state fields from cards.
- `apps/native/TeamOSCore` may plan and validate file mutations, and it now also owns the tested directory and mention-resolution helpers used by the shared shell, but future UI layers must not bypass its repo-access gate.

## Boundary rules

- Parse file formats at load boundaries inside `kanban/scripts/src/schemas.ts` and `kanban/scripts/src/load.ts`.
- Keep filesystem writes centralized in the CLI surfaces that render views or write validation reports; native apps must reach canonical Team OS writes through the local CLI bridge in `apps/native/TeamOSCore/Sources/TeamOSCore/Workflow/LocalTeamOSRepositoryBridge.swift` instead of reimplementing markdown, comment, event, or board-YAML mutation rules in Swift.
- Keep contact, handle, optional public profile-image metadata for people, and optional canonical emoji metadata for functional aliases centralized in `team/people/**`; cards should reference stable identifiers instead of inlining handles.
- Keep the shared Apple client implementation in the `apps/native` submodule, and keep tenant-owned bundle IDs, default repositories, and public GitHub App metadata in `native-app/TeamOSAppConfig.json`.
- Treat GitHub App device-flow auth, token refresh, secure local session storage, and pull-request writes as protocol boundaries inside `apps/native/TeamOSCore`.
- Keep SwiftUI app targets in `apps/native/AppShared/**`, `apps/native/TeamOSMacApp/**`, and `apps/native/TeamOSiOSApp/**` thin; they may orchestrate `TeamOSCore`, but they must not construct GitHub write requests directly.
- Do not let generated views become inputs to business logic.

## Cross-cutting concerns

### Observability

- Validation writes `kanban/views/validation-errors.md` on every run.
- Rendered views are committed so diffs expose workflow drift, including per-column reordering, configured board-column appearance metadata, and the presence of empty board-defined columns.

### Security

- No secrets live in Team OS files.
- Native writes are implemented as gated local canonical mutations followed by branch/PR operations only.

### Reliability

- Validation must fail loudly on malformed cards, events, comments, broken links, and state/history mismatches.
- Render output must be deterministic so Git diffs are stable, including `column_order` sorting inside each board column.

## Where common changes belong

- schema or rules change: `docs/KANBAN_SCHEMA.md` and `kanban/scripts/src/*`
- team identity convention change: `team/**`, `docs/TEAM_OS_SPEC.md`, and `docs/SECURITY.md`
- product artifact convention change: `product-development/**` and `docs/TEAM_OS_SPEC.md`
- workflow step or ritual change: `docs/OPERATING_RHYTHM.md`
- native write, auth, or tenant-config contract change: `docs/NATIVE_APPS.md`, `native-app/TeamOSAppConfig.json`, `scripts/github_app/update_native_public_config.py`, and `apps/native/TeamOSCore/**`
- native shell, sample comment, directory-assisted UI, repo-backed directory editing, local board-appearance authoring, or shared native build-graph change: `apps/native/AppShared/**`, `apps/native/TeamOSMacApp/**`, `apps/native/TeamOSiOSApp/**`, and `apps/native/scripts/generate_xcodeproj.rb`
- ordered or board-appearance kanban contract change: `docs/KANBAN_SCHEMA.md`, `docs/product-specs/team-os-text-kanban.md`, `kanban/scripts/src/*`, and the relevant `kanban/boards/*.board.yaml`

## Maintenance rules

Update this file when:

- a new active runtime package is added
- trust boundaries or import direction change
- a generated-view contract changes
- a repeated architecture review comment appears more than once
