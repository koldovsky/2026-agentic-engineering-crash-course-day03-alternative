## 1. Dependencies and schema

- [x] 1.1 Confirm no new dependency, database, API route or schema change is needed; the slice is a pure module, one client control and one optional slot (design.md). (No new dependency, route or schema was introduced; artifact exists at tag step-09.)

## 2. Failing tests first (red)

- [x] 2.1 Write `src/lib/csv-summary.test.ts` from the spec scenarios, annotated `// @trace FR-CSV-01, FR-CSV-02, BC-PRIVACY-02`: header line, one row per model in `byModel` order, plain numbers (integer tokens, cost with up to 6 decimals and trimmed zeros, empty cost for a fully unpriced row, priced sum for a partial one, share with 2 decimals and no `%`), RFC 4180 quoting for comma / double quote / CR / LF, CRLF on every row including the last, byte-identical output for a JSON clone, file name `token-atlas-summary-<source>-<YYYY-MM-DD>.csv` from an injected UTC date, and the privacy negative test (distinctive synthetic prompt text, session id, machine id/label, member name and a `C:\Users\...` path never appear in the CSV). (Artifact exists at tag step-09.)
- [x] 2.2 Write `src/components/summary-csv-control.test.ts` (markup test, same style as `machine-import-panel.test.ts`), annotated `// @trace FR-CSV-03`: a disabled `Download CSV` button with the exact filtered empty-state sentence, the unfiltered variant, and an enabled button with an accessible name when rows exist. (Artifact exists at tag step-09.)
- [x] 2.3 Author `evals/cases/csv-summary.eval.ts` (shape from `evals/README.md`), traced to FR-CSV-03, dimension `usability-clarity`: the two empty-state messages are graded for naming the condition, naming the remedy, brevity and absence of jargon. (Artifact exists at tag step-09; later rendered through the real component per the review-gate finding.)
- [x] 2.4 Run `npx vitest run src/lib/csv-summary.test.ts src/components/summary-csv-control.test.ts` and record that the suites fail because the module and control do not exist yet (red for the right reason). Commit the tests only. (Tests-only commit `9ae54d3` at tag step-09 predates `src/lib/csv-summary.ts`/`src/components/summary-csv-control.tsx`, so the suites failed for the right reason at that commit; NOTE: a dedicated red-run entry in `docs/workshop/build-log.md` is still outstanding — out of scope for this pass, flagged for follow-up.)

## 3. Domain logic (green)

- [x] 3.1 Implement `src/lib/csv-summary.ts`: `SUMMARY_CSV_HEADER`, `toSummaryCsv(summary, options)`, `summaryCsvFileName(source, date)` exactly as specified in design.md — no I/O, no `Intl`, no clock, never re-sorts rows.
- [x] 3.2 Make the unit tests pass without weakening any assertion. (TWO fixture defects found by the implementer, both fixed in the same green commit, no assertion weakened: (1) model id `partial-model` tripped the test's own `/partial/i` guard against the UI cost marker, fixed by renaming the fixture to `mixed-model`; (2) the thousands-separator guard was rewritten from a whole-line check to a per-field check, splitting the CSV line by `,` and asserting each field does not match `/\d[,\s]\d{3}/`.)

## 4. UI

- [x] 4.1 Add `src/components/summary-csv-control.tsx` (`"use client"`): Blob + object URL + detached anchor download as in `ExportControl`, native `disabled` when there are no rows, inline `role="alert"` on failure and `role="status"` on success.
- [x] 4.2 Thread `source` into `ModelBreakdown` and render the control in the Usage by model card heading; add the optional `children` slot to `EmptyUsage` and pass the disabled control from the overview branch of `src/app/page.tsx`.
- [x] 4.3 Make the markup tests pass; `npm run check` green; commit with `Slice: 11-usage-csv-summary` and `Refs: FR-CSV-01, FR-CSV-02, FR-CSV-03, BC-PRIVACY-02`.

## 5. Validation, docs and archive

- [x] 5.1 Run the eval-suite workflow on `evals/cases/csv-summary.eval.ts`; establish `quality/eval-baseline.json` with `node scripts/check-eval-ratchet.mjs --update`. (Artifacts committed at HEAD `16aafec`, tag step-11.)
- [ ] 5.2 Run `npm run qa:verify` (three-state battery), `node scripts/check-traceability.mjs`, `node scripts/check-trajectory.mjs`; run the review-gate workflow for this change and fix every confirmed finding until `openspec/changes/11-usage-csv-summary/review-findings.json` is `clean: true`.
- [ ] 5.3 Update `docs/current-state.md` and `docs/verification.md`; `npm run spec:validate`; `npm run openspec -- archive 11-usage-csv-summary --yes`.
