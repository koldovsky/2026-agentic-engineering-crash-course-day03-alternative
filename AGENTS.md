# Token Atlas

Build this local-first team usage dashboard through OpenSpec changes. Read
`docs/PRD.md`, `docs/architecture.md`, and the relevant change before feature code.

## Workflow

1. Capture intent in proposal, behavior scenarios, design, and tasks.
2. Validate the change. Implement one change at a time; test the stated scenarios.
3. Record real results in `docs/workshop/build-log.md`; never invent verification.
4. Mark only finished tasks and archive only verified changes.

Use `.agents/skills/vercel-react-best-practices/SKILL.md` for React work.
Use the installed Next.js version's documentation in `node_modules/next/dist/docs/`.
Next.js 16.3+ supplies the former next-best-practices reference this way.

## Boundaries

- Node 24, Next.js App Router, TypeScript strict, npm lockfile.
- Keep SQLite, file reading, parsing and pricing on the server or CLI.
- No automatic home-directory scans. Tests use synthetic fixtures only.
- Store human prompts only, never assistant/tool/system content or raw logs.
- Exports omit prompts unless explicitly selected. No telemetry or cloud sync.
- Costs are API-equivalent USD estimates, never subscription invoices.
- Unknown models retain usage and show unpriced coverage.
- The Claude Design reference is pending access: do not claim design fidelity.
- Tests: `npm run check`, `npm run build`, and targeted browser acceptance tests.

The user's explicit request to plan and build authorizes this initial implementation
sequence. In the workshop itself, show a human review between proposal and apply.
