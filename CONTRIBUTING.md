# Contributing

Abbox Viewer is intended to accept open-source contributions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Setup

Node.js `>=22.12` is required.

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run format
```

Biome formats and lints the repository.

## Git workflow

`main` is the default branch and should remain in a working state. Develop meaningful changes on a short-lived branch, including work by maintainers, and merge that branch into `main` through a pull request.

```text
main
  ↓
short-lived branch
  ↓
commits
  ↓
pull request
  ↓
CI
  ↓
squash merge
  ↓
main
```

### Branches

Use a short name that describes the change, with one of these prefixes:

- `feat/` — new functionality
- `fix/` — bug fixes
- `docs/` — documentation-only changes
- `refactor/` — code restructuring without intended behavior changes
- `chore/` — tooling, configuration, dependencies, or maintenance

```text
feat/screen-source-display
fix/invalid-screen-entry
docs/viewer-readme
```

Branch names do not include contributor names, dates, issue numbers, or internal step names.

### Commits

Use a lightweight Conventional Commits message:

```text
type: short description
```

Common types are `feat`, `fix`, `test`, `docs`, `refactor`, and `chore`.

```text
feat: show unrecognized product fields
test: cover malformed screen entries
docs: describe client-side file loading
```

A commit is one understandable unit of work. Scopes such as `feat(ir):` are not used.

### Pull requests

A pull request should describe what changed, explain why, and mention important scope exclusions when they matter. Repository CI passes before merge. Keep each pull request to one coherent change.

### Merge

Squash and merge is the preferred strategy. The branch can keep intermediate commits, and `main` stays concise. Signed commits, a required number of reviewers, issue links, release branches, Git Flow, and a long-lived `develop` branch are not part of this workflow.

## Viewer changes

A new recognized Product IR section is an interpreter change, a section component, and tests. `src/ir/interpret.ts` is the only module that decides which keys are recognized. Do not add a plugin registry.

Preserve unknown fields. Do not coerce malformed recognized data into a valid shape.

## Scope

This repository visualizes one Product IR snapshot in the browser. Do not add a backend, database, authentication, persistence, analytics, compiler execution, GitHub integration, or Abbox Cloud features.
