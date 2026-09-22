# dashboard Specification

## Purpose
Give local teams a clear, accessible interface for observed usage, estimated costs,
human prompt discovery and voluntary file exchange across machines.

## Requirements

### Requirement: Overview and consistent filters
The interface SHALL show token totals, estimated API cost with pricing coverage,
sessions, members, daily trend, model/member breakdowns and recent sessions.
Provider/member/model/inclusive UTC date filters SHALL affect all usage summaries.

#### Scenario: Filter and clear
- **WHEN** a provider or member is selected and then filters are cleared
- **THEN** summaries first reflect the selection, then return to full source data

#### Scenario: All usage is unpriced
- **WHEN** a selected model has no known rate
- **THEN** tokens remain visible and cost says Unpriced instead of suggesting free use

### Requirement: Explicit local and demo states
The interface SHALL distinguish synthetic demo data from real imported data.

#### Scenario: First local launch
- **WHEN** the local database is empty
- **THEN** a clear import action and separate demo link appear

#### Scenario: Demo navigation
- **WHEN** demo is selected and the user navigates between views
- **THEN** the demo label persists and no demo data is inserted into local storage

### Requirement: Prompt library
The interface SHALL provide text search and provider/member/date filters, display
prompt/session/machine context and support pagination without rendering outputs.

#### Scenario: Search and inspect
- **WHEN** the user searches for a matching phrase and opens a prompt
- **THEN** original human text and its context are readable, rendered as plain text

### Requirement: Usable transfer flows
The interface SHALL allow file selection, preview counts/diagnostics, import
completion feedback, and export with prompts off by default.

#### Scenario: Import workflow
- **WHEN** a supported file is chosen, previewed and imported
- **THEN** saved/duplicate counts appear and local views show the imported data

#### Scenario: Import failure
- **WHEN** validation fails
- **THEN** the interface explains the error, preserves local data, and allows retry

#### Scenario: Export prompt inclusion
- **WHEN** the user opens the export control
- **THEN** prompt inclusion is unchecked and the download uses the selected source

### Requirement: Accessible responsive design
The interface SHALL use labeled controls, visible keyboard focus, semantic
headings/tables and readable layouts at desktop and 375px widths.

#### Scenario: Narrow screen
- **WHEN** the viewport is 375px wide
- **THEN** navigation and forms remain usable without horizontal page overflow

#### Scenario: Design provenance
- **WHEN** the supplied design reference cannot be inspected
- **THEN** project documentation identifies the theme as provisional and exact
  design matching remains a separate pending change

### Requirement: One-click local machine import controls
Data sources SHALL provide an Import from this computer action with useful
prefilled attribution and visible selected provider directories. Optional settings
SHALL allow editing names and paths without requiring those edits for the normal
case. An explicit click SHALL collect and save locally without a file chooser.
The existing file preview/import workflow SHALL remain available.

#### Scenario: D1 Ready with defaults
- **WHEN** Data sources loads
- **THEN** both provider selections and their suggested directories are visible,
  prompts are unchecked, no collection is triggered, and the primary import
  action is ready after defaults load

#### Scenario: D2 Import feedback and local result
- **WHEN** the user activates Import from this computer
- **THEN** pending controls prevent duplicate submission, completion reports actual
  saved and duplicate counts, and local machine/usage views refresh
- **WHEN** the action was started from synthetic demo mode
- **THEN** the interface clearly identifies local storage and offers the local result

#### Scenario: D3 Remember settings without consent
- **WHEN** a user reloads after choosing provider paths and machine details
- **THEN** valid saved settings are restored locally but prompt inclusion is reset
  to off; malformed or unavailable browser storage does not break the flow

#### Scenario: D4 Partial or empty import
- **WHEN** collection is incomplete or empty
- **THEN** the result prominently says Partial import or Nothing imported, shows
  per-provider counts and readable diagnostics, and offers editable paths/retry
  rather than claiming that all machine history was imported

#### Scenario: D5 Failure and accessibility
- **WHEN** defaults or import fail
- **THEN** an actionable error and retry remain available without claiming success
- **WHEN** the controls are used by keyboard or at 375px width
- **THEN** labels, focus, long directory names and result messages remain usable
  without horizontal page overflow

### Requirement: Consistently aligned provider marks
The dashboard SHALL render decorative provider marks with balanced artwork,
centered within the model icon box and their compact badge slot. Alignment SHALL
not depend on system-font glyph baselines. Visible provider text SHALL retain the
meaning while decorative marks remain hidden from assistive technology.

#### Scenario: V1 Model icon alignment
- **WHEN** synthetic Overview is rendered at desktop or 375px width
- **THEN** both provider artworks are contained by their icon boxes and their
  horizontal and vertical centers differ from the box center by at most 1 CSS px

#### Scenario: V2 Compact badge alignment
- **WHEN** provider badges appear in the dashboard
- **THEN** both marks are centered within their compact slots, have no clipping,
  and do not add duplicate accessible text

#### Scenario: V3 Visual verification evidence
- **WHEN** the correction is reviewed
- **THEN** full-page context and actual-size crops of both model marks and badge
  variants are inspected, and a controlled 4px artwork shift fails the same
  geometry assertion that passes after restoration

### Requirement: Readable session identity
Recent sessions SHALL lead with observed time and member/computer context instead
of opaque identifiers. Full session and machine identifiers SHALL remain available
through keyboard-accessible details. Provider SHALL remain determined by imported
usage, never by substrings in a member or computer name. Session titles or project
names SHALL NOT be fabricated or derived by exposing stored prompts.

#### Scenario: Meaningful session row
- **WHEN** an imported session has a UUID and no title
- **THEN** its observed starting time, member and computer are readable, the UUID
  is hidden until details are opened, and the provider remains visible

#### Scenario: Member name mentions a different provider
- **WHEN** one member named Codex teammate has both Claude Code and Codex records
- **THEN** each session shows its actual imported provider without relabeling usage

#### Scenario: Narrow layout and long names
- **WHEN** the viewport is 375px or desktop and display names are long
- **THEN** session identity and editable names remain usable, full IDs can be
  inspected without horizontal page overflow, and provider artwork stays aligned

### Requirement: Local display names
Users SHALL be able to set and reset local member and computer display names for
an imported machine. Names SHALL persist across reload/reopen and apply consistently
to summaries, filters, sources and prompt context. Original portable attribution,
usage, prompts, provider and stable identifiers SHALL remain unchanged. The UI SHALL
explain that display names are local and exports retain the imported attribution.
Known legacy Codex sandbox account labels SHALL display as Local user until renamed;
original attribution SHALL remain inspectable.

#### Scenario: Rename existing imported machine
- **WHEN** the user saves valid local names for an existing machine
- **THEN** all local views and member filtering use them after reload, usage totals
  are unchanged, portable export retains original attribution, and reimport adds
  no duplicates or attribution conflict

#### Scenario: Reset and invalid edits
- **WHEN** names are reset, invalid names are submitted, or an unknown machine is targeted
- **THEN** reset restores the imported names with the legacy fallback, invalid edits
  do not mutate preferences, and unknown machine edits report not found

#### Scenario: Local mutation boundary
- **WHEN** a remote or cross-origin request attempts to update display names
- **THEN** it is rejected and the synthetic demo is unaffected
