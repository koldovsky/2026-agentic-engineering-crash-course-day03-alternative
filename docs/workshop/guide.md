# Token Atlas: a 90-minute Spec Driven Development workshop

Format: guided demo with short audience reviews. The product is a local team
dashboard for Claude Code and Codex usage, API-equivalent cost estimates, and
human prompts. We build through small OpenSpec changes and save the evidence.

## What participants should learn

- Turn a product request into observable behavior before asking an agent to code.
- Separate the PRD, technical decisions, behavior specs, and implementation tasks.
- Review a real scenario, apply a bounded task, and compare the result with it.
- Use Vercel React guidance and the installed Next.js documentation deliberately.
- Verify a change and preserve its requirements through OpenSpec archive.

This is a replay of a project built incrementally, with one small implementation
performed live. It does not promise that all parsers, persistence, exchange, and
the dashboard can be authored and verified from scratch in 90 minutes.

## Preparation status

**Authoring snapshot, 2026-09-15:** the bootstrap is recorded in
[build-log.md](build-log.md); PRD, architecture, and data contract exist. The
`workshop-00-bootstrap` tag was observed. The remaining checkpoints below are
planned until the build log and Git tags establish their completion. Application
acceptance checks in this guide are rehearsal instructions, not recorded passes.

The facilitator must update this section after the final rehearsal. Record actual
commands, failures, fixes, and verification in the build log. Do not convert a
planned checkpoint into a verified one merely because its task list exists.

| Replay point | Content to show | Status at guide authoring |
| --- | --- | --- |
| `workshop-00-bootstrap` | Next.js, Node requirement, OpenSpec, skills, test tools | Tag observed; bootstrap recorded |
| `workshop-01-plan` | PRD, architecture, data contract, proposed changes | Documents observed; tag pending |
| `workshop-02-ledger` | Normalized usage, SQLite, pricing, aggregation | Planned |
| `workshop-03-ingestion` | Claude/Codex adapters and explicit collection | Planned |
| `workshop-04-exchange` | Atomic bundle imports and optional prompt exports | Planned |
| `workshop-05-dashboard` | Dashboard, prompt search, import/export flows | Planned |

The Claude Design reference requires sign-in. Its contents have not been
inspected, and matching that design remains a separate dependency. Present the
current theme as provisional. See [design-system.md](../design-system.md).

## Before the audience arrives

Use a disposable clone or working copy for the workshop. Keep personal logs and
the presenter's real database out of the demo. Use the repository's synthetic
fixtures; rehearse with the exact files that will appear on screen.

The project pins Next.js **16.3.5**, React **19.2.8**, and OpenSpec **1.13.0**.
Use **Node 24.x**; this authoring environment reported `v24.18.0`. Node 24 provides
the SQLite runtime used by the application. npm and Git are required. An installed
coding agent is needed for the live step; the application itself needs no API key.

From the repository root:

```powershell
node --version
npm ci
npm run openspec -- --version
git tag --list 'workshop-*'
```

`npm ci` restores the lockfile. Do dependency downloads before the workshop.
The recorded bootstrap used OpenSpec initialization for both agents:

```powershell
npm run openspec -- init --tools codex,claude --profile core
```

Generated skills are already checked into the prepared repository; normal replay
does not require regenerating them. OpenSpec is a local development dependency,
invoked through the `openspec` npm script. Its upstream installation guide shows
a global install; the workshop uses a pinned local dependency for reproducibility.

Vercel's React skill is saved in
`.agents/skills/vercel-react-best-practices/`, with provenance in
`skills-lock.json`. Next.js 16.3+ includes the former next-best-practices reference
in `node_modules/next/dist/docs/`; use those installed docs instead of attempting
to reinstall the moved reference from the old next-skills repository.

At the completed dashboard checkpoint, rehearse the declared quality gates:

```powershell
npm run check
npm run build
npm run test:e2e
```

