# SECURITY.md

This document defines the current security posture.

## Security goals

## Active trust boundaries
For each trust boundary, we list the relevant threats and required controls to mitigate those threats. This is not an exhaustive threat model but rather a summary of the most relevant issues for this project.


## Secrets and credentials
- `DATABASE_URL` is required and must point to a non-production-safe environment unless explicitly intended otherwise

## Security review triggers


## Tests and validation
Security-relevant changes should include:
- malformed payload tests
- invalid-signature tests
- valid-signature tests
- claim-race regression tests
- smoke verification 