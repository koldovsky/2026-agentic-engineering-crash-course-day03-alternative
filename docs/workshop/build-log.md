# Actual build log

## 2026-09-17 — lesson publication preparation

- Prepared day04 source materials and a reproducible `workshop-day04-start` tag.
  The starter includes verified product fixes; `06-scoped-export` remains the
  participant exercise, not a claimed completed implementation. Updated the
  integration plan for visible member aliases while retaining original portable
  attribution; strict validation passed for all nine OpenSpec items.
- Removed private planning-task references and local-instance diagnostic values
  from the publication documents. The source package uses an explicit 15-file
  teaching allowlist. Local databases, exports, environment settings, real logs,
  captured app screenshots and browser preferences are not publication inputs.
- The final app code had passed `npm run check` (172 tests, lint, types, nine
  strict OpenSpec items) and production build. A fresh full browser suite passed
  **21 journeys in 34.1 seconds**, with temporary storage and synthetic roots.
  These are app verification results, not measured completion of the day04 exercise.

## 2026-09-17 — current Codex human prompts (change 10)

- Investigated missing Codex prompts. Upstream Codex persistence policy confirmed
  paginated history stores `item_completed` / `UserMessage` records instead of
  legacy `user_message` events. The adapter had only supported the older format.
  A synthetic reproduction established the gap; private diagnostic observations
  and local usage counts are omitted from this publication record.
- Created and strictly validated change 10 before implementation. A synthetic
  reproduction returned zero prompts where one was expected. The initial current
  format test suite had 18 failures and two passes, demonstrating the coverage gap.
  Added completed-user-item extraction alongside legacy events, with explicit
  prompt opt-in, text-block concatenation, attachment/context/output exclusions,
  stable identities and legacy-first handling for matching client IDs.
- Delegated parser implementation and browser acceptance separately; root wrote
  independent format/privacy/ledger tests. Final code review found an additional
  privacy gap for Codex internal guardian/memory sessions without `thread_source`.
  Added known-internal exclusions, unknown-origin diagnostics and three regression
  cases before completion. Usage normalization and portable schema are unchanged.
- Final `npm run check` passed lint, types, **172 tests in 18 files** and all nine
  strict OpenSpec items. The production build passed after the privacy correction.
  The current-format suite now contains 28 cases, including backfill into a ledger,
  mixed-format compatibility, repeated submissions, generated origins and opt-out.
- One focused browser journey passed against a temporary database and synthetic
  files: usage-only import saved two usage records and zero prompts; opted-in
  backfill saved two prompts and no extra usage; a repeat added nothing. Codex
  filtering/search and default prompt-free export passed. Initial Chromium launch
  hit sandbox `spawn EPERM`; after an escalated retry and failed-run server cleanup
  the journey passed. Re-ran it against the final privacy-corrected build: one
  passed in 4.2 seconds. This was targeted acceptance, not a full browser-suite run.
- The independent checker inspected desktop/375px page context and actual-size
  expanded prompt cards. Root additionally inspected the desktop context and
  mobile card. Prompt text, provider, member, date, computer and session context
  were readable without overlap or clipping; narrow-page overflow check passed.
  No UI layout was changed. Evidence lives in ignored
  `test-results/prompt-backfill-backfills--d0579-te-usage-or-private-exports-chromium/`
  as `codex-prompts-{1280,375}-{context,card}.png`. Scope is these synthetic Chromium
  recovery states; no reference-fidelity or broad visual/accessibility claim.
- Updated provider coverage and collection recovery instructions. Restarted the
  corrected app at `http://127.0.0.1:3000`. The user's ledger is unchanged: recovering
  real prompts requires an explicit import with prompt inclusion checked. No
  automatic real-history import, commit, push or archive was performed.

## 00 — bootstrap (2026-09-15)

- Empty directory, no Git repository. Scaffolded Next 16.3.5/React 19.2.8, TypeScript,
  App Router, Tailwind and ESLint.
- Installed OpenSpec 1.13.0 locally; `init --tools codex,claude --profile core`.
- Installed official Vercel React best practices for Codex and Claude Code.
- Discovery: next-best-practices moved from next-skills into bundled Next docs.
- Added Vitest, Playwright, Zod, Node 24 requirement and loopback-only scripts.
- Registry downloads required sandbox escalation, then succeeded. Install reported
  zero vulnerabilities. Replay point: `workshop-00-bootstrap`.
- Claude Design requires sign-in; requested access, fidelity remains pending.
- User chose **90-minute guided demo**.

