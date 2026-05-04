# Coding Standards

Purpose: define coding standards for this repository as it exists today.

This document is intentionally repository-specific. It is not a generic engineering handbook and should not try to cover stacks, tools, or deployment targets that this repo does not use. When this repo changes, update this file with concrete standards tied to the actual codebase, paths, commands, and failure modes here.

## How To Use This Document

- Prefer standards that name real files, commands, and boundaries in this repo.
- Remove guidance for technologies that are not present in the tree.
- Keep broadly strong engineering rules only when they apply directly here.
- When adding a new runtime, framework, or subsystem, add standards for that exact surface instead of pasting generic best practices.

## Scope Of This Repo

Today this repository is a Codex-work harness with:

- repository governance docs under `docs/`
- implementation workflow notes under `.agents/`
- Node-based project automation wired through `package.json`
- Python knowledge-maintenance scripts under `scripts/knowledge/`
- git-hook enforcement under `scripts/git-hooks/`

Standards in this file should stay anchored to those surfaces unless the repo grows beyond them.

## Core Standards

These rules are broadly strong and apply directly to this repo:

- Readability over cleverness. Favor code and docs that a new contributor can understand quickly.
- Small, single-purpose units. Keep scripts, modules, and docs narrowly scoped.
- Fail fast at boundaries. Validate inputs early and emit explicit failures instead of silent fallbacks.
- Document the why. Comments and docs should explain constraints, invariants, and coupling rather than restating obvious code.
- Prefer modification over addition. Reuse existing scripts, docs, and workflows before creating new ones.

## Repo-Specific Standards

### Documentation Must Match The Repo

- `AGENTS.md` is the top-level contributor contract. New guidance must align with it, not compete with it.
- `docs/ARCHITECTURE.md` is the architecture map. Update it when boundaries, module ownership, or trust assumptions change.
- `docs/PLANS.md` defines the ExecPlan standard. Use an ExecPlan for work that is architectural, cross-cutting, or likely to exceed a short edit loop.
- `docs/QUALITY_LEDGER.md` tracks structural quality and debt. Update it only when the code, tests, or docs materially justify a change.
- Do not leave generic placeholder guidance that could describe any repository. If a section cannot name this repo's actual behavior, either tighten it or remove it.

### Scripts And Automation

- Prefer extending existing `npm` scripts and repo automation before adding ad hoc commands.
- Keep knowledge-maintenance logic in `scripts/knowledge/` and hook-specific logic in `scripts/git-hooks/`.
- If a script enforces repository policy, make the policy visible in docs near the contributor workflow.
- Generated knowledge artifacts must be reproducible from committed scripts.

### Verification

- After relevant code or doc changes, run the narrowest useful checks first, then the repo-level verification path required by `AGENTS.md`.
- For this repo, the default repo-wide checks are `npm run verify`, `npm run verify:docs`, and `npm run verify:execplan` when an active ExecPlan changed.
- When repo structure or tracked knowledge artifacts change, run `npm run knowledge:refresh`.
- Do not claim a rule is enforced unless a script, hook, or verification path actually enforces it.

### Comments And Explanations

- Prefer better names and tighter structure over explanatory comments.
- Add comments when code carries non-obvious contracts, invariants, retry behavior, or tool coupling.
- Avoid decorative file-header boilerplate unless the repo explicitly adopts and enforces it. This repository currently does not.

### Adding New Standards

When adding to this file:

- name the exact surface the rule applies to
- reference the real file, command, or directory
- explain the failure mode the rule prevents
- avoid copying vendor- or framework-generic guidance without adapting it to this repo

## Anti-Patterns

The following do not belong in this file unless the repo actually adopts them:

- language sections for runtimes not present in the codebase
- deployment guidance for infrastructure the repo does not operate
- naming, header, or licensing rules that are not enforced here
- aspirational process language with no owner, command, or validation path

## Maintenance Rule

Treat this file as a sharp local contract, not a generic template. If a future reader could apply a rule unchanged to almost any repo, the rule is probably too generic for this document and should be rewritten or removed.
