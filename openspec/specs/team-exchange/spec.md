# team-exchange Specification

## Purpose
Let teams voluntarily combine portable usage snapshots with explicit prompt sharing
and safe local access without transmitting their session logs to a cloud service.

## Requirements

### Requirement: Preview and atomic import
The system SHALL validate portable version1 bundles and raw transcripts before
merge, show record counts/diagnostics, and reject malformed bundles atomically.

#### Scenario: Preview has no side effects
- **WHEN** a valid file is previewed
- **THEN** record counts are shown and no data is persisted

#### Scenario: Team import and repeat
- **WHEN** files from two distinct machine IDs are imported and one is repeated
- **THEN** both machines are attributed correctly and repetition adds no usage

#### Scenario: Invalid or conflicting file
- **WHEN** a portable file has unknown fields, unsupported version, invalid data
  or a conflicting existing record
- **THEN** the request fails with a readable error and existing data is unchanged

### Requirement: Explicit prompt export
The system SHALL omit prompts from exports by default and include them only on
explicit selection. Export SHALL contain only allowed normalized fields.

#### Scenario: Default export
- **WHEN** local records include human prompts and export uses defaults
- **THEN** the downloaded bundle has an empty prompts array and no prompt text

#### Scenario: Prompt-inclusive round trip
- **WHEN** prompt sharing is selected and the file is imported into another ledger
- **THEN** eligible stored prompts and usage are preserved without model outputs

### Requirement: Bounded local access
The system SHALL limit requests and transferable exports to20 MiB, enforce
loopback Host and same-origin mutation checks, and return private no-store data.

#### Scenario: Cross-origin write
- **WHEN** an import/export request has a foreign or absent Origin or non-JSON body
- **THEN** it is rejected before processing data

#### Scenario: Large request without a declared length
- **WHEN** streamed request bytes exceed20 MiB
- **THEN** processing stops with a readable size error

#### Scenario: Large export
- **WHEN** selected data exceeds20 MiB
- **THEN** export fails with guidance to omit prompts or reduce the dataset,
  instead of producing a file the importer cannot accept

### Requirement: Query data without leaking unrelated prompts
The system SHALL return aggregate usage separately from paginated human prompt
search, with explicit demo/local source selection and UTC/provider/member filters.

#### Scenario: Summary response
- **WHEN** an overview summary is requested
- **THEN** it contains metrics and breakdowns without human prompt text

#### Scenario: Prompt search
- **WHEN** the user searches for text with provider/member/date filters
- **THEN** only matching prompts are returned with session and machine context,
  bounded to a page of results and accompanied by total match count