## 01 — intent and architecture

- PRD, technical decisions, data contract and design dependency saved before features.
- Chose SQLite, file exchange, explicit collection, optional prompt capture,
  prompt-free default exports, API-equivalent pricing and isolated demo data.
- Four implementation changes; design integration pending reference access.
- User requested plan and build. No invented human approval checkpoint.

## 02 — usage ledger

- Authored/validated 01-usage-ledger before implementing schema, SQLite, rates,
  aggregates and isolated demo data. Prepared the next ingestion spec while tests ran.
- Verification: npm run check passed (21 tests across 5 files), lint, generated route
  types/TypeScript, and strict OpenSpec validation. Persistence tested by reopening
  a temporary SQLite file; conflicting imports rolled back all additions.
- Fixed test fixture placement to avoid registering the same tests twice; switched
  Vitest config to .mts to remove ambiguous module loading.
- Seed is 84 fictional usage events and 84 prompts, 42 sessions, 4 members/5 machines.
- API prices preserve unpriced coverage. Node 24 SQLite uses no native addon.

## 03 — local ingestion

- Implemented the validated 02-local-ingestion adapter and collector tasks after
  archiving the ledger. Supported shapes/limits are documented in providers.md.
- Added Claude repeated-ID/cache handling and human-only prompt filtering; Codex
  response accounting and cumulative deltas with reset/coverage diagnostics.
- CLI smoke: samples/claude + samples/codex produced 3 usage records, 2 prompts,
  5,200 tokens. No MUST_NOT_BE_COLLECTED marker reached the output.
- Verification: npm run check passed, 63 tests across 7 files. Includes oversize
  files, symbolic-link skipping, malformed JSONL, excluded content and limits.
- Review follow-up fixed canonical timestamps and transactional read snapshots.
- Lockfile refreshed online after offline npm cache lacked an optional package.
- Replay point: workshop-03-ingestion. No real session directories were read.

## 04 — team exchange

- Implemented 03-team-exchange after ingestion verification/archive.
- Preview validates without record writes; imports atomically dedupe machine-bound
  usage/prompts; default export is prompt-free, inclusion explicitly selectable.
- Added real route integration tests against temporary SQLite, including conflict
  rejection, unchanged totals, prompt search and default/opt-in downloads.
- HTTP checks enforce loopback host, same-origin JSON mutations, no-store and
  actual streamed-byte limits. Oversize exports fail before creating a download.
- Verification: npm run check passed, 82 tests across 11 files; types/lint/spec valid.
- Replay point: workshop-04-exchange. No external data transmission.

## 05 — dashboard and final integration

- Implemented the validated 04-dashboard change: overview, team, prompt library,
  data sources and model pricing. URL filters preserve source and view; prompt
  text is read for the prompt view only. Empty, error and unpriced states are
  explicit, with separate synthetic demo navigation.
- Added browser preview/import controls and source-wide JSON download with
  prompts unchecked by default. Human prompt search is paginated; prompt-only
  imports also populate member/provider choices.
- Used the installed Vercel React skill for the server/client boundary and bundled
  Next.js documentation for async request APIs and the error boundary retry API.
- Follow-up review fixed empty-bundle round trips, invalid UTF-8 rejection,
  unknown model names that shadow Object prototype properties, and skip-link
  keyboard focus. Added regression checks for the substantive boundaries.
- Expanded verified pricing to 17 exact IDs. Unsupported cache-write rates remain
  unavailable; current GPT cache-write durations are documented explicitly.
- Added portable CLI wrappers to disable framework/tool telemetry, Prettier, and
  CI configuration. CI has not run remotely; the commands are verified locally.
- Initial browser export test timed out because it queried the native `summary`
  disclosure as a button. Corrected the test to target its visible label; all six
  functional browser journeys then passed against an isolated production server.
- Visual review found and fixed an SVG tooltip hydration mismatch by rendering
  one text value inside `title`. Browser tests now assert no runtime/hydration
  errors. Rate-card review also preserved the exact $0.175 cached-input rate
  instead of rounding it to cents, and made cache durations visible.
- Final checks on 2026-09-15: `npm run check` passed (98 tests across 12 files,
  lint, route types/TypeScript, strict spec validation); `npm run build` passed;
  `npm run test:e2e` passed all 8 journeys against the production build. Desktop
  and 375px screenshots were inspected; mobile overview/import have no page
  overflow. Keyboard skip navigation, opt-in prompt downloads, raw transcript
  import and original prompt search were verified.
