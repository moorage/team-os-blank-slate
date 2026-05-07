---
artifacts:
  - type: bug-investigation
    label: Allergy filter mismatch investigation
    path: >-
      product-development/engineering/bug-investigations/allergy-filter-mismatch.md
  - type: analytics
    label: Support incident summary
    path: >-
      product-development/analytics/investigations/allergy-filter-mismatch-support-patterns.md
  - type: feature-index
    label: Feature index entry
    path: product-development/feature-index.yaml
assignees:
  - backend-eng
board: bugs
collaborators:
  - ops
column_order: 1
created_at: '2026-05-04T09:40:00Z'
emoji: "\U0001F41B"
feature_index_key: allergy-filter-mismatch
id: KAN-2026-0002
owner: matt
priority: urgent
reviewers:
  - qa
severity: high
sitting_expected_action: >-
  Capture provider samples, confirm the mismatch shape, and update the bug
  investigation.
sitting_reason: >-
  Waiting for provider-side logs to explain why allergy exclusions differ
  between APIs.
sitting_since: '2026-05-04T10:45:00Z'
sitting_with: backend-eng
status: fixing
summary: >-
  The customer-facing allergy filter can show meals that the downstream scoring
  API later rejects.
title: Allergy filter mismatch
type: bug
updated_at: '2026-05-05T16:15:47Z'
watchers:
  - support
---
## Why this card exists

Support escalated multiple reports where the UI and the scoring service disagree about allergy exclusions.

## Next move

Backend engineering owns the blocker and needs to attach provider evidence before the card can move into fixing.
