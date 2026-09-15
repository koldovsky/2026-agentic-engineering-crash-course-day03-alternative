## Why

The dashboard needs one consistent accounting contract before it can compare
Claude Code and Codex. Incorrect cache semantics or duplicates distort totals.

## What Changes

- Define normalized usage, human prompts, machine attribution and portable v1 data.
- Persist immutable records and merge atomically with duplicate detection.
- Add exact-model estimated pricing, filters, aggregates and isolated demo data.

## Capabilities

### New Capabilities

- `usage-ledger`: consistent local usage accounting and pricing coverage.

### Modified Capabilities

None.

## Impact

Adds domain modules and unit tests under src/lib. No provider parsing or UI yet.
Uses the installed Zod and Node24 SQLite runtime. Implements PRD P1–P3 foundations.
