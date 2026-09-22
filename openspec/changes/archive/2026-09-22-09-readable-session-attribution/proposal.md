## Why

The session list presents a sandbox OS account as a person and opaque session IDs
as descriptive information. A member name containing Codex next to Claude Code
also makes two independent concepts appear contradictory.

## What Changes

- Show session time, member and computer context first; retain full IDs in accessible details.
- Stop deriving a new import's member from the server OS account.
- Let users save local display names for already imported machines without changing
  portable attribution, stable IDs, provider labels or totals.
- Explain member attribution versus source application, and provide a neutral
  fallback for the known legacy Codex sandbox account labels.
- Verify provider independence, alias persistence, unchanged exports/reimports and
  readable desktop/mobile rendering with synthetic fixtures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: readable session identity and local display names.
- `local-ingestion`: neutral default member for new machine imports, preserving existing attribution.

## Impact

Local SQLite display preferences, guarded API, query presentation, Sources and
session UI, import defaults, tests and documentation. Portable v1 stays unchanged.
No transcript rescans, generated chat titles, prompt disclosure, provider inference
from names, or automatic real-data renaming. Day04 teaching integration is separate
documentation work; the planned scoped-export exercise remains unimplemented.
