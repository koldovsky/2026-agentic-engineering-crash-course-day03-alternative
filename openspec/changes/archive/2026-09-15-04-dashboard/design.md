## Context

Domain services provide summaries; API provides prompt pages and transfer. Read
the actual exported TypeScript interfaces before connecting UI.

## Goals / Non-Goals

Complete local user journeys without a login/account/network service. No budgets,
invented percentage deltas or nonfunctional buttons. Design reference is pending.

## Decisions

- Server-render initial summary and shell. Small client controls update URL query
  filters; form actions/import/export use local API, with pending and error states.
- Use view=overview|team|prompts|sources|pricing and source=local|demo in URL so
  views are bookmarkable. Default local shows empty state until import.
- SVG/CSS chart and semantic tables avoid a large chart dependency. All chart
  numbers have accessible text equivalents. Explicit known-cost/unpriced states.
- Centralized CSS tokens, system fonts, ink sidebar, light canvas and blue accent
  are provisional. No claim to have copied the inaccessible Claude Design.
- Prompt pages display20 records; overview receives no prompt content. Large
  tables scroll inside their region, not the entire document.

## Risks / Trade-offs

Demo dates are fixed for reproducibility; label their interval and avoid current
day relative claims. Source changes must clear irrelevant filters. Browser QA
uses synthetic fixtures and a separate local database. Exact design is deferred.

## Migration Plan

Replace generated landing page and metadata, no data migration. Tests verify
empty state, demo filters, prompt text safety, import/export and mobile overflow.
