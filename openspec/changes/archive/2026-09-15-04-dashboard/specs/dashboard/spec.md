## Purpose

Give local teams a clear, accessible interface for observed usage, estimated costs,
human prompt discovery and voluntary file exchange across machines.

## ADDED Requirements

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
