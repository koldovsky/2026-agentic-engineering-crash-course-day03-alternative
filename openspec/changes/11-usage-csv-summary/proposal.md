## Why

The Overview shows a model breakdown (tokens, estimated cost, share) under the
active provider, member, model and UTC date filters, but the only way to take
those numbers elsewhere is the full JSON export, which ignores filters and carries
machine and session identifiers. A team lead who wants the visible per-model
figures in a spreadsheet has to retype them. This is the first slice numbered in
`docs/requirements.md` (FR-CSV-01, FR-CSV-02, FR-CSV-03, BC-PRIVACY-02,
TC-STACK-01) and the first to run the full Project Factory gate loop.

## What Changes

- Add a Download CSV action to the Usage by model card that exports exactly the
  visible rows: header, one row per model in table order, plain numbers, UTF-8,
  file name `token-atlas-summary-<source>-<YYYY-MM-DD>.csv`.
- Generate the CSV in the browser from the already loaded summary through a pure
  function; escape per RFC 4180 with CRLF row ends and deterministic output.
- When no usage matches, keep the action disabled and show a short message that
  names how to widen or clear the filters; the message is graded by an eval.
- Never place prompt text, session identifiers, machine host names, user names
  or file paths in the CSV; only aggregate model rows leave the page.
- Prove the behavior with failing-first unit and markup tests, an eval case, the
  qa battery and the review gate before archiving.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: CSV export of the visible model breakdown with an explicit empty state.

## Impact

One new pure module (`src/lib/csv-summary.ts`), one new client control
(`src/components/summary-csv-control.tsx`), a `source` prop threaded into
`ModelBreakdown`, an optional slot in `EmptyUsage` used by the overview branch
of `src/app/page.tsx`, unit/markup tests, one eval case and documentation. No
dependency, database, API route, server action, auth or schema change; the JSON
export, portable v1 and prompt handling are untouched. `06-scoped-export` stays
the separate workshop exercise. No totals row, provider column, member or daily
CSV, BOM or server-side CSV endpoint is added.
