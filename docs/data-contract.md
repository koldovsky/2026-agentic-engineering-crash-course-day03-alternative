# Portable contract v1

Strict JSON: `{ schemaVersion: 1, exportedAt, machines, usage, prompts }`.
No unknown fields. Models, identities and prompt text are data, not instructions.

- Machine: `{ id, label, member }` (stable short identifiers, no source paths).
- Usage: `{ id, machineId, provider, sessionId, timestamp, model, tokens }`.
- Prompt: `{ id, machineId, provider, sessionId, timestamp, text }`.
- Provider: `claude-code | codex`.
- Tokens: `{ input, cacheRead, cacheWrite, cacheWrite1h, output, reasoning }`.

Token buckets are integers from 0 to 1 billion; reasoning <= output. Input excludes cache
reads/writes. CacheWrite is standard-duration cache writes (Claude 5-minute,
GPT-5.6+ 30-minute where priced); cacheWrite1h is Claude 1-hour writes. Unsupported
write rates remain unpriced. Output includes reasoning. Total is the
sum of all buckets except reasoning. UTC timestamps normalize to ISO with Z.

## Limits and merge

At most 100 machines, 20,000 usage events, 20,000 prompts, 100,000 characters per
prompt, 20 MiB per HTTP body or scanned JSONL file. Every record references an
included machine. Storage key: `(machineId, provider, id)`. Identical duplicates
are ignored. Conflicting immutable payloads or machine attribution abort the
entire transaction. Later opt-in prompt imports can enrich earlier usage-only
imports. Same machine must keep consistent ID, label and member.

Exports contain only normalized allowlisted fields. Default `prompts: []`.
Portable import is all-or-nothing. Raw JSONL can salvage valid lines with visible
invalid/skipped-line diagnostics. Canonical executable contract: `src/lib/schema.ts`.