- Archived 04-dashboard after verification; replay point: `workshop-05-dashboard`.
- The supplied Claude Design page remains inaccessible. No design fidelity or
  timed workshop rehearsal is claimed.
- Workshop review corrected the replay instructions: facilitator docs stay in
  the final checkout, checkpoint 04 demonstrates API tests, and the live planning
  exercise separates pricing from aggregation before applying code.

## Synthetic collector command used

```powershell
npm run collect -- --machine workshop-laptop --member "Workshop" --claude-root samples/claude --codex-root samples/codex --include-prompts --out exports/workshop-sample.json
```

Observed: 3 usage records, 2 human prompts, 5,200 tokens. For a replay, choose a
new output filename or explicitly use `--force` to replace that synthetic export.

## Day04 lesson preparation — 2026-09-16

- Reviewed the course plan, prior workshop materials and authoring conventions.
  Private planning conversations are not included in the publication.
- Adapted the tentative day04 parser/pricing exercise because Token Atlas already
  implements those capabilities. Prepared `06-scoped-export` for a live lesson:
  one orchestrator, two bounded workers, independent checker and final integration.
- Created Ukrainian guide, prompts, homework, tooling notes, source notes and an
  empty evidence template in `docs/workshop/day04/`. OpenSpec proposal/design/
  delta specs/tasks are planning artifacts; all implementation tasks are unchecked.
- Added 35 Ukrainian slides to the sibling Slidev course (deck 172–206), speaker
  notes, course navigation, browser cheat sheet, full lab handout and 12-file ZIP.
  The lesson is 150 minutes and includes a 90-minute guided subset in the guide.
- Independent review found and corrected legacy includePrompts compatibility,
  missing acceptance rows, UI test discovery (.test.ts, Node environment), shared
  fixture prerequisites, inconsistent labels/timing and build-before-browser order.
  The planned session-collision mutation uses only a model filter so member/provider
  predicates cannot hide the defect. It has not been executed on new feature code.
- Fresh baseline verification at application HEAD
  `48b586606503e126075cec4973e388457e26f247`, with documentation/spec additions
  uncommitted and no product source edits: `npm run check` passed 98 tests in 12
  files, lint, TypeScript and strict validation (4 main specs + 1 proposed change).
  `npm run build` passed. A sandboxed browser attempt failed immediately and
  stalled in teardown; it was interrupted. Re-running `npm run test:e2e` outside
  the sandbox passed all 8 synthetic journeys in 7.3 seconds.
- Slidev `pnpm build` and `pnpm build:pages` passed. Layout audit 172–206 found no
  overflow, with an initial cold-load `no visible layout` for 172 resolved by a
  successful targeted rerun.
  Link audit passed (800 anchors across 206 slides, external new-tab behavior).
  All 35 new screenshots were inspected as contact sheets; title, table, card,
  terminal and verification layouts are legible. The browser handout copy button
  showed `Скопійовано`; ZIP entry inspection confirmed 12 source files including
  `.openspec.yaml`. Screenshots remain ignored generated artifacts.
- No product change applied, no OpenSpec archive, no new Git checkpoint, no commit,
  push or publication. Pending: live feature implementation, timed LLM rehearsal,
  real worker cost/token measurements and recorded failure/recovery demonstration.
  Baseline passes do not establish the new export behavior.

## Day04 theory revision — 2026-09-16

- Revised the lesson after feedback that it taught practical steps without enough
  explanation. Expanded 35 slides to 57 (deck 172–228), including 30 foundational
  theory slides before the demo. The planned 150-minute session now reserves
  65 minutes for theory, then a break, demonstration, practice and discussion.
- Added visible definitions and worked examples for agent/model/tool/subagent,
  orchestration versus autonomy, DAG nodes and edges, fan-out/join, readiness,
  critical path, hidden dependencies, contracts/DTO, pure functions, controlled
  UI, ownership, context/worktree/sandbox, model routing and resource limits.
- Added verification theory: validation, acceptance criteria, invariants,
  fixtures, test oracles, assertions, correlated mistakes, test layers and the
  limits of a mutation experiment. Timings, probabilities and cost examples are
  explicitly hypothetical, with no claim of measured agent speed or prices.
- Reworked opening questions and closing discussion around explanations. Added
  a guide glossary and aligned the schedule and primary references. Corrected
  read-only checker responsibilities, worktree integration instructions and the
  distinction between concurrency evidence and actual parallel execution.
