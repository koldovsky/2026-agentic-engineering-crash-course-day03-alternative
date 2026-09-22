## Context

Read-only ledger counts confirmed Codex usage but zero Codex prompts. A targeted
shape-only inspection of the known current root rollout found no legacy
`user_message` events and explicit `item_completed` / `UserMessage` records.
Raw message text was not printed or copied into fixtures. A user-role model
response item remains insufficient evidence: it can contain injected context.

## Goals / Non-Goals

Support submitted text in the observed current format and legacy format with
stable IDs, privacy exclusions and repeat-import behavior. Do not infer prompts
from arbitrary response items, extract attachment contents, or migrate/delete
existing records. No automatic collection of the user's real history.

## Decisions

- Accept only explicit `event_msg` completed `UserMessage` items, plus existing
  legacy events. Read text content blocks; omit non-text attachments. Reject
  malformed or unsupported text-bearing content conservatively with diagnostics.
- Apply existing generated-origin, synthetic, generated-text and subagent checks
  at entry, event, item and text-block boundaries where applicable. Subagent
  session metadata must include current `thread_source` classification where
  supported by observed/source evidence; unsupported explicit origins fail closed.
- Use the completed item's client ID, then item ID, then a deterministic fallback.
  Prefer existing legacy representation when the same client identity appears in
  both formats, preserving the old timestamp/ID. Distinct submissions with equal
  text remain distinct. Never collapse messages by text alone.
- Preserve usage code and existing legacy prompt identities. Re-import with
  explicit prompt consent adds prompts to the existing machine and deduplicates
  usage. Export still excludes prompts by default.

## Risks / Trade-offs

Codex rollout formats are not a stable public API. Support is bounded by checked-in
synthetic fixtures and primary source evidence. Unsupported/ambiguous inputs must
remain excluded with content-free diagnostics. Current text-bearing items may
include user-supplied quoted material; do not invent provenance or silently claim
all retained history is complete.

## Verification

Reproduce zero prompts before the fix with a synthetic current-format file. Check
current/legacy/mixed formats, repeated identical submissions, malformed items,
subagents, generated blocks, attachments and opt-out. Run bounded import/backfill
tests, browser provider/search/privacy/repeat acceptance, full check and build.
Record real results; restart the local app. The user explicitly re-imports real
data with the prompt checkbox to backfill their ledger.
