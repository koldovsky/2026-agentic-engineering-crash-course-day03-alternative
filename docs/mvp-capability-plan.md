# MVP Capability Change Plan

**Step 4 of the SDD process** — split the MVP into capability changes that the delivery loop executes
one-by-one (proposal → spec deltas → design → tasks → implementation → tests → review gate → archive).

> Inputs: `docs/PRD.md` (the product brief), `docs/requirements.md`, and the living specs under
> `openspec/specs/`. Created at onboarding on 2026-09-22 (`--no-reverse`): legacy capabilities P1–P14
> are already implemented and archived (`openspec/changes/archive/`); they are listed here only so
> the dependency graph is complete. Every numbered MVP FR is owned by exactly one change.

## 1. Slicing principles

1. One slice ≈ one cohesive capability, sized to design/build/test/archive as a unit.
2. Dependency-respecting order — foundations first.
3. One owner per requirement — every MVP FR assigned to exactly one slice.
4. Naming follows this project's convention: `NN-slug` under `openspec/changes/`.

## 2. The capability changes

| # | Change name | Baseline specs touched | MVP FRs | Constraints travelled | Depends on | Parallel |
|---|---|---|---|---|---|---|
| 1–10 | `01-usage-ledger` … `10-codex-current-prompts` (archived, legacy) | usage-ledger, local-ingestion, team-exchange, dashboard | P1–P14 (PRD ids, outside the trace chain by ADR-0001) | — | — | done |
| 11 | `11-usage-csv-summary` | dashboard | FR-CSV-01, FR-CSV-02, FR-CSV-03 | BC-PRIVACY-02, TC-STACK-01 | dashboard (archived) | parallel-safe (new module `src/lib/csv-summary.ts` + one dashboard card) |

**Cross-cutting constraints every change MUST honor:** BC-PRIVACY-02 (no prompt text, session ids, host
names, user names or paths leave the app in an export), TC-STACK-01 (Node 24, App Router, TypeScript
strict, npm lockfile).

## 3. Dependency graph

```mermaid
flowchart LR
    legacy["01–10 (archived)"] --> csv["11-usage-csv-summary"]
```

**Critical path:** `11-usage-csv-summary` only. Nothing runs in parallel with it today.

## 4. Per-change scope and exit criteria

### 4.11 `11-usage-csv-summary`

- **Scope in:** pure `toSummaryCsv(summary)` in `src/lib/csv-summary.ts`; a "Download CSV" control
  with an empty state in the dashboard model-breakdown card; unit + component tests annotated
  `@trace`; one eval case for the empty-state message.
- **Scope out:** server routes, prompts in CSV, e2e recordings (not declared for this slice).
- **Exit:** tasks ticked; `npm run check` and `npm run qa:verify` green (three-state); review-gate
  clean (`review-findings.json`); eval graded and baseline written; change archived;
  `docs/current-state.md` updated; commit trailers `Slice: 11-usage-csv-summary` / `Refs: FR-CSV-…`.
