# ADR-0001: Adopt the existing Token Atlas stack as-is under Project Factory

- **Status:** Accepted
- **Date:** 2026-09-22
- **Deciders:** user (course author) + orchestrator, during `/project-factory:onboard --tools=claude --no-reverse`

## Context

Token Atlas is an existing, green codebase: Next.js 16.3.5 (App Router, TypeScript strict), React 19.2,
Node 24 (`engines`), local SQLite, Vitest 5 (172 unit/API tests), Playwright 1.63 (21 browser journeys),
ESLint 9 flat config, Prettier, OpenSpec 1.13 via `scripts/openspec.mjs` with four living specs and an
archive of eight completed changes. CI (`.github/workflows/ci.yml`) already runs `npm run check`, the
build and the e2e suite on Node 24. Onboarding installs the factory's loop; it must not migrate the stack.

## Decision

We will keep every stack choice above unchanged and install the Project Factory loop next to it in
merge mode: agents, workflows, deterministic `scripts/*.mjs` checks, git hooks, the Claude Code
PostToolUse lint hook, quality/retro configs and the lessons region in `AGENTS.md`. The reverse-engineered
baseline is skipped (`--no-reverse`): legacy code stays outside the requirement chain; only new slices are
governed by the gates. Adaptations to the copied checks are recorded in `factory-lock.json`.

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| Keep the stack, install the loop (chosen) | zero product risk; gates run today | legacy has no requirement ids or acceptance evidence |
| Reverse-engineer the baseline (full onboard) | whole codebase in the trace chain | hours of model time; edits four living specs; not needed to demonstrate one new slice |
| Migrate to the factory's default stack | matches reference scripts verbatim | rewrites a working product for tooling's sake |

## Consequences

- New work runs the full gated slice loop (spec → red tests → green → battery → review-gate → archive).
- `gate-status` and `check-traceability` report legacy code as outside the chain; that is the honest state,
  not a defect to hide.
- `test:integration` and `test:coverage` are not defined: there is no DB test layer and no coverage tool
  installed, and an echo stub would be flagged NOT-EARNED by the factory's own scan.
