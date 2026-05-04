# AGENTS.md

Purpose: this repository is optimized for safe, autonomous Codex work.
Start here. Use this file as the map of what is real today and how to extend it safely.

## Repository shape

## First reads
Before non-trivial work, read in this order:

1. `docs/ARCHITECTURE.md`
2. `docs/PLANS.md`
3. `docs/ideas/README.md` when the work is exploratory or you are promoting an existing idea
4. `docs/EXECUTION_GUIDE.md`
5. the relevant file under `docs/product-specs/`
6. the relevant file under `docs/ideas/backlog/` if one exists
7. the nearest nested `AGENTS.md`
8. relevant files under `docs/references/`

## Required workflow
- For exploratory or pre-implementation work:
  - capture or update the idea in `docs/ideas/index.md`
  - create or update a fuller brief under `docs/ideas/backlog/` before the work turns into an execution plan
- For any task likely to span more than ~30 minutes, more than one module, or any architectural choice:
  - create or update an ExecPlan in `docs/exec-plans/active/`
  - do not use `docs/ideas/` as a substitute for an ExecPlan once implementation starts
- Search before adding:
  - do not assume functionality is missing
  - search for existing types, route helpers, provider adapters, smoke scripts, and docs guidance
- Prefer one meaningful change per loop
- Keep changed guidance in sync:
  - user-visible behavior change -> update the relevant product spec
  - boundary or module change -> update `docs/ARCHITECTURE.md`
  - reliability/security posture change -> update the matching doc
  - prompt asset or eval workflow change -> update `prompts/`, `evals/`, and the matching product spec plus README
  - repeated correction -> update the nearest `AGENTS.md` or create a skill
- After code changes:
  - run the narrowest relevant tests first
  - if the change is a major feature implementation or changes an end-to-end patient/doctor workflow, run `npm run test:e2e`
  - then run `npm run verify`
  - then run `npm run verify:docs`
  - then run `npm run verify:execplan` when an active ExecPlan changed
- Before finishing:
  - review diffs for doc drift
  - refresh generated knowledge artifacts when the tree or quality ledger changed
  - update `docs/IMPLEMENTATION_LOG.md` when work followed an active ExecPlan

## Invariants
- parse all external input at the boundary
- no raw Twilio webhook payloads in business logic
- no direct external SDK use outside provider/adapters
- parse env/config once and pass typed config around
- do not log full inbound message bodies
- user-visible behavior changes require tests and spec updates
- public interfaces require logs, failure signals, and a smoke path
- the dashboard is internal-only until auth is added

## Where truth lives
- architecture map: `docs/ARCHITECTURE.md`
- execution-plan standard: `docs/PLANS.md`
- ideation backlog and prioritization rules: `docs/ideas/`
- security rules: `docs/SECURITY.md`
- reliability rules: `docs/RELIABILITY.md`
- quality ledger and debt register: `docs/QUALITY_LEDGER.md`
- product requirements: `docs/product-specs/`
- condensed references: `docs/references/`
- execution guide: `docs/EXECUTION_GUIDE.md`
- implementation log: `docs/IMPLEMENTATION_LOG.md`

## Automatic maintenance
- knowledge-base CI validates required docs and the generated repo map
- quality-gc refreshes the quality timestamp and repo map on a schedule
- the ideation backlog can be validated directly with `npm run verify:ideas`
- active ExecPlans can be validated directly with `npm run verify:execplan`
- if a workflow repeats twice, convert it into a skill under `.agents/skills/`

## Codex surfaces
- CLI-native surfaces:
  - `AGENTS.md`
  - `docs/ARCHITECTURE.md`
  - `docs/PLANS.md`
  - `docs/ideas/`
  - `.codex/config.toml`
  - `npm run verify`
  - `npm run verify:ideas`
  - `npm run verify:docs`
  - `npm run verify:execplan`
  - `npm run knowledge:refresh`
- Codex app-only convenience surfaces:
  - `.codex/local-environment.yaml` setup and actions
  - these actions must only mirror real commands that still work from the terminal
  - the default first-run path is: `npm install`, `npm run hooks:install`, then use the local-environment actions for routine verify and knowledge tasks when running inside the Codex app
- Optional capture surface:
  - `npm run capture:screencast`
  - `npm run capture:screencast:run`
  - these are convenience helpers for visible workflow evidence only and are not part of the required verify gate

## Commands
- install: `npm install`
- dev server: `npm run dev`
- start server: `npm run start`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- unit tests: `npm run test:unit`
- git hook tests: `npm run test:git-hooks`
- integration tests: `npm run test:integration`
- webhook smoke: `npm run test:webhook-smoke`
- eval smoke: `npm run test:eval-smoke`
- loopback e2e: `npm run test:e2e`
- voice smoke: `npm run test:voice-smoke`
- live prompt evals: `npm run eval:patient-agent -- --versions v1`
- repo verify: `npm run verify`
- idea backlog verify: `npm run verify:ideas`
- docs verify: `npm run verify:docs`
- ExecPlan verify: `npm run verify:execplan`
- regenerate knowledge artifacts: `npm run knowledge:refresh`
- install git hooks: `npm run hooks:install`
- record screencast: `npm run capture:screencast -- --output artifacts/screencasts/<feature-name>.mp4`

## PR expectations
- include acceptance evidence
- include changed docs where applicable
- include exact commands run
- include screencast evidence for new or materially changed visible workflows when capture is possible
- include remaining risks and follow-ups

## Commit messages

- Every commit message must include exactly one Git trailer named `AI-Model`.
- Use `AI-Model: <model-version>` when an AI model was used, for example `AI-Model: gpt-5.5`.
- Use `AI-Model: none` when no AI model was used.
- The `.githooks/commit-msg` hook enforces this policy after `scripts/install-git-hooks.mjs` configures `core.hooksPath`.

## Code comments

- When adding or reviewing TypeScript/JavaScript comments, use the `high-quality-code-comments` skill.
- Comments should explain contracts, invariants, edge cases, tradeoffs, failure modes, and external coupling. Do not add comments that restate obvious code. Prefer better names, types, or structure over comments when possible.
- Prioritize contract-first comments near public APIs, hardware/control boundaries, retries/timeouts, auth/privacy boundaries, state machines, concurrency, schema transformations, vendor/API assumptions, and code that looks weird but is intentional.
