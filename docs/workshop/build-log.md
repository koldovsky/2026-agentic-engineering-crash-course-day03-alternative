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
