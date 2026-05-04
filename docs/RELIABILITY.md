# RELIABILITY.md

This document defines current reliability expectations.

## Reliability goals


## Active service expectations

### Startup
- `GET /health` must stay available for quick verification


## Required telemetry

Do not capture in logs:

## Retry policy


## Startup and smoke checks
- health endpoint: `GET /health`
- metadata endpoint: `GET /`
- dashboard smoke surface: `GET /dashboard`
- smoke commands:
  - `npm run test:e2e`
  - `npm run test:eval-smoke`
  - `npm run test:webhook-smoke`
  - `npm run test:voice-smoke`
  - `npm run verify:execplan`

Optional capture helper:
- `npm run capture:screencast -- --output artifacts/screencasts/<feature-name>.mp4`
- this command is environment-dependent and is not part of the required repo-safe verification path

## Incident learning loop
After a material incident:
- add or update a regression test or eval case
- update this file if the failure exposed a missing invariant
- update `docs/QUALITY_LEDGER.md` if the issue reflects structural debt
