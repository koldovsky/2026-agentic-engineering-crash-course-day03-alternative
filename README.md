# Token Atlas

A local team dashboard for **Claude Code and Codex** token usage, estimated
API-equivalent cost, and original human prompts. Built as a **90-minute Spec
Driven Development workshop** using Next.js, Vercel React guidance and OpenSpec.

## Start

Requires **Node 24.x**, npm and Git. No provider API key or cloud account needed.

```bash
npm ci
npm run dev
```

Open [Token Atlas locally](http://127.0.0.1:3000). Local usage starts empty; choose
**Explore demo** for fictional team data or **Data sources → Import from this
computer** to import your local Claude Code and Codex usage in one click.
The app binds to loopback and stores data in `data/token-atlas.sqlite`.
To run the production build: `npm run build`, then `npm start`.

## Collect and share

On **Data sources**, the selected local folders are shown above **Import from this
computer**. Click once to collect and save usage locally. Names and folders are
prefilled; optional settings let you change them and are remembered in this browser.
Human prompts are off by default and require a fresh choice after reopening the
page. Nothing is scanned until you click. Review any **Partial import** result for
missing folders or limits; use smaller completed-session folders if necessary.

To personalize existing names, use **Machines in this workspace → Edit display
names**. Local display names do not alter export attribution or duplicate accounting.
Session rows show observed time and computer context; full IDs remain in details.

To share, export JSON and let a teammate preview/import it. The existing file
importer and command-line collector are also available:

```bash
npm run collect -- --help
```

Choose explicit local session directories and stable machine/member labels.
The collector produces version 1 JSON; manually transfer and import that file on
another machine. Prompt capture requires `--include-prompts`. Dashboard exports
also omit prompts by default, with an explicit inclusion option.

See [collection commands for Windows/macOS/Linux](docs/collection.md),
[supported log formats](docs/providers.md), and [portable contract](docs/data-contract.md).
Use completed sessions: updated snapshots can conflict with immutable stored data.

## What the numbers mean

Token categories do not overlap; reasoning is included in output. Costs are
**API-equivalent estimates**, not Claude/Codex subscription invoices. The checked-in
rate snapshot is dated 2026-09-15. Unknown models/rates stay visibly unpriced.
Provider logs can be incomplete; imports report diagnostics. No model outputs,
raw log files or absolute source paths are stored in the database or exports.

## Workshop and specification workflow

Day04 starts at the [`workshop-day04-start` tag](https://github.com/koldovsky/2026-agentic-engineering-crash-course-day03-alternative/tree/workshop-day04-start).
It includes the working local app, lesson materials and the planned scoped-export
exercise. The exercise implementation is left for participants.
[Slides](https://koldovsky.github.io/2026-agentic-engineering-crash-course/#/day04) ·
[Browser handout](https://koldovsky.github.io/2026-agentic-engineering-crash-course/day04-lab.html) ·
[Materials ZIP](https://koldovsky.github.io/2026-agentic-engineering-crash-course/day04-materials.zip).
Only synthetic fixtures ship with the lesson; local databases, imports and exports
are excluded from the repository and the downloadable teaching package.

- [90-minute guide and checkpoint replay](docs/workshop/guide.md)
- [Presenter prompts and review exercises](docs/workshop/prompts.md)
- [Day04: parallel subagents and independent verification](docs/workshop/day04/guide.md)
- [Day04 prompts](docs/workshop/day04/prompts.md) · [homework](docs/workshop/day04/homework.md) · [evidence template](docs/workshop/day04/evidence-template.md)
- [Day04 requirements and capability slicing](docs/workshop/day04/requirements.md) · [context packet](docs/workshop/day04/context-packet.md) · [test quality](docs/workshop/day04/quality.md)
- [Actual build log and verification](docs/workshop/build-log.md)
- [PRD](docs/PRD.md) · [Architecture and ADRs](docs/architecture.md)
- [Living specs](openspec/specs) · [Changes and archive](openspec/changes)

Core loop: propose → review → apply → verify → archive. Codex uses
`$openspec-propose` / `$openspec-apply-change`; Claude Code uses
`/opsx:propose` / `/opsx:apply`. These go in agent chat, not the terminal.

```bash
npm run openspec -- list
npm run spec:validate
npm run check
npm run build
npm run test:e2e
```

Install the browser for end-to-end tests once: `npx playwright install chromium`.
Tests use synthetic data and their own database. Real usage and exports are
ignored by Git. `TOKEN_ATLAS_DB` optionally selects a different local database.

## Design status

The supplied Claude Design link requires sign-in and could not be inspected.
The current theme is **provisional**, with replaceable CSS tokens. Exact design
matching is the next pending change; see [design integration](docs/design-system.md).
