## Why

The team needs a usable local interface to understand usage, inspect human prompts
and exchange files. The domain and transfer layers now define the behavior.

## What Changes

- Responsive dashboard with metric cards, time series, model/member breakdowns.
- Provider/member/model/date filters, team view and recent sessions.
- Paginated prompt search, source management, file preview/import and export.
- Explicit demo/local switch, empty/error states and source-dated price reference.

## Capabilities

### New Capabilities

- `dashboard`: accessible local team usage and prompt exploration.

### Modified Capabilities

None.

## Impact

Next.js pages/components/styles and browser tests. Uses provisional centralized
tokens; exact Claude Design integration is pending separately. No external assets.
