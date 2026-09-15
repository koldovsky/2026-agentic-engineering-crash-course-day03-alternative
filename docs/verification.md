# Requirement-to-evidence map

Specs describe behavior. Tests establish behavior; OpenSpec validation checks
document structure. The [actual build log](workshop/build-log.md) records which
commands ran and their results. CI configuration alone is not evidence of a pass.

Verified locally on 2026-09-15: **98 unit/API tests and 8 browser journeys**,
lint, TypeScript, strict OpenSpec validation, and production build passed.
The browser suite also checks runtime/hydration errors and 375px page overflow.

| Product behavior                        | Living capability             | Executable evidence                                             |
| --------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| P1 persistence and atomicity            | usage-ledger                  | src/lib/storage.test.ts                                         |
| P2 token/cost/coverage summaries        | usage-ledger                  | src/lib/schema.test.ts, pricing.test.ts, aggregate.test.ts      |
| P3 combined inclusive UTC filters       | usage-ledger, team-exchange   | src/lib/aggregate.test.ts, queries.test.ts                      |
| P4 supported provider usage             | local-ingestion               | src/lib/parsers.test.ts                                         |
| P5 human prompts, no outputs/context    | local-ingestion               | src/lib/parsers.test.ts, collector.test.ts                      |
| P6 explicit bounded collection          | local-ingestion               | src/lib/collector.test.ts; samples/README.md CLI run            |
| P7 repeated imports and conflicts       | usage-ledger, team-exchange   | src/lib/storage.test.ts, transfer.test.ts, routes.test.ts       |
| P8 prompt-free default export           | team-exchange                 | src/lib/transfer.test.ts, routes.test.ts; e2e/dashboard.spec.ts |
| P9 prompt search and pagination         | team-exchange, dashboard      | src/lib/queries.test.ts; e2e/dashboard.spec.ts                  |
| P10 isolated demo and local empty state | usage-ledger, dashboard       | src/lib/demo.test.ts; e2e/dashboard.spec.ts                     |
| P11 supplied design system              | Pending reference access      | docs/design-system.md; no fidelity verification yet             |
| P12 reproducible SDD workshop           | Archived changes and Git tags | docs/workshop/build-log.md, guide.md, prompts.md                |

Additional boundary tests: `src/lib/http.test.ts` covers loopback origin checks,
actual streamed bytes, generic errors and no-store. `src/lib/routes.test.ts`
checks these services through real Next route functions and temporary SQLite.

## Re-run

```bash
npm run check
npm run build
npm run test:e2e
```

After a production build, browser tests start a separate production server on
127.0.0.1:3100 and select a new database
under ignored test-results/. Unit tests use temporary or in-memory databases.
No test reads ~/.claude, ~/.codex, CODEX_HOME or actual provider sessions.

## Limits on the conclusions

- Synthetic formats prove the supported adapters; they do not establish all
  historical/future provider versions or billing completeness.
- CLI/SQLite tests prove local persistence. No hosted or concurrent team service
  is deployed or tested.
- Costs use the documented snapshot, not full invoice reconciliation.
- Browser screenshots verify the provisional theme; Claude Design is inaccessible.
- The guide timings are a proposed 90-minute run of show, not a timed rehearsal.
