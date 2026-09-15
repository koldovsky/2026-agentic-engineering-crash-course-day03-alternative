## Why

Usage is useful only when contributors can turn local session files into the
normalized ledger without retaining assistant output or inflating repeated counts.

## What Changes

- Parse supported Claude and modern/legacy Codex JSONL with diagnostics.
- Extract original human prompts only when selected.
- Add explicit cross-platform collection CLI producing portable bundles.

## Capabilities

### New Capabilities

- `local-ingestion`: supported local transcript collection and normalization.

### Modified Capabilities

None. Consumes usage-ledger contract.

## Impact

Adds src/lib/parsers, collector service, scripts/collect.ts, synthetic fixtures
and parser/collector tests. No automatic scan or hosted provider integration.
