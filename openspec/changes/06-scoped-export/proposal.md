## Why

Token Atlas filters its dashboard but exports the entire selected source. A team
lead needs an explicit way to share only the reviewed provider, member, model and
date range while retaining the current full export default and prompt privacy.
This is the day04 teaching change, prepared for live implementation and review.

## What Changes

- Add an explicit all-data or current-filters export choice; preserve old requests.
- Apply a validated server-side filter to normalized usage, including unpriced models.
- Keep prompts excluded by default. Optional filtered prompts must match a selected
  usage session's machine/provider/session tuple and provider/member/date criteria.
- Keep portable v1, atomic imports, loopback access and the 20 MiB limit unchanged.
- Teach one orchestrator, two bounded workers and an independent checker through
  one change, with an agreed interface and final integration checks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `team-exchange`: explicit export scope and safe selection of portable records.
- `dashboard`: accessible choice of export scope and visible filter summary.

## Impact

Server export request validation, a pure bundle selector, the export route, and
export controls. No dependencies or database migration. The orchestrator owns
shared contracts and integration; workers own separate new files. Day03 code
remains the baseline until the lesson's apply step. `05-reference-design` remains
pending access and is unrelated. No telemetry, home scans, deployment, billing or
automatic collection is added.
