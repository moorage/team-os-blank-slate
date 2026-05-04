# new-codex-project-harness

This repository carries a small Codex-oriented project harness.

Install the Git hooks with:

```sh
npm run hooks:install
```

Every commit message must include exactly one Git trailer:

```text
AI-Model: gpt-5.5
```

Use `AI-Model: none` when no AI model was used.

Run the focused hook tests with:

```sh
npm run test:git-hooks
```
