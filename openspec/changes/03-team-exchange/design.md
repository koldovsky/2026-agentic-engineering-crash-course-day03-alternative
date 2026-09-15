## Context

Usage ledger provides transactional merge and reads. Parser normalizes raw JSONL.
Transfer supports one local operator; identities are self-reported labels.

## Goals / Non-Goals

Local API and portable file transfer. No automated remote access or hosted auth.

## Decisions

- POST /api/import accepts kind=bundle with bundle, or kind=transcript with text,
  provider/machine/includePrompts. preview=true validates without persistence.
- POST /api/export accepts source=local|demo and includePrompts (defaults false).
  Content-Disposition produces a download; serialized byte limit checked first.
- GET /api/summary, /api/prompts and /api/machines separate data needs. Prompts
  have20-item pages; dates are inclusive UTC; unknown query values fail clearly.
- Route helpers bound actual request-stream bytes, sanitize errors and validate
  loopback Host, Origin equality and Fetch Metadata. No permissive CORS headers.
- JSON records render as text; no raw logs or whole prompt dataset in overview.

## Risks / Trade-offs

This is not authentication against other local processes. Explicit opt-in prompt
exports can contain secrets; no automatic redaction promise. A valid accumulated
dataset can exceed the byte export limit, so fail before download with guidance.

## Migration Plan

No schema change. Add behavior around existing ledger. Unit/API tests use temporary
databases and synthetic inputs, never real home folders.
