## Context

See proposal.md. Existing collect reads explicit roots, parses bounded JSONL and
returns a v1 bundle. It can stop partially but its capped diagnostic list does not
provide a durable completeness flag. Ledger.merge is atomic/idempotent and caps
the entire database at 20,000 records per kind; portable imports are unchanged.
The current ImportPanel accepts one uploaded file and remains available.

## Goals / Non-Goals

**Goals:** one deliberate action to import this computer, no CLI/file intermediary,
defaults without scanning, honest coverage, explicit prompt consent, reusable
existing parsers and atomic merge, synthetic verification only.

**Non-Goals:** unrestricted whole-home crawling, automatic scans/sync, cloud upload,
arbitrary raw file reading, changing immutable snapshot semantics or ledger limits,
streaming oversized transcripts, scoped export, model pricing or schema migration.

## Decisions

### Request and response boundary

Type-only shared contract: src/lib/machine-import-contract.ts.
GET /api/machine-import returns MachineImportDefaults {machine, roots}. The server
computes os username/hostname/homedir and env CLAUDE_CONFIG_DIR/CODEX_HOME paths;
it does not stat or enumerate them. Default machine id hashes host+home for stable
attribution. Paths select Claude projects and Codex sessions; archived sessions
can be explicitly selected by editing the Codex path.

POST body: MachineImportRequest {machine, roots, includePrompts?}. roots contains
one or two {provider,path}, no duplicate providers, absolute nonblank bounded
local paths; reject Windows UNC/network paths. Strict nested validation rejects
unknown keys. Default includePrompts=false.
POST uses existing localhost, Origin, content-type and body-size checks before
collection. GET also checks localhost and rejects foreign origins.

Reply: MachineImportResult {status:'imported'|'empty', partial, filesRead,
usageCount,promptCount,addedMachines,addedUsage,addedPrompts,duplicates,sources}.
Each source is {provider,filesRead,usageCount,promptCount,partial,diagnostics};
diagnostics contain only safe code/message/optional line, no transcript or paths.
An error uses existing {error} with appropriate status. Full bundles stay server-side.

### Collection and persistence

Call collect separately for each selected root, sequentially to bound peak memory.
Each root has the existing 100 MiB/2,000 file/10,000 entry/depth20 budget; at most
two roots means at most200MiB total. One exhausted provider cannot starve another.
No filesystem work occurs until POST. Do not fabricate a session-completion
heuristic. UI/docs advise completed sessions; changing snapshots retain conflicts.

Extend collector with a durable partial boolean, set before capped diagnostic
output, for skipped/unreadable/invalid/truncated content. Unknown model attribution
and ordinary deduplication alone do not imply missing usage. Informational
usage growth/format-precedence notices remain visible without automatically
claiming dropped accounting. Diagnostic truncation is visible and conservative.

Combine normalized records by existing keys, reject conflicting copies and limits,
then perform one Ledger.merge. Missing/empty roots are diagnostic; zero records
returns empty without inserting a machine. Never commit one provider before another
fails. Identical duplicates remain idempotent; conflicts leave current data intact.
Avoid a long SQLite transaction during filesystem reads.

### Client flow and remembered settings

New MachineImportPanel above the existing file import flow. It fetches defaults
on mount (metadata only), overlays validated versioned localStorage preferences,
and always initializes includePrompts=false. Storage includes machine details,
root paths and selected providers, never prompts, transcript text or consent.
Storage failure is nonfatal. Disable editing/submission while pending. Read results
into a concise status region, show partial/empty distinctly and per-source diagnostics,
refresh local rows and provide a local overview link. Keep optional path/name inputs
in a details panel. Default selected directories remain visible before the action.

### Ownership and verification

Root owns contract, SourcesView integration/CSS, OpenSpec/docs, browser configuration
and acceptance. Backend worker owns machine-import.ts, machine-import.test.ts,
API route + tests and collector.ts/tests. UI worker owns machine-import-panel.tsx
and focused Node markup tests. Checker reviews independently without writing code.
No worker edits another owner's files. Use installed Next16.3.5 docs and React skill.

Tests inject synthetic roots with provider env overrides; browser server
must never default to the user's real home during tests. Exercise real UI-to-API
import into a temporary DB, repeats, prompt opt-in/default reset, partial/empty,
invalid origin and atomic conflict, keyboard and375px. Final check/build/e2e gates.

## Risks / Trade-offs

- Large histories remain bounded → visible partial state and editable smaller roots;
  do not claim complete coverage or raise storage limits silently.
- Live snapshots change → retain existing atomic conflict error, advise completed
  sessions; no implicit overwrite or timing-based completion claim.
- Provider home paths vary → environment-aware defaults and editable absolute paths.
- Concurrent clicks → client pending guard; backend uses atomic merge and bounded
  inputs. Requests across tabs can still compete for local resources.
- Browser fixtures → pass only the checked-in synthetic fixture roots via provider
  env before server start; never use real logs for tests. Unit fixtures use temporary
  directories.

## Migration Plan

No DB migration or dependencies. Build and restart the local application after
verification. Removing the new panel/route restores the existing file/CLI flow;
imported records remain portable v1. Do not run real collection during development.