- Independent content review confirmed 57 parsed slides with 30 foundation
  slides. Review identified and corrected a scope=all wording error and undefined
  formula symbols. The existing export behavior/specification is unchanged.
- Verification: Slidev production build passed. Layout audit of 172–228 found
  excess height on the dependency graph; adjusted spacing and the targeted
  rerun passed. All remaining slides passed the full audit. Later table-label
  size improvements passed targeted layout checks. Link audit passed across
  228 slides, including external new-tab behavior. All 57 screenshots were
  reviewed, with full-size checks of DAG, critical path, cost, test oracle,
  maker/checker and the applied collision example. No remaining visual issue
  was identified. Source screenshots and contact sheets are ignored artifacts.
- Regenerated the browser command sheet (8 steps, 25 commands/prompts), full lab
  guide and downloadable source package. The open browser preview displayed the
  revised maker/checker theory slide at 203/228.
- These checks validate lesson artifacts. Product tests were not rerun for this
  documentation-only revision. Scoped-export implementation, its mutation run,
  timed teaching rehearsal and real worker-cost measurements remain pending.
  No commit, push, deployment, product change or OpenSpec archive was performed.

## Day04 requirements, context and quality revision — 2026-09-17

- Adapted Weather Explorer's FR/NFR/TC/BC conventions, vertical capability
  slicing and requirement-to-evidence traceability to the existing Token Atlas
  scope. Added a workshop requirements registry without renaming P/E/U scenarios
  or changing product/spec behavior. S1 remains one 06-scoped-export change;
  selector and UI workers are implementation tasks within that vertical slice.
- Added 15 theory slides and removed 2 repeated applied explanations: 70 slides
  total (172–241), 45 foundational slides before the demonstration. The planned
  150-minute lesson has 80 minutes of explanation/exercises and a 30-minute demo
  timebox. This is a teaching plan, not a measured rehearsal or completion promise.
- Addressed student questions with reviewed chat-to-context packets, persistent
  versus scoped rules, per-change acceptance, tests during propose/apply, evidence
  before archive and follow-up test debt. Added weak/strong Playwright examples,
  metric limits and a separate illustrative AI acceptance/tool-authority case.
  Private chat identities, transcript and meeting links were not republished.
- Updated guide, prompts, evidence template and homework. Added requirements.md,
  context-packet.md and quality.md. Independent audit caught and corrected task
  number mappings and a fixture source attribution. Clarified that the shared
  U1/U2/U3 teaching fixture is not held-out; task 3.4 also uses a separate checker
  case withheld until join, with actual red/green evidence still required.
- Verification: strict validation of 06-scoped-export passed. Final Slidev
  `pnpm build` and `pnpm build:pages` passed. The first layout attempt found the
  preview stopped; restarted the existing local server, then checked all 70 slides.
  Four dense slides overflowed; after spacing/copy fixes, targeted checks passed
  for 177, 217, 219 and 220. No remaining overflow was reported.
- Link audit passed: 1098 anchors across 241 slides, including external new-tab
  behavior. Reviewed screenshots of all 15 new slides and revised opening/closing
  slides; final full-size inspection covered the corrected taxonomy, Playwright,
  AI acceptance and tool-authority slides. Local Markdown links also resolve.
- Regenerated the command sheet (8 steps, 25 commands/prompts), browser handout,
  LMS homework and ZIP. All 15 packaged source files match browser copies and ZIP
  entries by SHA-256, including .openspec.yaml; LMS homework matches its source.
  The refreshed in-app handout shows the three new sections and its requirements
  copy button returned `Скопійовано`. Slide preview is open at 176/241.
- These are lesson-artifact checks. Product tests were not rerun for this revision;
  scoped-export implementation, live mutation/eval runs, timed teaching rehearsal
  and worker-cost measurements remain pending. No commit, push, deployment or
  OpenSpec archive was performed.

## 2026-09-17 — ready-made visual review in day04

- Integrated `github/awesome-copilot`'s `web-design-reviewer` as an optional
  pre-class setup and a concrete independent-checker procedure. No skill was
  installed automatically. Updated the guide, quality notes, prompt 5a, evidence
  template, homework and primary-source list.
- Added four Ukrainian theory slides (221–224) to the sibling course at
  `../2026-agentic-engineering-crash-course/pages/day04/02cb-visual-review.md`:
  procedure/browser/oracle, critique/fidelity/regression, artwork versus semantic
  identity defects, and maker/checker/evidence. Day04 has 74 slides; deck total 245.
  Kept 150 minutes by prioritizing visual acceptance inside the verification block.
