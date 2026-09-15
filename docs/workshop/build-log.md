# Actual build log

## 00 — bootstrap (2026-09-15)

- Empty directory, no Git repository. Scaffolded Next16.3.5/React19.2.8, TypeScript,
  App Router, Tailwind and ESLint.
- Installed OpenSpec1.13.0 locally; `init --tools codex,claude --profile core`.
- Installed official Vercel React best practices for Codex and Claude Code.
- Discovery: next-best-practices moved from next-skills into bundled Next docs.
- Added Vitest, Playwright, Zod, Node24 requirement and loopback-only scripts.
- Registry downloads required sandbox escalation, then succeeded. Install reported
  zero vulnerabilities. Replay point: `workshop-00-bootstrap`.
- Claude Design requires sign-in; requested access, fidelity remains pending.
- User chose **90-minute guided demo**.

## 01 — intent and architecture

- PRD, technical decisions, data contract and design dependency saved before features.
- Chose SQLite, file exchange, explicit collection, optional prompt capture,
  prompt-free default exports, API-equivalent pricing and isolated demo data.
- Four implementation changes; design integration pending reference access.
- User requested plan and build. No invented human approval checkpoint.

## 02 — usage ledger

- Authored/validated 01-usage-ledger before implementing schema, SQLite, rates,
  aggregates and isolated demo data. Prepared the next ingestion spec while tests ran.
- Verification: npm run check passed (21 tests across5 files), lint, generated route
  types/TypeScript, and strict OpenSpec validation. Persistence tested by reopening
  a temporary SQLite file; conflicting imports rolled back all additions.
- Fixed test fixture placement to avoid registering the same tests twice; switched
  Vitest config to .mts to remove ambiguous module loading.
- Seed is84 fictional usage events and84 prompts,42 sessions,4 members/5 machines.
- API prices preserve unpriced coverage. Node24 SQLite uses no native addon.

## 03 — local ingestion

- Implemented the validated02-local-ingestion adapter and collector tasks after
  archiving the ledger. Supported shapes/limits are documented in providers.md.
- Added Claude repeated-ID/cache handling and human-only prompt filtering; Codex
  response accounting and cumulative deltas with reset/coverage diagnostics.
- CLI smoke: samples/claude + samples/codex produced3 usage records,2 prompts,
  5,200 tokens. No MUST_NOT_BE_COLLECTED marker reached the output.
- Verification: npm run check passed,63 tests across7 files. Includes oversize
  files, symbolic-link skipping, malformed JSONL, excluded content and limits.
- Review follow-up fixed canonical timestamps and transactional read snapshots.
- Lockfile refreshed online after offline npm cache lacked an optional package.
- Replay point: workshop-03-ingestion. No real session directories were read.
