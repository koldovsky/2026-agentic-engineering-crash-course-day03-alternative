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

<!-- BEGIN-FACTORY-LESSONS -->
<!-- BEGIN-LESSON-vacuous-pass-not-earned -->
### Lesson: a PASS over zero evidence is NOT-EARNED (vacuous-pass-not-earned, v1)

- Never report a gate or check as PASS when its evidence scope is 0 ("Scope: 0
  clip(s)", empty archive, no eval results) while product code exists under
  `app/`, `src/`, `lib/`, `server/`, or `packages/`. Render it **NOT-EARNED**
  and exit non-zero.
- Before product code exists, an empty scope is **SKIP-pending**: print it
  explicitly; it is visible and never counted as PASS.
- Never fold SKIP / 0-scope results into an overall "Pass" summary
  (`qa-verify`, `gate-status`). Field evidence: `worst()` folded SKIP into
  PASS and G4–G8 rendered green over literally nothing
  (2026-07-02-pixel-perfect-forensics.md, RC2).
<!-- END-LESSON-vacuous-pass-not-earned -->
<!-- BEGIN-LESSON-declared-method-needs-mechanism -->
### Lesson: a declared acceptance method needs an executable mechanism (declared-method-needs-mechanism, v1)

- Every FR/NFR that declares a verification method (pixel-diff, e2e,
  recording, a11y, eval, ...) must resolve to a real, executable, non-stub
  mechanism BEFORE the build phase starts: an installed check script, or a
  package.json script whose body does not match
  `/^echo |^true$|not yet configured/i`.
- A spec file that restates the requirement is NOT a mechanism. Field
  evidence: NFR-19 encoded "≥ 99% pixel match" while no pixel-diff tool
  existed anywhere and `test:e2e` was an echo stub exiting 0
  (2026-07-02-pixel-perfect-forensics.md, RC1).
- If a declared method has no mechanism, do not proceed: implement the check,
  or record an explicit human waiver — never let the declaration float
  unverifiable into the build.
<!-- END-LESSON-declared-method-needs-mechanism -->
<!-- BEGIN-LESSON-done-claims-need-evidence -->
### Lesson: done-claims need evidence pointers (done-claims-need-evidence, v1)

- Never write strong completion language ("Convergence reached", "all gates
  pass", "verification-only", "Overall result: Pass", "ready for release /
  sign-off", "done", "complete") into current-state.md, PR bodies, or handoff
  docs unless the same line carries a resolvable evidence pointer — a path
  that exists on disk (e.g. `docs/qa/automated-verification-latest.md`) and
  is fresh — or an explicit "Scope NOT delivered" section.
- The verdict belongs to exit-coded checks, not narrative. Field evidence:
  "Convergence reached … verification-only" was written while the same file
  admitted the formal acceptance was never run
  (2026-07-02-pixel-perfect-forensics.md, RC6).
- When you catch an unbacked claim, treat it as a correction event: file it,
  do not silently rewrite it.
<!-- END-LESSON-done-claims-need-evidence -->
<!-- BEGIN-LESSON-sampling-blindness -->
### Lesson: verified samples are never continuum coverage (sampling-blindness, v1)

- Any check that samples a CONTINUOUS space (viewport width, the element set,
  a single measurement channel) must **declare its sampling dimension** and the
  sample points — and must never report `coverage: continuum` / "100%" / "all
  widths" from a discrete sample set. Coverage from N samples is `sampled`.
- Every sampled check must carry a **stricter-instrument escalation path**: the
  finer instrument that runs before a definition-of-done is claimed or when any
  sample lands near the floor (5-width matrix → fine-step continuum pixel sweep;
  geometry-only channel → pixel channel over the same sweep; fixed element
  matrix → full computed-style diff).
- Field evidence (abstractly, the multi-layer parity campaign): the SAME
  blindness recurred three times — the element matrix, the width matrix, and a
  geometry-only sweep that read 0 divergence bands while 100+ below-floor pixel
  residuals sat between its samples
  (2026-07-02-pixel-perfect-forensics.md + follow-on parity work).
<!-- END-LESSON-sampling-blindness -->
<!-- BEGIN-LESSON-block-conquest-doctrine -->
### Lesson: per-block definition-of-done beats page-average (block-conquest-doctrine, v1)

- Drive visual parity **block by block to a per-block definition-of-done**, not
  by chasing a page-average score. A block is done only when, independently:
  `unpaired = 0`, `geometry = 0`, `paint = 0`, `asset = 0`, and `pixel >= floor`.
  The page is done only when EVERY block is done.
- The full-page pixel scalar is **telemetry, not the gate** — a high average
  launders per-block debt (one block regresses as another improves and the mean
  barely moves). Field evidence: the campaign demoted the full-page scalar
  (~0.9449 desktop) to telemetry and made acceptance per-section overlay
  (2026-07-02-pixel-perfect-forensics.md + follow-on parity work).
- Use the **overlay / onion-skin feedback pattern** to converge each block: a
  difference-blend overlay plus a 50% onion-skin composite of the block on both
  sites, reviewed by eye/vision, localizes the residual so it can be taken to
  zero before conquering the next block.
<!-- END-LESSON-block-conquest-doctrine -->
<!-- BEGIN-LESSON-capture-determinism -->
### Lesson: neutralize the capture before trusting it (capture-determinism, v1)

- A parity capture is trustworthy only after every known non-determinism source
  is neutralized. A same-input re-capture must be byte-stable; an unstable
  capture is a HARNESS defect (file it), never a product parity finding.
- The gotchas ledger — check each before treating a below-floor sample as real:
  1. **Carousel free-run timers** survive `autoplay.stop` — clear the timers,
     not just the flag, or the slide advances mid-shot.
  2. **Sub-pixel clip origin** ghosts the raster — snap clip origin to integer.
  3. **`captureBeyondViewport`** duplicates `position:fixed` chrome down the
     page — disable it when fixed chrome is present.
  4. **Lazy third-party widgets** come back blank under fast capture — settle /
     render-gate them on BOTH sites first.
  5. **In-context persistence probes** (localStorage/cookies/state) leak between
     captures — clear persistence so each shot is context-independent.
- Field evidence (abstractly): a fresh sweep over-counted by 100+ samples plus
  phantom geometry bands purely because a lazy live widget rendered blank under
  the fast path (2026-07-02-pixel-perfect-forensics.md + follow-on parity work).
<!-- END-LESSON-capture-determinism -->
<!-- END-FACTORY-LESSONS -->