- Course `build` and `build:pages` passed. Overflow checks passed on all 4 new slides;
  author and root independently inspected screenshots `shots/s-221.png` through
  `s-224.png` at 1280×720. Link audit passed: 817 anchors across 245 slides, including
  external new-tab behavior. Regenerated cheatsheet, 15 browser handouts/LMS homework
  and ZIP; SHA-256 package/source comparison passed. Nine source handouts passed
  fenced-code and local-link checks. Preview remains at `http://localhost:3033/#/221`.
- No claim of reference-design fidelity: the Claude Design reference is still
  unavailable. These are teaching additions; `06-scoped-export` remains planned.

## 2026-09-17 — readable session attribution (change09)

- Traced metadata separately from provider parsing. Machine-import defaults
  promoted the server OS account to member attribution, creating a misleading
  label. Synthetic tests demonstrate that member names are independent of provider
  attribution. No local-ledger values or private screenshots are published.
- Created and validated `09-readable-session-attribution` before implementation.
  Added local display-name preferences, guarded update/reset API, consistent
  presentation queries and neutral defaults. Original machine/event payloads,
  exports, providers and IDs remain unchanged; repeat imports still deduplicate.
  Existing defaults reuse canonical attribution, avoiding conflicts after renaming.
- Sources now exposes Edit display names and Imported attribution. Session rows
  show first observed UTC activity in the selected period and member/computer
  context; full IDs remain behind keyboard-accessible Session details. Removed the
  misleading apparent session link that only filtered member/provider. No chat
  titles or project names were invented; v1 does not contain those fields.
- Delegated backend implementation and independently authored browser acceptance
  while root implemented UI and reviewed integration. `npm run check` passed:
  144 tests in 17 files, lint/types and 8 strict OpenSpec items. Initial production
  build exposed a dynamic filesystem tracing warning in the read-only ledger lookup;
  marked that runtime data access appropriately and rebuilt without warnings.
- Initial browser run could not launch Chromium (`spawn EPERM`), so it provided
  no product evidence. The authorized browser-launch retry passed all 20 journeys
  using a temporary database and synthetic fixtures only. Coverage includes local
  name persistence/filtering/reset, original export attribution, repeat import,
  provider independence, prompt non-disclosure and keyboard-accessible IDs.
- Screenshot review then found long member names squeezed into a narrow mobile
  table column, creating excessively tall rows despite functional checks passing.
  Widened the column within the scrollable table and top-aligned row content;
  matched session-title weight to the existing UI. Re-ran `npm run check` and a
  clean production build after these corrections.
- A new readability assertion caught a remaining 124px member-text width after
  the first correction. Increasing that column's minimum width yielded 148×66px
  of mobile text (four lines). A controlled 6px column expanded to 1287px tall and
  was rejected by the same assertion; restored layout passed. This demonstrates
  sensitivity to this particular defect, not proof of universal visual quality.
- After the visual fixes, both affected functional journeys and both existing
  provider-artwork cases passed; the final two attribution viewport cases passed
  after the last width correction. The final production build passed. The
  independent checker inspected all eight final screenshots at desktop/375px;
  root additionally inspected final page context and component crops. No remaining
  material finding in the changed components. Tables retain internal horizontal
  scrolling on narrow screens.
- Final synthetic evidence is under ignored `test-results/` directories
  `readable-attribution-reada-01a60-ifier-disclosures-at-1280px-chromium` and
  `readable-attribution-reada-02b60-tifier-disclosures-at-375px-chromium`: session
  and Sources page context, session-details and edit-form crops, and
  `member-geometry-{1280,375}.json`. Scope is Windows/Chromium and the changed
  attribution flows, not a full cross-browser or reference-fidelity audit.
- Updated product and collection docs; marked all seven change tasks verified.
  Restarted production at `http://127.0.0.1:3000`. The synthetic browser evidence
  verifies observed time and readable context with identifiers in Session details. No real import,
  user-specific display-name mutation, commit, push or archive was performed.

## Provider icon alignment and visual acceptance — 2026-09-17

- The user reported visibly low provider symbols in Overview. Root and an
  independent checker traced the issue to Unicode glyphs: 22px font with inherited
  line-height 1.5 creates a 33px text line inside a 28px box. Centering the text line
  does not guarantee centered visible artwork. Earlier page-level screenshot
  review failed to catch this; passing functional/overflow tests did not cover it.
