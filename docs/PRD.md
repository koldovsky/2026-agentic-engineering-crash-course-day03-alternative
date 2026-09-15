# Token Atlas — product requirements

Implementation baseline: 2026-09-15. Workshop: **90-minute guided demo**.

## Problem and outcome

Teams use Claude Code and Codex on separate machines. A lead needs one view of
token consumption, estimated API-equivalent cost, and human prompts without
uploading logs to a service. Contributors need a simple file exchange workflow.

## People and jobs

- Contributor: collect local usage, inspect it, export a file for the team.
- Lead: combine contributors' files; compare providers, models, members, dates,
  sessions and machines without duplicate counting.
- Participant: see intent become specs, working software and living documentation.

## MVP requirements

| ID | Requirement | Evidence |
| --- | --- | --- |
| P1 | Run on localhost with persistent local storage and no API key | Start, import, restart |
| P2 | Show tokens, estimated USD cost, sessions, members, trends and breakdowns | Synthetic dataset |
| P3 | Filter by provider, member, model and UTC date interval | Aggregation/UI tests |
| P4 | Parse supported Claude Code and Codex JSONL, report malformed/unsupported usage | Provider fixtures |
| P5 | Collect human prompt text when selected; exclude model/tool/system/developer content | Negative-content tests |
| P6 | Explicit collector CLI for local folders; browser can import raw JSONL | CLI fixture smoke test |
| P7 | Versioned file import/export with machine/member attribution and idempotent merging | Round trip/repeat tests |
| P8 | Exclude prompts from export by default; explicit inclusion choice | Export test |
| P9 | Search prompts with provider/member/session/date context | UI acceptance |
| P10 | Explicit synthetic demo separate from real persisted usage | Demo/local switch |
| P11 | Apply supplied Claude Design system after contents can be inspected | Pending accessible reference |
| P12 | Save SDD steps, decisions, failures, verification and replay points | Guide, build log and Git tags |

## Product rules

- Totals represent observed supported records, not complete billing.
- Costs are **API-equivalent estimates**, not subscription charges. Unknown
  model/rate combinations are unpriced, never silently assigned zero cost.
- Input/cache-read/cache-write/output buckets are disjoint. Reasoning is a subset
  of output and is never counted or priced again.
- Stable machine IDs persist across exports. Member labels are self-reported,
  not authenticated identities. Transfers are voluntary, manual team sharing.
- No home scan on page load. CLI collection runs only when invoked. Raw records
  and model outputs are never persisted. Prompt collection is selectable.
- Prompt export is explicit. No false promise of automatic secret redaction.
- Empty/error/unpriced states and import diagnostics are visible. Demo data never
  silently replaces failed or empty real data.

## Boundaries

This is one local database aggregating team exports. Hosted multi-user deployment,
auth, live agents, automatic sync, billing/seat management, currency conversion,
remote filesystem access, model output collection and all historical log formats
are outside the MVP. Vercel skills guide development; deployment is not required.
Prompt completeness depends on retained logs and recognized human-message records.

## Design dependency

Reference: https://claude.ai/design/p/11d811f0-bff6-4af8-8346-c5abe5f00231?via=share

The page redirects to sign-in. Exact tokens/layouts remain unknown. A centralized,
provisional theme allows replacement later; no fidelity claim until inspection.

## Delivery sequence

0. Bootstrap framework, Git, OpenSpec and Vercel skills.
1. Save PRD, architecture, data contract, design dependency and workshop outline.
2. `01-usage-ledger`: normalized records, SQLite, pricing and aggregation.
3. `02-local-ingestion`: provider adapters, human prompts, explicit collector CLI.
4. `03-team-exchange`: atomic file import and privacy-aware export API.
5. `04-dashboard`: responsive product flows and browser verification.
6. `05-reference-design`: match the actual design after access is restored.

Each implemented change has proposal → scenarios → design → tasks → code → checks
→ archive. The initial request authorizes build; no fictitious review approvals
are recorded. During the workshop, pause visibly between proposal and apply.
