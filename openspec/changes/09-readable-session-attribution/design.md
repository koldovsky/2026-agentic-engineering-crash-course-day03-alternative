## Context

See proposal.md. Portable v1 makes machine attribution immutable during merge.
The present UI exposes OS username and session ID directly; no session title or
project metadata exists, and summary requests intentionally omit prompt text.

## Goals / Non-Goals

Keep portable data and accounting unchanged while making local presentation usable.
No real transcript rescan, provider heuristics, new title extraction, session-specific
prompt filtering, or new transfer schema. The source provider is not authenticated;
this change makes its meaning clearer rather than claiming provenance verification.

## Decisions

- Store optional member/label overrides in a separate SQLite table keyed by machine
  ID. Preserve ledger.read and getBundle for exports. Add getDisplayBundle for page,
  summary, prompt and machine presentation. This avoids mutating portable attribution
  and causing merge conflicts on old files. Do not modify records or prompts.
- Add guarded PATCH /api/machines with strict { machineId, member, label }; DELETE
  accepts strict { machineId } to reset. Validate names with the existing label rules.
  Return 404 for absent machine; use existing same-origin loopback checks. Demo
  Sources has no edit controls. No source selector accepted by mutation routes.
- Presentation fallback matches only known legacy CodexSandboxOffline and
  CodexSandboxOnline labels, not arbitrary names containing Codex. New defaults use
  Local user; existing defaults read canonical attribution only if a ledger already
  exists. No directory traversal. Existing saved import preferences remain valid.
- Sources provides local display-name forms and imported-attribution details. Form
  success refreshes data and clears obsolete member filter if needed. Show provenance
  copy so aliases cannot be mistaken for authenticated identities or portable edits.
- Session rows show "Session · <first observed UTC time>", member/computer context,
  and expandable full identifiers. First observed time is scoped to filters, not a
  claim about true chat creation time. Keep provider/model columns; remove the link
  that appeared to open a specific session while only filtering member/provider.
- Backend worker owns storage, display query helper, import defaults, API and unit
  tests. Root owns React/CSS, browser tests, integration and acceptance. Lesson worker
  owns day04 documentation and a staged slide fragment. Integrate only after contracts.

## Risks / Trade-offs

- Local aliases do not travel in exports -> explicit UI copy, export invariance test.
- Unknown identity has a neutral label -> user can assign a name; do not invent one.
- Same display names group together as existing member grouping already does ->
  retain distinct machine IDs and expose computer context.
- Screenshot similarity misses semantic mistakes -> separate attribution/provider
  assertions plus independent inspection of page context and actual-size crops.

## Migration Plan

Create the additive preference table when opening the ledger; leave portable v1
and original machine payloads unchanged. Existing data gets a presentation-only
fallback; no automatic user-specific alias is written. Reset removes preferences.
Reverting UI/query usage ignores the additive table without damaging records.
