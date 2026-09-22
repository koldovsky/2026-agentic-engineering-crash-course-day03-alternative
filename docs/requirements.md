# Requirements Document

**Token Atlas**

*Prepared for spec-driven delivery under Project Factory*

## 1 Overview

This file was created at onboarding on 2026-09-22 (`/project-factory:onboard --tools=claude --no-reverse`).
It currently numbers only the new slice **`11-usage-csv-summary`**: a "Download CSV" export of the model
breakdown that the dashboard shows under the active filters.

Legacy behaviour (local usage ledger, ingestion, team exchange, dashboard, prompt search, display names) is
documented in `docs/PRD.md` as **P1–P14** and is **outside the traceability chain by decision** (ADR-0001,
`--no-reverse`): legacy code carries no ids here, and `gate-status` / `check-traceability` report it as
outside the chain. That is the honest state, not a defect.

Id grammar follows the project's existing registry in `docs/workshop/day04/requirements.md`
(`FR-<AREA>-nn`, `NFR-<AREA>-nn`, `TC-<AREA>-nn`, `BC-<AREA>-nn`). Ids are assigned once and never
renumbered; later slices append new ids and mark changed rows.

## 2 Functional Requirements (FR)

Every row carries a **Verification** tag from the factory's closed vocabulary. Only two tags are declared
for this slice: `local-verifiable` (a repo test or script proves it deterministically) and `eval` (a graded
rubric case under `evals/cases/`). The `e2e`, `recording` and `vision-verify` mechanisms are not declared
for this slice and must not be added to rows before they are installed. `check-acceptance-methods` enforces
the declaration at G3 (mechanism exists) and from G4 on (fresh, threshold-passing artifact).

### 2.1 Dashboard export

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-CSV-01 | MVP | Dashboard export | The dashboard offers a "Download CSV" action that exports the model breakdown currently visible under the active filters (provider, member, model, UTC date interval) as a CSV file: one header row (model, total tokens, estimated cost USD, share of tokens as a percentage), one row per model in the table's order, UTF-8, plain numbers (dot decimal, no thousands separators, no currency symbol), file name `token-atlas-summary-<source>-<YYYY-MM-DD>.csv`. | local-verifiable |
| FR-CSV-02 | MVP | Dashboard export | CSV fields are escaped per RFC 4180: a field containing a comma, a double quote or a line break is wrapped in double quotes and inner quotes are doubled; rows end with CRLF; the output for a given summary is deterministic. | local-verifiable |
| FR-CSV-03 | MVP | Dashboard export | When no usage matches the active filters, the CSV action is disabled and the UI shows a short message that says no usage matches the current filters and names the way to widen them (clear or change the filters); the message is graded by an eval for clarity and actionability. | local-verifiable, eval |

> Rules: one testable behavior per FR; ids never renumbered; explicit exclusions live inside descriptions.

## 3 Non-Functional Requirements (NFR)

No NFR is numbered for this slice at onboarding. The input names none, and the day04 registry explicitly
refuses to import a performance SLO without a product decision, measurement conditions and a baseline.
Candidates (keyboard and label accessibility of the new control in the spirit of `NFR-ACCESS-01`; an
export-time budget for the largest realistic summary) are held in the onboarding clarification list.
Once ratified they are appended as `NFR-CSV-nn`; nothing is renumbered.

## 4 Constraints

### 4.1 Technical Constraints

| ID | Phase | Description | Verification |
|---|---|---|---|
| TC-STACK-01 | MVP | The slice inherits the existing stack unchanged: Node 24 (`engines`), Next.js App Router, TypeScript strict, npm lockfile — as registered in `docs/workshop/day04/requirements.md` and confirmed by ADR-0001. Evidence: `npm run check` and the build pass on the pinned revision. | local-verifiable |

### 4.2 Business / UX Constraints

| ID | Phase | Description | Verification |
|---|---|---|---|
| BC-PRIVACY-02 | MVP | The CSV never contains prompt text, session identifiers, machine host names, OS user names or file paths — only the aggregate model rows. This extends the existing privacy rule of P5/P8 (`docs/PRD.md`) and `BC-PRIVACY-01` (day04 registry) to the summary export. | local-verifiable |

## 5 Assumptions & Notes

- **ASSUMPTION** — The export is produced client-side from the already-loaded `UsageSummary` (no new API
  route), unless the spec-writer decides otherwise. The existing JSON export goes through `POST /api/export`;
  the CSV needs only `summary.byModel` and `summary.totals`, which the dashboard already holds.
- **ASSUMPTION** — "share" is the model's share of total tokens in the visible summary:
  `byModel[i].totalTokens / totals.totalTokens`, the same ratio the Share column renders today
  (`src/components/analytics.tsx`, `ModelBreakdown`).
- Legacy requirements **P1–P14** (`docs/PRD.md`) are not renumbered or restated here. They remain the source
  of truth for legacy behaviour; this file references them only where a new row extends a legacy rule.
- **ASSUMPTION** — `<source>` in the file name is the active data source (`local` | `demo`) and
  `<YYYY-MM-DD>` is the UTC date of the download, mirroring the existing JSON export name
  `token-atlas-<source>-<date>.json` in `src/components/transfer-controls.tsx` (`ExportControl`).
- **ASSUMPTION** — "the table's order" is the order `summarize()` returns for `byModel`
  (`src/lib/aggregate.ts`): total tokens descending, then model name ascending.
- **NOTE** — `byModel` rows are keyed by `(provider, model)`, so the same model name can appear twice when
  two providers report it. Whether the provider is folded into the model column or exported as its own
  column is open (clarification; not decided here).
- **NOTE** — The table renders "Unpriced" for models with zero priced events and a "partial" label when some
  events are unpriced. FR-CSV-01 requires plain numbers; the CSV representation of unpriced and partially
  priced cost is open (clarification; not decided here).
- **NOTE** — No `evals/` directory exists at onboarding. The `eval` tag on FR-CSV-03 requires a real rubric
  case under `evals/cases/` before G3; a spec restating the requirement does not count.
- **Inference confidence** — high for FR-CSV-01, FR-CSV-02, BC-PRIVACY-02 and TC-STACK-01 (grounded in
  `aggregate.ts`, `analytics.tsx`, `transfer-controls.tsx`, ADR-0001); medium for FR-CSV-03 (the empty-state
  wording is new product copy, graded by eval, not derived from existing code).
- **MVP summary** — three FRs plus two constraints; every row is `MVP`. No `Future` rows exist in this file.
