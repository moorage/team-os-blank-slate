# ARCHITECTURE.md

This document is the top-level code map for the Team OS reference repository.

## System overview

Purpose:

The repository stores product workflow state and product context in the same tree so humans and Codex can inspect, validate, and update work without relying on hidden systems of record.

The current user flow is:

1. Read or update canonical work state in `kanban/cards/**`.
2. Link durable supporting context in `product-development/**`.
3. Run `kanban/scripts` commands to validate state and regenerate views.
4. Use `.agents/skills/**` for repeatable Codex workflows.
5. Use `apps/native/TeamOSCore` and `apps/native/TeamOSApps.xcodeproj` to inspect repository readiness and branch/PR mutation context from Apple clients.

## Active modules

### Kanban data model

Purpose:

Store the canonical workflow state, audit history, and generated operator views.

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
- `product-development/engineering/**`
- `product-development/analytics/**`
- `product-development/launches/**`

### Native app stack

Purpose:

Provide shared GitHub mutation logic plus thin Apple-platform shells that surface repository access, validation state, branch sessions, and pull-request context.

Current files:

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
- `kanban/cards/**/events/*.yaml` is the canonical audit-history layer.
- `kanban/views/*.md` is generated output and never the source of truth.
- `product-development/**` stores durable linked artifacts and should not duplicate the current-state fields from cards.
- `apps/native/TeamOSCore` may plan and validate file mutations, but future UI layers must not bypass its repo-access gate.

## Boundary rules

- Parse file formats at load boundaries inside `kanban/scripts/src/schemas.ts` and `kanban/scripts/src/load.ts`.
- Keep filesystem writes centralized in the CLI surfaces that render views or write validation reports.
- Treat GitHub authentication and pull request writes as protocol boundaries inside `apps/native/TeamOSCore`.
- Keep SwiftUI app targets in `apps/native/AppShared/**`, `apps/native/TeamOSMacApp/**`, and `apps/native/TeamOSiOSApp/**` thin; they may orchestrate `TeamOSCore`, but they must not construct GitHub write requests directly.
- Do not let generated views become inputs to business logic.

## Cross-cutting concerns

### Observability

- Validation writes `kanban/views/validation-errors.md` on every run.
- Rendered views are committed so diffs expose workflow drift.

### Security

- No secrets live in Team OS files.
- Native writes are implemented as gated branch/PR operations only.

### Reliability

- Validation must fail loudly on malformed cards, events, comments, broken links, and state/history mismatches.
- Render output must be deterministic so Git diffs are stable.

## Where common changes belong

- schema or rules change: `docs/KANBAN_SCHEMA.md` and `kanban/scripts/src/*`
- product artifact convention change: `product-development/**` and `docs/TEAM_OS_SPEC.md`
- workflow step or ritual change: `docs/OPERATING_RHYTHM.md`
- native write contract change: `docs/NATIVE_APPS.md` and `apps/native/TeamOSCore/**`
- native shell or build-target change: `apps/native/AppShared/**`, `apps/native/TeamOSMacApp/**`, `apps/native/TeamOSiOSApp/**`, and `apps/native/scripts/generate_xcodeproj.rb`

## Maintenance rules

Update this file when:

- a new active runtime package is added
- trust boundaries or import direction change
- a generated-view contract changes
- a repeated architecture review comment appears more than once