Install the Playwright browser used by the project's configuration beforehand if
it is missing. Do not claim the bootstrap passes feature checks that require
files introduced in later checkpoints. The final build log owns test results.

For a clean, separate workshop database in PowerShell:

```powershell
$env:TOKEN_ATLAS_DB = 'data/workshop-demo.sqlite'
npm run dev
```

Use a fresh database filename for a new rehearsal if that one contains prior
imports. Open `http://127.0.0.1:3000`. Development and production start scripts
bind to loopback; this workshop does not deploy the application to Vercel.

### Rehearse checkpoint transitions

Verify tags before using them. Stop the running server before changing revisions.
Keep the live exercise on its own branch in the disposable workshop copy:

```powershell
git switch -c workshop-live workshop-01-plan
```

Save live edits before moving to a prepared revision:

```powershell
git add -A
git commit -m "workshop: preserve live spec review and pricing exercise"
git switch --detach workshop-02-ledger
npm ci
```

Run `git add -A` only in the disposable copy after checking `git status`; it must
contain just workshop work. Checkpoint transitions do not reset the database.
Use a fresh database when demonstrating an empty state or persistence scenario.

## Run of show

| Time | Presenter action | Visible evidence |
| --- | --- | --- |
| 00–08 | Show the intended product, then bootstrap tools and versions | Local app purpose, installed skills, version output |
| 08–18 | Read PRD, architecture, and data contract at `workshop-01-plan` | Scope decisions and three testable behaviors |
| 18–30 | Review `01-usage-ledger` proposal/specs/tasks; clarify a scenario | A real Markdown diff before feature code |
| 30–44 | Apply only the pricing task and its tests in the live branch | Behavior test, code diff, honest partial task status |
| 44–56 | Move to `workshop-02-ledger`, then `workshop-03-ingestion` | Completed ledger and synthetic provider normalization |
| 56–68 | Replay `workshop-04-exchange` | Duplicate import, rejected conflict, default prompt exclusion |
| 68–80 | Replay `workshop-05-dashboard` | Filters, unknown pricing, prompt search, responsive states |
| 80–87 | Trace requirements to checks and inspect an archived change | Passing recorded checks and living main specs |
| 87–90 | Recap the loop and name the next change | Participant can explain proposal → review → apply → verify → archive |

If the live implementation exceeds 14 minutes, preserve its actual partial
state, explain what remains, and continue with the prepared ledger checkpoint.
Show a known failure or incomplete test honestly. The prepared checkpoint is a
recovery mechanism, not a claim that the interrupted live work finished.

## Facilitation notes

### 1. Show the problem and boundaries

Start with the questions the dashboard answers: who used tokens, with which
provider/model, on what dates, and which human prompts are available. Explain
that API-equivalent estimates are not Claude/Codex subscription invoices. Unknown
rates retain their usage and remain visibly unpriced.

Show [PRD.md](../PRD.md), [architecture.md](../architecture.md), and
[data-contract.md](../data-contract.md) together. Ask the audience which document
should hold a new business requirement, a database choice, and a duplicate-import
scenario. A spec should describe behavior without depending on a particular UI.

### 2. Perform a real review before applying

Use the prompts in [prompts.md](prompts.md). Review `01-usage-ledger` and locate
the task that calculates estimates. Verify the task number from the current
`tasks.md`; do not assume a number copied from a previous rehearsal.

The live clarification is: input/cache/output buckets are disjoint; reasoning is
already included in output; an unknown model contributes to total usage while
remaining unpriced. Have the agent revise only planning artifacts first. Compare
the scenario with the data contract before giving the separate apply instruction.

The pricing task is intentionally a bounded part of the ledger change. Implement
its declared prerequisites if needed; stop at the agreed task boundary. Leave
all other task boxes unchecked. Do not archive this partially applied change.

### 3. Replay ingestion with synthetic evidence

