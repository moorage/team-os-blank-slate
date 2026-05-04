# Team OS Blank Slate

This repository is a working Team OS reference implementation for Codex.

It combines:

- a text-native kanban under `kanban/`
- durable product context under `product-development/`
- a canonical team directory under `team/`
- Codex workflow guidance in `AGENTS.md` and `.agents/skills/`
- buildable Apple clients under `apps/native/` that treat Git branches and pull requests as the only write path

## Repository layout

- `kanban/` — cards, append-only events, comments, board definitions, templates, generated views, and CLI scripts
- `product-development/` — PRDs, investigations, analytics notes, marketing artifacts, launch artifacts, and the feature index
- `team/` — people and functional-alias records for Team OS ownership and routing identifiers
- `apps/native/` — `TeamOSCore`, shared SwiftUI shells, and buildable macOS/iOS app targets
- `docs/` — architecture, schema, product spec, operating rhythm, native-app guidance, ideas, and ExecPlans

## Core commands

- `npm run team-os:typecheck`
- `npm run team-os:test`
- `npm run team-os:validate`
- `npm run team-os:render`
- `swift test --package-path apps/native`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSMacApp -configuration Debug -destination 'platform=macOS' build`
- `xcodebuild -project apps/native/TeamOSApps.xcodeproj -scheme TeamOSiOSApp -configuration Debug -destination 'generic/platform=iOS Simulator' build`
- `npm run verify`

## Local setup

```sh
npm install
npm run hooks:install
npm --prefix kanban/scripts install
```

Regenerate the checked-in Xcode project after target changes:

```sh
gem install xcodeproj --user-install
ruby apps/native/scripts/generate_xcodeproj.rb
```

## Commit policy

Every commit message must include exactly one `AI-Model` trailer, for example:

```text
AI-Model: gpt-5.4
```
