## Context

See proposal.md and `docs/requirements.md` (FR-CSV-01..03, BC-PRIVACY-02,
TC-STACK-01). `src/app/page.tsx` computes `summarize(bundle, query.filters)` on the
server and renders `Overview` only when `summary.totals.events > 0`; otherwise it
renders `EmptyUsage`. `ModelBreakdown` in `src/components/analytics.tsx` is a
server component that lists `summary.byModel` (sorted by `summarize()`: tokens
descending, then model name). `ExportControl` in `transfer-controls.tsx` already
downloads through Blob + object URL + anchor click. ADR-0001 keeps the stack as-is.

## Goals / Non-Goals

**Goals:** a one-click, filter-faithful CSV of the visible model rows; a pure,
deterministic generator with exhaustive unit tests; an honest empty state that is
reachable in the running app; no new privacy surface.

**Non-Goals:** a server CSV route, totals or provider columns, member/day/session
CSVs, spreadsheet formula hardening, a BOM, export-time budgets, changes to the
JSON export, portable v1, filters, pricing or prompt handling.

## Decisions

### Generate in the browser from the loaded summary (ADR-worthy)

`toSummaryCsv` runs client-side on the rows the page already holds; no
`GET /api/export/csv`. Trade-off: a route would give a `Content-Disposition`
header and JS-free download but needs request validation, loopback checks, a
second aggregation and route tests for data that is already on screen. The
dashboard's JSON export already requires JS, and `MAX_RECORDS` (20,000 events)
bounds the summary to a few hundred rows, so the browser path is sufficient.
Record as ADR-0002 if the team wants the precedent for future exports.

### Pure generator with a structural input type

```ts
// src/lib/csv-summary.ts — no I/O, no Intl, no Date.now, no storage imports
export type SummaryCsvInput = Pick<UsageSummary, "byModel" | "totals">;
export type SummaryCsvOptions = { costDecimals?: number; shareDecimals?: number }; // 6, 2
export const SUMMARY_CSV_HEADER = ["model", "total_tokens", "estimated_cost_usd", "share_percent"] as const;
export function toSummaryCsv(summary: SummaryCsvInput, options?: SummaryCsvOptions): string;
export function summaryCsvFileName(source: "local" | "demo", date: Date): string;
```

Rows follow `byModel` order verbatim; the generator never re-sorts. Cell rules:
`model` is the raw model id (no provider column; a name may repeat when two
providers report it, which is acceptable); `total_tokens` is the integer;
`estimated_cost_usd` is `toFixed(costDecimals)` with trailing zeros and a dangling
dot removed, an empty field when the row is fully unpriced (`events > 0` and
`pricedEvents === 0`, never `0`), and the priced sum without a marker when
partially priced; `share_percent` is `totalTokens / max(totals.totalTokens, 1) * 100`
with `toFixed(shareDecimals)` and no `%` sign (the header names the unit). Numbers
use dot decimals, no separators, no currency symbol, no locale. Every row,
including the header and the last row, ends with CRLF. A field containing a comma,
double quote, CR or LF is wrapped in double quotes with inner quotes doubled;
other fields are unquoted. Output has no BOM: byte-level determinism and RFC 4180
conformance are simpler, model ids are ASCII in practice, and the JSON export is
also plain UTF-8. The file name uses the UTC date of the injected `Date`, mirroring
`token-atlas-<source>-<date>.json`. The `Pick` input lets tests pass a hand-built
object and the control pass only what it needs.

### One client control, two placements

`SummaryCsvControl` in `src/components/summary-csv-control.tsx` (`"use client"`)
takes `{ rows: UsageSummary["byModel"]; totals: SummaryMetrics; source; filtered }`.
Only `rows` and `totals` cross the server-client boundary, so `recentSessions`
(session and machine ids) and `choices.members` never reach the control; this is
the structural half of BC-PRIVACY-02. On click it calls `toSummaryCsv`, builds a
`Blob` with `text/csv;charset=utf-8`, sets `download` to
`summaryCsvFileName(source, new Date())`, clicks a detached anchor and revokes the
URL after one second, exactly like `ExportControl`. The button's visible text is
Download CSV; it uses the native `disabled` attribute when `rows.length === 0`.

Placement 1: the `SectionHeading` children of the Usage by model card, next to the
count badge; `ModelBreakdown` gains a `source` prop from `Overview`'s `query`.
Placement 2: because `page.tsx` replaces `Overview` with `EmptyUsage` when nothing
matches, the disabled action would otherwise be unreachable. `EmptyUsage` gains an
optional `children` slot rendered after its action row; the overview branch of
`page.tsx` passes the control with `rows=[]`; the team view passes nothing.
Alternative rejected: always rendering `Overview` with an empty table changes the
existing empty-state journeys covered by the browser suite.

### Empty-state copy

Filtered: "Nothing to export: no usage matches the current filters. Clear the
filters, or widen the provider, member, model or date range, to include usage in
the CSV." Unfiltered (source has no usage): "Nothing to export: this source has no
usage yet. Import usage in Data sources to get a model breakdown." The FR-CSV-03
wording targets the filtered case; the unfiltered variant exists because telling
a user with no data to widen filters would be false. Both are graded by
`evals/cases/csv-summary.eval.ts` (dimension `usability-clarity`).

### Error handling

The generator has no failure path for a valid `UsageSummary`; zero total tokens
yields `0.00` shares. The control wraps Blob, object URL and anchor creation in
try/catch and renders an inline `role="alert"` message ("The CSV could not be
created in this browser. Try again or use Export data for JSON.") and, on
success, a `role="status"` message reading "Download started: <fileName>" (the
browser, not the page, confirms completion, so the copy never claims it). No
thrown error reaches the route error boundary; a disabled action has no click
path. `ModelBreakdown` keys `SummaryCsvControl` by the source and JSON-stringified
filters (mirroring `FilterBar`'s key in `page.tsx`), so a stale status or error
from a previous filter/source combination is discarded when the visible rows
change. The Blob, object URL, anchor and revoke-timer side effects live in an
exported, environment-injected `triggerCsvDownload` (`src/lib/csv-download.ts`)
so the failure path and the Blob's `text/csv;charset=utf-8` type are covered by
a unit test (`csv-download.test.ts`) without simulating a real click.

## Risks / Trade-offs

- Model ids beginning with `=`, `+`, `-`, `@`, TAB or CR could be evaluated as a
  formula by spreadsheet applications -> mitigated: `escapeField` in
  `csv-summary.ts` prefixes such a field with a single quote and force-quotes it
  per RFC 4180 (OWASP CSV-injection guidance), covered by
  `csv-summary.test.ts` and the "Spreadsheet formula characters are neutralised"
  scenario.
- Duplicate model names across providers look like duplicate rows -> accepted by
  clarification; the requirement text says so explicitly.
- Client-only download needs JS and a browser `URL.createObjectURL` -> inline
  alert, JSON export remains as fallback.
- RSC props duplicate the visible rows in the payload -> bounded by MAX_RECORDS.
- Copy drift between spec, component and eval -> the markup test asserts the
  exact sentences; the eval grades the same rendered output.

## Migration Plan

No data or schema migration. Reverting the feature commits removes the control,
the `children` slot and the `source` prop without touching stored data or exports.
Before archive: red tests recorded in `docs/workshop/build-log.md`, green `npm run
check`, build, `qa:verify`, clean `review-findings.json`, updated
`docs/current-state.md` and `docs/verification.md`.
