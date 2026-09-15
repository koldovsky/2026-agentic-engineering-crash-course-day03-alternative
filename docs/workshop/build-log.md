# Actual build log

## 00 — bootstrap (2026-09-15)

- Empty directory, no Git repository. Scaffolded Next 16.3.5/React 19.2.8, TypeScript,
  App Router, Tailwind and ESLint.
- Installed OpenSpec 1.13.0 locally; `init --tools codex,claude --profile core`.
- Installed official Vercel React best practices for Codex and Claude Code.
- Discovery: next-best-practices moved from next-skills into bundled Next docs.
- Added Vitest, Playwright, Zod, Node 24 requirement and loopback-only scripts.
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
- Verification: npm run check passed (21 tests across 5 files), lint, generated route
  types/TypeScript, and strict OpenSpec validation. Persistence tested by reopening
  a temporary SQLite file; conflicting imports rolled back all additions.
- Fixed test fixture placement to avoid registering the same tests twice; switched
  Vitest config to .mts to remove ambiguous module loading.
- Seed is 84 fictional usage events and 84 prompts, 42 sessions, 4 members/5 machines.
- API prices preserve unpriced coverage. Node 24 SQLite uses no native addon.

## 03 — local ingestion

- Implemented the validated 02-local-ingestion adapter and collector tasks after
  archiving the ledger. Supported shapes/limits are documented in providers.md.
- Added Claude repeated-ID/cache handling and human-only prompt filtering; Codex
  response accounting and cumulative deltas with reset/coverage diagnostics.
- CLI smoke: samples/claude + samples/codex produced 3 usage records, 2 prompts,
  5,200 tokens. No MUST_NOT_BE_COLLECTED marker reached the output.
- Verification: npm run check passed, 63 tests across 7 files. Includes oversize
  files, symbolic-link skipping, malformed JSONL, excluded content and limits.
- Review follow-up fixed canonical timestamps and transactional read snapshots.
- Lockfile refreshed online after offline npm cache lacked an optional package.
- Replay point: workshop-03-ingestion. No real session directories were read.

## 04 — team exchange

- Implemented 03-team-exchange after ingestion verification/archive.
- Preview validates without record writes; imports atomically dedupe machine-bound
  usage/prompts; default export is prompt-free, inclusion explicitly selectable.
- Added real route integration tests against temporary SQLite, including conflict
  rejection, unchanged totals, prompt search and default/opt-in downloads.
- HTTP checks enforce loopback host, same-origin JSON mutations, no-store and
  actual streamed-byte limits. Oversize exports fail before creating a download.
- Verification: npm run check passed, 82 tests across 11 files; types/lint/spec valid.
- Replay point: workshop-04-exchange. No external data transmission.

## 05 — dashboard and final integration

- Implemented the validated 04-dashboard change: overview, team, prompt library,
  data sources and model pricing. URL filters preserve source and view; prompt
  text is read for the prompt view only. Empty, error and unpriced states are
  explicit, with separate synthetic demo navigation.
- Added browser preview/import controls and source-wide JSON download with
  prompts unchecked by default. Human prompt search is paginated; prompt-only
  imports also populate member/provider choices.
- Used the installed Vercel React skill for the server/client boundary and bundled
  Next.js documentation for async request APIs and the error boundary retry API.
- Follow-up review fixed empty-bundle round trips, invalid UTF-8 rejection,
  unknown model names that shadow Object prototype properties, and skip-link
  keyboard focus. Added regression checks for the substantive boundaries.
- Expanded verified pricing to 17 exact IDs. Unsupported cache-write rates remain
  unavailable; current GPT cache-write durations are documented explicitly.
- Added portable CLI wrappers to disable framework/tool telemetry, Prettier, and
  CI configuration. CI has not run remotely; the commands are verified locally.
- Initial browser export test timed out because it queried the native `summary`
  disclosure as a button. Corrected the test to target its visible label; all six
  functional browser journeys then passed against an isolated production server.
- Visual review found and fixed an SVG tooltip hydration mismatch by rendering
  one text value inside `title`. Browser tests now assert no runtime/hydration
  errors. Rate-card review also preserved the exact $0.175 cached-input rate
  instead of rounding it to cents, and made cache durations visible.
- Final checks on 2026-09-15: `npm run check` passed (98 tests across 12 files,
  lint, route types/TypeScript, strict spec validation); `npm run build` passed;
  `npm run test:e2e` passed all 8 journeys against the production build. Desktop
  and 375px screenshots were inspected; mobile overview/import have no page
  overflow. Keyboard skip navigation, opt-in prompt downloads, raw transcript
  import and original prompt search were verified.
- Archived 04-dashboard after verification; replay point: `workshop-05-dashboard`.
- The supplied Claude Design page remains inaccessible. No design fidelity or
  timed workshop rehearsal is claimed.
- Workshop review corrected the replay instructions: facilitator docs stay in
  the final checkout, checkpoint 04 demonstrates API tests, and the live planning
  exercise separates pricing from aggregation before applying code.

## Synthetic collector command used

```powershell
npm run collect -- --machine workshop-laptop --member "Workshop" --claude-root samples/claude --codex-root samples/codex --include-prompts --out exports/workshop-sample.json
```

Observed: 3 usage records, 2 human prompts, 5,200 tokens. For a replay, choose a
new output filename or explicitly use `--force` to replace that synthetic export.
