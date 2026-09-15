## Why

Contributors need a simple way to combine usage across machines without running
a server on each machine or sharing raw transcripts accidentally.

## What Changes

- Preview/import strict portable bundles or selected raw JSONL files.
- Export normalized usage, optionally including human prompts.
- Add loopback-only APIs for summaries, prompt search and transfer.

## Capabilities

### New Capabilities

- `team-exchange`: bounded, validated local file exchange and data access.

### Modified Capabilities

None. Uses ledger and ingestion capabilities.

## Impact

Adds Next.js route handlers and query/transfer services with security and atomicity
tests. No remote sync, credentials, deployment or authenticated team identities.
