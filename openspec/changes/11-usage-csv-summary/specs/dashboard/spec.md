## ADDED Requirements

### Requirement: CSV export of the visible model breakdown
The Usage by model card SHALL offer a Download CSV action that exports the model
rows currently visible under the active provider, member, model and inclusive UTC
date filters (FR-CSV-01). The file SHALL contain one header row
`model,total_tokens,estimated_cost_usd,share_percent`, then one row per model in
the table's order, encoded as UTF-8 without a byte order mark, with plain numbers
(dot decimal, no thousands separators, no currency symbol) and the file name
`token-atlas-summary-<source>-<YYYY-MM-DD>.csv` where source is `local` or `demo`
and the date is the UTC download date (FR-CSV-01). Fields SHALL be escaped per
RFC 4180, rows SHALL end with CRLF and the output for a given summary SHALL be
deterministic (FR-CSV-02). When no usage matches, the action SHALL be disabled
and a short message SHALL say that nothing matches the current filters and name
the way to widen them (FR-CSV-03). The CSV SHALL NOT contain prompt text, session
identifiers, machine host names or labels, OS or member user names or file paths;
only aggregate model rows leave the page (BC-PRIVACY-02). The model column is the
raw model identifier; there is no provider column, so a name may repeat when two
providers report it. Intentionally unsupported: a totals row, member, daily or
session CSVs, a server CSV route, prompt inclusion and an export-time budget.

#### Scenario: Header and one row per model in table order
- **GIVEN** the synthetic demo Overview filtered to a provider whose table lists three models
- **WHEN** the user activates Download CSV
- **THEN** the downloaded file's first line is exactly
  `model,total_tokens,estimated_cost_usd,share_percent`, it has exactly three
  further data lines, and their model values appear in the same order as the
  table rows (FR-CSV-01)

#### Scenario: Plain numbers, dot decimal, share as a percentage
- **GIVEN** a visible row with 1,234,567 tokens, an estimated cost of 0.1234567 USD and half of the visible tokens
- **WHEN** the CSV is generated
- **THEN** the row reads `<model>,1234567,0.123457,50.00`; a cost of 1.5 is
  written `1.5` and 2 is written `2`; a fully unpriced model has an empty cost
  field (never `0`); a partially priced model carries its priced sum without a
  marker; no `$`, `%`, comma separators or locale formatting appear (FR-CSV-01)

#### Scenario: File name and encoding
- **GIVEN** the demo source on 2026-09-22 UTC
- **WHEN** the user activates Download CSV
- **THEN** the browser saves `token-atlas-summary-demo-2026-09-22.csv` with type
  `text/csv;charset=utf-8`, the bytes start with the header row and contain no
  byte order mark, and the local source yields `token-atlas-summary-local-...`
  (FR-CSV-01)

#### Scenario: RFC 4180 escaping and CRLF row ends
- **GIVEN** summary rows whose model ids are `a,b`, `say "hi"` and `line` + LF + `break`
- **WHEN** the CSV is generated
- **THEN** the fields are written `"a,b"`, `"say ""hi"""` and a quoted field
  preserving the line break; fields without such characters are unquoted; every
  row including the header and the last row ends with CR LF; no bare LF appears
  outside a quoted field (FR-CSV-02)

#### Scenario: Deterministic output
- **GIVEN** two structurally equal summaries (a JSON clone of the first)
- **WHEN** the CSV is generated for each, in any process, at any time
- **THEN** the two strings are byte-identical, because the generator never reads
  the clock, locale or environment and never re-sorts rows (FR-CSV-02)

#### Scenario: Empty state under filters
- **GIVEN** the Overview with filters that match no usage
- **WHEN** the empty panel renders
- **THEN** a Download CSV button is present with the `disabled` attribute and the
  visible text "Nothing to export: no usage matches the current filters. Clear the
  filters, or widen the provider, member, model or date range, to include usage in
  the CSV." sits next to it; activating the button does nothing and no file is
  produced (FR-CSV-03)

#### Scenario: Empty state without any usage in the source
- **GIVEN** the local source with no imported usage and no filters
- **WHEN** the empty panel renders
- **THEN** the Download CSV button is disabled and the message reads "Nothing to
  export: this source has no usage yet. Import usage in Data sources to get a model
  breakdown." rather than advising the user to widen filters (FR-CSV-03)

#### Scenario: Accessible name and keyboard use
- **GIVEN** the Overview with at least one model row
- **WHEN** the user tabs through the Usage by model card at desktop or 375px width
- **THEN** the action is reached by keyboard with the accessible name Download CSV,
  shows visible focus, Enter or Space downloads the file, and the card does not
  overflow horizontally; in the empty state the disabled state is exposed to
  assistive technology and the message is in the reading order (FR-CSV-03)

#### Scenario: Privacy invariant
- **GIVEN** a bundle whose prompt text, session id, machine id, machine label,
  member name and a `C:\Users\...` path are all distinctive synthetic strings
- **WHEN** the bundle is summarized and the CSV is generated
- **THEN** none of those strings appears anywhere in the CSV, the control receives
  only the model rows and totals, and the file has exactly the four header columns
  (BC-PRIVACY-02)

#### Scenario: Download failure surfaces inline
- **GIVEN** a browser where creating the object URL or anchor throws
- **WHEN** the user activates Download CSV
- **THEN** an inline `role="alert"` message says the CSV could not be created and
  points to Export data as the JSON fallback, no success status is shown, the page
  does not crash to the error boundary and the action stays available for retry
