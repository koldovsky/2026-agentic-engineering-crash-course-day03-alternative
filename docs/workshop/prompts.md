# Workshop prompts and terminal commands

Use these in the 90-minute [guide](guide.md). They are replay instructions,
not a transcript of work that has already happened. Check the guide's preparation
status and [build-log.md](build-log.md) before claiming a checkpoint is ready.

## Where each instruction goes

| Workflow | Codex chat | Claude Code chat |
| --- | --- | --- |
| Explore | `$openspec-explore` | `/opsx:explore` |
| Propose | `$openspec-propose` | `/opsx:propose` |
| Revise artifacts | `$openspec-update-change` | `/opsx:update` |
| Apply tasks | `$openspec-apply-change` | `/opsx:apply` |
| Archive | `$openspec-archive-change` | `/opsx:archive` |

Paste a prompt into the agent chat, replacing the initial Codex skill name with
the Claude Code form when using Claude. These are not shell commands. Codex uses
`.agents/skills/`; Claude has `.claude/skills/` and `.claude/commands/opsx/`.
The core profile does not install `new`, `continue`, `ff`, or `verify` workflows.

Terminal examples below use the repository-local OpenSpec npm script. On Windows,
use `npm.cmd` in place of `npm` if PowerShell blocks the npm script shim.
See the [official tool matrix](https://openspec.dev/docs/supported-tools).

## A. Explain the product before proposing work

Paste in chat at the planning checkpoint:

```text
$openspec-explore Read docs/PRD.md, docs/architecture.md, docs/data-contract.md,
and AGENTS.md. Explain Token Atlas's MVP in five bullets. Identify the three
most consequential ambiguities for token totals, estimated prices, and sharing
human prompts. Separate facts established by the documents from open questions.
Use synthetic examples and inspect existing specs. Do not write code or files.
```

Audience review: can a zero-dollar display mean an unknown price? Does reasoning
count again on top of output? Can an exported team file contain prompts by
default? Use the product rules to resolve those questions.

## B. Propose a change only if it does not already exist

This prompt is for a fresh planning replay. At a checkpoint with
`01-usage-ledger` already present, inspect its artifacts and continue to C.
Do not create a duplicate change with the same behavior.

```text
$openspec-propose Create 01-usage-ledger for the Token Atlas MVP. Read the PRD,
architecture, data contract, and AGENTS.md first. Plan normalized usage records,
local SQLite persistence, API-equivalent USD estimates, and filterable aggregates.
Include scenarios for duplicate identity, conflicting immutable records, disjoint
token buckets, reasoning within output, and unknown model pricing. Use the exact
contract rather than inventing a parallel shape. Create proposal, behavior delta
specs, technical design, and tasks. Keep collectors, file exchange APIs, and UI in
their later changes. Stop after presenting the artifacts for review.
```

Show what the agent runs under the workflow, using an active change:

```powershell
npm run openspec -- status --change 01-usage-ledger
npm run openspec -- instructions specs --change 01-usage-ledger
npm run openspec -- validate 01-usage-ledger --strict --no-interactive
```

For a new change, `npm run openspec -- new change 01-usage-ledger` creates
metadata only. `instructions proposal`, `instructions specs`,
`instructions design`, and `instructions tasks` print the guidance the agent
uses to write those artifacts. The CLI does not generate application code.

## C. Live review: improve one scenario before implementation

Read the actual proposal, delta spec, and pricing task aloud before this prompt:

```text
$openspec-update-change Review 01-usage-ledger against docs/data-contract.md.
Clarify its pricing and token-total scenarios with this synthetic usage event:
input 100, cacheRead 20, cacheWrite 0, cacheWrite1h 0, output 30, reasoning 10.
The token total must be 150 because reasoning is already within output. For an
exact model absent from the price snapshot, retain all 150 tokens and report
the event as unpriced; do not produce a known zero-dollar estimate. Make proposal,
design, specs, and tasks coherent if they need changes. Show the artifact diff.
Do not edit implementation or tests. If the scenarios already express this,
identify them precisely and avoid a cosmetic rewrite.
```

Then inspect:

```powershell
git diff -- openspec
npm run openspec -- validate 01-usage-ledger --strict --no-interactive
```

Acceptance of the plan means the facilitator can explain both the 150-token
total and the difference between an unknown price and a priced zero-cost event.
If the clarification produces no diff, select a genuinely missing boundary case
from the same task before proceeding; do not manufacture a review correction.

## D. Live apply: one bounded task and meaningful tests

Send this as a separate message after the human review:

```text
$openspec-apply-change 01-usage-ledger. For this live exercise, apply only the
task that implements token totals and price estimates, its necessary contract
prerequisites, and its semantic tests. Read the current artifacts and identify
the exact task before editing. Use synthetic data. Verify that reasoning is not
counted twice and that unknown model pricing remains unavailable while usage is
retained. Use a priced fixture to verify the expected USD calculation from the
recorded per-million rates. Stop after this bounded task and report the remaining
ledger work. Leave every unfinished task unchecked. Do not archive the change.
```

Ask the agent to report the actual targeted test command and output, then inspect
the diff. The semantic tests should detect incorrect arithmetic or classification;
a snapshot of the implementation is not sufficient evidence.

If needed, use this correction in chat:

```text
The test passed, but show which assertion would fail if reasoning were added
twice or an unknown model were priced as zero. If the current tests would accept
either bug, add that missing behavior check within the reviewed pricing scope.
```

Keep a real partial result when time runs out. Save it on the live branch and
switch to the prepared ledger checkpoint following the guide. Announce the
transition and identify which remaining tasks were completed before the session.

## E. Collector review at workshop-03-ingestion

```text
Review 02-local-ingestion and its implementation using only synthetic fixtures.
Trace one Claude Code event and one Codex event into normalized usage. Locate the
tests that reject double counting from repeated Claude blocks and cumulative
Codex snapshots. Identify the recognized human-message shapes and show a negative
case for assistant, tool, system, or developer content. Run the relevant existing
tests. Then show the collector help and one fixture-only invocation using its
actual flags. Do not scan home directories or print raw private logs.
```

Terminal entry point after this checkpoint exists:

```powershell
npm run collect -- --help
```

Acceptance: supported fixture usage appears once, human prompt text is available
when selected, excluded content is absent, and malformed or unsupported records
produce visible diagnostics without exposing raw lines.

## F. Team exchange exercise at workshop-04-exchange

```text
Demonstrate 03-team-exchange using synthetic contributor bundles and a temporary
database. Record usage/prompt counts and totals before import. Import contributor
B, then import the identical bundle again. Show that the second import adds
nothing. Try a bundle whose existing event identity has conflicting immutable
data, and show that the entire import is rejected without changing prior data.
Export with defaults and inspect that prompts is an empty array. Export again
with explicit prompt inclusion, then import it after the usage-only bundle and
show prompt enrichment without extra usage. Use the actual supported API or UI
and commands from this checkpoint. Report evidence, not inferred passes.
```

Audience acceptance checks:

1. The first new contributor changes totals; the repeated file does not.
2. A failed conflicting import does not partly insert its other records.
3. Default export contains `prompts: []` and only allowlisted normalized fields.
4. Explicit prompt sharing can add prompts later while preserving usage counts.

## G. Dashboard and React review at workshop-05-dashboard

```text
Use the checked-in vercel-react-best-practices skill and the installed Next.js
docs in node_modules/next/dist/docs to review the dashboard's server/client
boundary. Identify where SQL, file access, parsing, pricing, and aggregation run.
Show what is serialized to client components and when prompt text is fetched.
Inspect relevant server-serialization and independent-I/O guidance. Report only
concrete findings with evidence; do not broadly refactor for the demonstration.
```

Then perform the product walkthrough:

```text
Run the dashboard against a fresh temporary local database and synthetic fixtures.
Show the honest empty state, explicit demo mode, and local imports. Exercise
provider, member, model, and UTC date filters. Show an unknown-price event, search
for a known human prompt, and verify excluded assistant text is unavailable.
Use keyboard navigation and a narrow viewport. Restart the app and confirm local
imports persist. Keep observed results separate from checks that could not run.
```

Explain that the theme is provisional. Do not claim the inaccessible Claude
Design reference has been inspected or implemented.

## H. Verify and archive a fully completed active change

At a finished checkpoint, terminal checks are:

```powershell
npm run check
npm run build
npm run test:e2e
npm run openspec -- list
```

Do not run every broad check after each small edit if no new changes justify it.
Use targeted checks during development and the project's required gates before
the completed checkpoint. A passing structural validation is not a behavior test.

If `04-dashboard` is still active and all its tasks and checks are complete:

```text
$openspec-archive-change 04-dashboard. Read its current tasks and verification
evidence. If every required task is implemented and verified, sync the delta into
main specs and archive the change. Report the resulting main specs and archive
path. If required work remains, report it accurately and leave the change active.
```

If that change is already archived, use this read-only prompt instead:

```text
Find the archived 04-dashboard change and its corresponding main specs. Show one
requirement before and after archive and explain what evidence established it.
Do not create a duplicate change or rerun archive against a missing active change.
```

The direct CLI form is `npm run openspec -- archive 04-dashboard --yes`.
Use it only for completed, verified work: `--yes` also accepts warnings about
unfinished tasks. The facilitator should demonstrate the task review explicitly.

## I. Closing exercise

```text
Propose the next three acceptance scenarios for 05-reference-design once an
accessible design export is supplied. Cover token provenance, desktop/mobile
layout, and interaction states. Explain which observations require inspecting
the reference. Do not infer its colors, assets, or layout from the share URL.
Do not implement the design until the actual reference has been inspected.
```

Ask each participant to state the next observable behavior they would specify,
how they would verify it, and what they would deliberately leave outside that
change. That is the transferable workflow beyond this particular dashboard.
