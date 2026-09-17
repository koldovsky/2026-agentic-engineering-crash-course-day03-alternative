## Context

See proposal.md. The `workshop-day04-start` baseline continues day03 checkpoint
`workshop-05-dashboard` and exports the whole source through `POST /api/export`.
The existing control explicitly says filters do not affect export. No product
implementation is included in this lesson preparation change.

## Goals / Non-Goals

**Goals:** one small feature with independent workers after a shared contract,
server-enforced privacy, reusable normalized records and observable acceptance.

**Non-Goals:** schema v2, database changes, historical pricing, new parsers,
prompt redaction, autonomous retries, or changing existing import semantics.

## Decisions

### Freeze interfaces before worker dispatch

The orchestrator creates shared synthetic fixtures in `src/lib/export-fixtures.ts`
and `src/lib/export-contract.ts`, a type-only module:

```ts
import type { Provider } from "./schema";
export type ExportScope = "all" | "filtered";
export type ExportFilters = {
  provider?: Provider;
  member?: string;
  model?: string;
  from?: string;
  to?: string;
};
export type ScopeSelection = { scope: ExportScope; filters: ExportFilters };
```

Worker A creates `selectExportBundle(bundle: Bundle, selection: ScopeSelection,
includePrompts = false): Bundle` in `src/lib/export-scope.ts`. It is pure,
non-mutating, preserves identities/tokens/exportedAt, and returns no prompt data
unless enabled. Serialization still uses `exportData`, which sets exportedAt and
enforces the existing output limit. No SQL, new I/O or rates belong in the selector.

Worker B creates a controlled `ExportScopeFields` in
`src/components/export-scope-fields.tsx`, props:
`value: ExportScope`, `onChange: (scope: ExportScope) => void`,
`filters: ExportFilters`, `disabled?: boolean`. It renders a labeled radio group
and noneditable summary, including the empty-filter meaning. The parent owns
source, selected scope, prompt opt-in, submit/error state and request assembly.
Type-only imports prevent server code from entering the browser bundle.
Worker B uses `export-scope-fields.test.ts`, not `.test.tsx`: the installed
Vitest configuration discovers only `.test.ts` in Node. Use `createElement`
and `renderToStaticMarkup` for focused markup assertions; interaction checks
belong in the integrated Playwright suite. No extra test dependencies are needed.

Alternative: split by backend versus frontend and let both change shared types.
Rejected because workers would implicitly negotiate an interface through edits.

### Validate once at the server boundary

Extend `ExportRequestSchema` in `src/lib/transfer.ts` with scope default `all`
and a strict filters object default `{}`. Validate provider, nonempty bounded
member/model, ISO calendar dates, and from <= to. Unknown keys, including q/page,
are rejected; never pass raw URLSearchParams wholesale. Valid filters are ignored
when scope is all. The existing source and includePrompts defaults remain intact.

The orchestrator wires `getBundle(source, includePrompts)` → selector →
`exportData` in the existing route, retaining `apiResponse` and headers. The
orchestrator passes the parsed current dashboard filters through the actual
parent chain to export controls. Read that chain before editing; no duplicated
client filter parser or second source of truth.

The starter also has local member display names. Before invoking the pure selector
for a filtered member, the orchestrator resolves the visible member value against
the presentation layer into matching machine IDs, restricts the canonical bundle
to those machines/records, and clears only the internal selector's member filter.
No match produces an empty candidate bundle. Other filters still apply normally;
all-source scope bypasses this restriction. Preserve the canonical machine payloads
in the download: display aliases must not leak into portable attribution. Read
canonical data and display-name preferences coherently through the existing ledger
services. Worker A's pure contract remains independent of storage and aliases.

### Prompt matching is a defined subset

For filtered scope, select usage first. Prompt inclusion requires a selected
usage session tuple `(machineId, provider, sessionId)`, plus prompt provider,
machine member and prompt UTC date matches. Exact model affects usage sessions,
since human prompts do not carry a model. A tuple from another machine/provider
must not match merely because sessionId is the same. Prompt-only sessions are
excluded from filtered export and preserved in all-source opt-in export.
Keep only machines referenced by exported usage/prompts for filtered scope.

Alternative: reuse paginated `queryPrompts`. Rejected because pagination/search
have different semantics and could silently truncate or expand exported data.

### Ownership and dependency graph

1. O: review proposal/scenarios and commit contract, synthetic fixtures and DAG.
2. After O, A (selector/tests) and B (scope controls/isolated markup checks) can run
   concurrently. C prepares adversarial checks read-only from the spec.
3. O joins A+B, wires existing files, and adds integration/API/browser assertions
   from C's counterexamples. Only O edits shared code or changes the contract.
4. C reviews the final integrated revision and evidence. O fixes findings and
   reruns affected checks and required gates. Human reviews the final diff.

Workers stop for an interface change, out-of-scope file, missing prerequisite or
budget. They return changed files, revision, commands/results and unresolved items.
Worktrees start at the same committed contract revision; shared-directory
subagents instead obey disjoint ownership. These are separate execution modes,
not assumed automatic isolation. Only O merges, archives or updates main specs.

## Risks / Trade-offs

- Session ID collision → held-out fixture with identical IDs across machines/providers.
- Stale UI filters → browser test changes selection before download and inspects JSON.
- Local display names → API/browser test selects an alias and verifies exact usage
  IDs plus original machine attribution in the downloaded file.
- Empty selection → valid empty bundle, no fallback to all-source.
- Helpers pass but integration fails → run API and browser checks on the integrated tree.
- Review anchored on maker's report → C starts from spec and counterexamples first.
- Partial work after limits → save status and handoff; never mark it as passed.
- Classroom time → stop at an honest partial result; no fabricated ready-made tags.

## Migration Plan

No data migration. Existing requests continue to export all-source data. Revert
the feature commits to restore the old UI/request shape; exported v1 bundles
remain importable. Before archive, update export documentation and all-source
wording, record fresh check/build/browser results, and obtain the workshop's
visible human review. All implementation tasks remain unchecked in preparation.
