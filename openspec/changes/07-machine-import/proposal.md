## Why

Importing this computer's Claude Code and Codex history currently requires a CLI
command or repeated individual file uploads. The user requested a one-click
machine import, with no need to locate logs or manually create a portable file.

## What Changes

- Add a prominent Import from this computer panel to Data sources with prefilled
  provider paths and stable machine/member details. One explicit button collects
  and saves selected usage locally; optional settings allow path/name changes.
- Keep human prompts off unless explicitly selected. Remember non-sensitive
  collection settings locally, but do not remember prompt consent.
- Show per-provider counts, duplicates and collection diagnostics, including
  missing folders, skipped files and partial coverage. Never scan on page load.
- Isolate collection limits per selected provider root so one large history cannot
  prevent processing the other provider. Preserve atomic, idempotent ledger merge.
- Keep file upload and the CLI available; no cloud service, dependency, database
  migration, live synchronization or change to pricing/export semantics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-ingestion`: explicit browser-triggered collection with platform defaults
  and visible bounded coverage.
- `dashboard`: one-click machine import, optional settings and actionable results.

## Impact

New Node-only machine collection service and localhost API; new client import
panel in SourcesView; synthetic unit/API/browser acceptance tests and collection
documentation. Existing storage, portable v1 and privacy rules remain intact.
Only this change is implemented; `06-scoped-export` remains the day04 exercise.