Inspect the supported provider fixtures and tests at `workshop-03-ingestion`.
Locate the collector interface using `npm run collect -- --help` at that
checkpoint and use its actual flags. The CLI is a planned script at bootstrap;
it should be demonstrated only after the collector implementation is present.

Trace one Claude usage event and one Codex usage event into normalized records.
Show the test covering repeated Claude blocks or Codex cumulative snapshots.
Include a record with assistant/tool/system content beside a human prompt and
show that the stored prompts contain only eligible human text. Explain that
supported retained logs determine completeness.

### 4. Make file exchange observable

Use two synthetic contributors with distinct stable machine IDs. Compare record
counts and totals before and after the first import, repeat import, and a rejected
conflicting import. Inspect the exported JSON's allowlisted structure. A later
prompt-inclusive import should enrich earlier usage-only data without recounting
usage. Keep the same machine attribution across that pair of bundles.

### 5. Connect React guidance to a product decision

At the dashboard checkpoint, inspect the server/client boundary. SQLite,
filesystem access, normalization, pricing, and aggregation belong on the server
or CLI. Forms and filters need client interaction. Prompt text should load for
the prompt view; it should not accompany every dashboard render.

Use Vercel's `server-serialization` guidance and the installed App Router docs to
explain that boundary. Show a relevant file and its data flow rather than reading
the entire skill aloud. Inspect independent I/O for avoidable waiting; introduce
parallelism only where the operations are independent.

## Acceptance card for rehearsal and demo

These are expected outcomes. Tick them only after observing the result and record
the tested revision in [build-log.md](build-log.md).

- [ ] A fresh local database displays an honest empty state; explicit demo mode
  shows synthetic data without silently populating real usage.
- [ ] Provider, member, model, and UTC date filters change the displayed totals
  consistently with the selected records.
- [ ] Total tokens exclude a second addition of reasoning tokens. Unknown model
  usage remains counted while its price is unavailable.
- [ ] Repeated records or cumulative snapshots do not inflate normalized usage.
- [ ] A synthetic human prompt is searchable; assistant/tool/system/developer
  text and raw records are not stored as prompts.
- [ ] Importing a second contributor adds that contributor's usage; repeating
  the same bundle leaves counts and totals unchanged.
- [ ] An invalid or conflicting portable bundle leaves all prior data unchanged.
- [ ] Default export has `prompts: []`; explicit inclusion exports the selected
  normalized prompt data. Later import can add those prompts without new usage.
- [ ] Restarting the server preserves imported local usage.
- [ ] Keyboard controls, empty/error states, and a narrow viewport are usable.

## Verification and archive

OpenSpec's `validate` checks spec structure. `status` tracks artifact existence;
neither proves that the application meets its requirements. Demonstrate one
scenario, its meaningful test, and the corresponding implementation together.

Use `npm run openspec -- list` to identify active changes. If the prepared
checkpoint already archived a change, inspect that archive and its main specs.
Do not run archive again against a missing active change. When a fully verified
change remains active, use the archive prompt after checking every task and the
actual test results. Archive moves the change and incorporates its delta into
`openspec/specs/`; Git records the revision separately.

At closing, distinguish what shipped from the pending design-reference work.
Participants can propose `05-reference-design` after an accessible export or
reference is supplied and inspected.

## Sources and further reading

- [OpenSpec quickstart](https://openspec.dev/docs/quickstart): the change loop.
- [OpenSpec CLI](https://openspec.dev/docs/cli): terminal command reference.
- [OpenSpec supported tools](https://openspec.dev/docs/supported-tools): tool-specific invocation forms.
- [OpenSpec 1.13.0 release](https://github.com/Fission-AI/OpenSpec/releases/tag/v1.13.0): pinned workshop version.
- Local project sources: `AGENTS.md`, installed Next.js docs, and the checked-in
  Vercel React skill. Use the installed versions when rehearsing.
