## Context

Only the framework exists. PRD, architecture and data contract define the boundary.

## Goals / Non-Goals

Establish pure accounting plus local storage. Provider parsing and UI are later.

## Decisions

- Zod strict schemas provide one validation boundary for CLI and API.
- SQLite JSON payload rows with composite primary keys retain normalized records;
  canonical parse order enables payload comparison. A transaction prevents partial
  conflicting imports. Separate machine, usage and prompt tables allow enrichment.
- Use exact rate maps and null unknown prices; aggregate costs without hiding
  unpriced counts. Filter UTC dates before all grouping.
- Synthetic deterministic data is returned independently, never seeded implicitly.

## Risks / Trade-offs

Bounded synchronous reads are simple for workshops; larger datasets need SQL
aggregation/pagination. Snapshot pricing lacks billing modifiers; label accordingly.

## Migration Plan

Create schema version1 on first use. No existing user data. Future schema changes
need a migration spec and backup plan.