- Defined and strictly validated `08-visual-quality`, then replaced both model
  symbols and compact provider badges with a shared balanced decorative SVG.
  Visible provider labels remain the accessible content. Symbols/theme are still
  provisional; there is no claim of official logos or reference-design fidelity.
- Added a visual acceptance rule to AGENTS.md, a worked quality example to the
  day04 guide, and visual evidence fields to its template. The rule requires
  rendered-page context, actual-size component crops, specific review findings,
  representative shared-component consumers, and separate functional/visual claims.
- Verification: `npm run check` passed 136 tests across 15 files, lint, types and
  all 7 strict OpenSpec items. Production build passed. All 16 synthetic browser
  scenarios passed, including two new artwork checks at 1280×900 and 375×850.
  No real usage logs were read or imported.
- Actual artwork geometry, projected from SVG paths into screen coordinates,
  reported zero horizontal/vertical center error for all eight provider/size/
  viewport combinations. Stroke containment also passed. A controlled 4px downward
  transform inside the isolated test page was rejected by the same alignment
  assertion; restoring the transform returned the measured error to zero. This
  proves sensitivity to that particular layout defect, not universal visual quality.
- Root and the independent reviewer inspected both model symbols and compact
  badges as eight actual-size crops. The reviewer caught another evidence defect:
  the first mobile full-page screenshot showed the loading skeleton. Requiring
  visible loaded sections and capturing page context after the component checks
  fixed it. Both targeted browser cases then passed, and both reviewers inspected
  the replacement desktop/mobile page context. No remaining alignment finding.
- Evidence is under ignored `test-results/visual-quality-provider-artwork-is-centered-at-{1280px,375px}-chromium/`:
  `overview-context.png`, `model-claude-code.png`, `model-codex.png`,
  `badge-claude-code.png`, `badge-codex.png`, and `artwork-geometry.json`.
  Scope: Windows/Chromium synthetic Overview and representative provider marks;
  not a complete cross-browser, contrast, accessibility or brand-design audit.
- Restarted production on 127.0.0.1:3000 and verified HTTP 200 with the new SVG
  markup. Existing import, pricing and stored records are unchanged. No commit,
  push, deployment or OpenSpec archive was performed.

## One-click machine import — 2026-09-17

- Implemented the user's requested `07-machine-import` change after strict
  proposal/spec/design validation. Data sources now offers **Import from this
  computer** with visible environment-aware Claude/Codex folders, stable default
  attribution, optional settings, and a single collect-and-save action. Existing
  file preview/import remains available. `06-scoped-export` stays a planned
  day04 exercise and was not implemented by this change.
- GET prepares metadata without enumerating or reading transcript directories.
  Only an explicit guarded POST collects selected absolute local roots. Prompts
  default to off; the browser remembers names/paths/provider selections but never
  prompt consent. No real machine logs were scanned or imported during this work.
- Each provider receives an independent bounded collection budget. Normalized
  records undergo one atomic merge; repeats deduplicate, conflicts/combined or
  ledger limits roll back, and empty collection creates no empty machine. The
  collector retains a partial flag even when diagnostics are capped. Known
  generated/tool/subagent exclusions are informational; ambiguous unsupported
  human input and actual missing/skipped content remain incomplete coverage.
- Delegated backend and UI implementation in parallel with root integration and
  browser scenarios. Independent review found and helped resolve invalid
  deselected-folder submission, its preference-persistence edge case, and false
  partial warnings for deliberately excluded generated content. Added a separate
  traversal-limit case proving an exhausted Claude root does not starve Codex.
- Verification: final `npm run check` passed lint, TypeScript, **136 tests in 15
  files**, and all **6** strict OpenSpec items. Production build passed without
  tracing warnings after marking dynamic metadata paths as runtime-only. All
  **14** browser journeys passed with a temporary SQLite database and provider
  home overrides pointing exclusively to checked-in synthetic logs.
- Browser evidence covers untouched defaults/one keyboard action, pending
  controls, repeats, human-only prompt opt-in/reset, local results from demo mode,
  missing/empty roots, retries, disabled browser storage, remembered selections,
  existing file import/export and 375px overflow. Inspected desktop/mobile
  screenshots. Fixed warning-color precedence and duplicate disclosure marker;
  rebuilt and reran the two affected desktop/mobile journeys successfully.
- Updated README, collection guide, PRD and architecture. Restarted the local
  production app at `http://127.0.0.1:3000`; the Data sources page returned HTTP 200
  with the new import control; opening the page was queued in Codex. Importing actual personal
  history is left to the user's explicit click. No commit, push, deployment or
  OpenSpec archive was performed.
