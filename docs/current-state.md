# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-09-22 17:30:00 (Europe/Kyiv)
- **Current phase:** Phase 4
- **Last completed gate:** G3
- **Active change:** 11-usage-csv-summary
- **Progress:** Project Factory onboarded on 2026-09-22 with `--no-reverse` (ADR-0001): legacy
  capabilities P1–P14 stay outside the requirement chain; the loop (agents, workflows, checks,
  hooks, lock) governs new work. The first governed slice, `11-usage-csv-summary`, has a numbered
  requirement set, a strict-validated change folder, red-first tests (16 failing on typed stubs at
  `step-09-factory-red`), a green implementation with `Slice:`/`Refs:` trailers
  (`step-10-factory-green`, 189/189 unit tests + 3 constraint tests) and is now in the gate phase:
  eval-suite, qa:verify, review-gate, archive.
- **Next task:** finish G4 for `11-usage-csv-summary` — eval baseline (`quality/eval-baseline.json`),
  `npm run qa:verify` three-state battery, review-gate clean (`review-findings.json`), then
  `npm run openspec -- archive 11-usage-csv-summary --yes` and update this header.
- **Claims:**
  - requirements numbered with Verification tags — evidence: `docs/requirements.md`
  - acceptance contracts resolve to mechanisms (existence and artifact mode PASS) — evidence: `trace/acceptance-contracts.json`
  - FR-CSV-01..03 cited by spec, owned by one slice, traced by tests — evidence: `docs/qa/traceability-report.md`
  - integrity lock established with six recorded adaptations — evidence: `factory-lock.json`, `.project-factory/onboard-report.json`

> This header is machine-read: keep the exact formats `Phase <N>` and `G<N>`,
> and give every done/verified claim an evidence path — `gate-status`
> hard-fails on divergence between this header and computed gate status.

## Source Of Truth

1. `AGENTS.md` — project agent rules (factory lessons region at the end).
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements (new work only).
4. `docs/PRD.md` — product brief (legacy ids P1–P14).
5. `docs/mvp-capability-plan.md` — change sequence and scope.
6. `openspec/specs/` — accepted behavior; `openspec/changes/` — active work.
7. `docs/adr/` — architecture decisions.
8. `docs/qa/` — traceability, trajectory, eval reports; `trace/ledger.jsonl` — check runs.

## OpenSpec Status

```bash
npm run spec:validate                  # expected: all pass
npm run openspec -- list               # expected: no active changes between slices
```

Archived changes: 01-usage-ledger, 02-local-ingestion, 03-team-exchange, 04-dashboard (2026-09-15);
07-machine-import, 08-visual-quality, 09-readable-session-attribution, 10-codex-current-prompts
(archived 2026-09-22 at onboarding, without factory evidence — legacy). Still active besides the
governed slice: `06-scoped-export` (the day-04 workshop exercise, intentionally left open).

## Factory run log

The Day 05 walkthrough of this slice, with the budget written before the run and the measured
facts after it, lives in `docs/day05-factory-log.md`; tags `step-07-factory-onboard` …
`step-13-factory-archive` on branch `workshop-day05-factory` mark each state.
