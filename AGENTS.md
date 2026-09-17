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

## Visual acceptance for UI changes

- Define observable visual criteria for the affected components before editing.
  Check alignment, spacing, typography, icon artwork, clipping, contrast and states.
- After implementation, inspect the rendered UI at desktop and 375px. Include
  representative consumers when changing a shared component. Use synthetic data.
  Wait for visible loaded components before capturing; a loading skeleton or
  hidden server-rendered text is not evidence of the intended screen.
- Inspect both page context and actual-size component crops. A full-page image
  scaled to fit the viewer can hide local defects. Capturing a screenshot is not
  evidence that it was inspected. Use an independent visual reviewer when available.
- Compare visible artwork, not only CSS declarations or element boxes. For a
  reported geometric defect, add a focused browser assertion and demonstrate it
  rejects a controlled bad layout. Do not add tests that only restate CSS values.
- Record functional, browser and visual evidence separately in the build log:
  view/state/viewport, inspected artifacts, findings, fixes and uninspected scope.
  Review new screenshot baselines before accepting them; never approve a baseline
  merely because it matches the current implementation. Passing functional tests
  alone does not establish visual quality.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
