## Purpose

Let contributors explicitly collect supported local session usage and original
human prompts while excluding model output and reporting incomplete coverage.

## ADDED Requirements

### Requirement: Claude usage normalization
The system SHALL read assistant message usage, preserve model/session attribution,
and count repeated message identities once. Cache buckets SHALL remain disjoint.

#### Scenario: Repeated assistant blocks
- **WHEN** two transcript lines share message ID and identical usage
- **THEN** one normalized usage event is produced

#### Scenario: Evolving observations
- **WHEN** repeated message usage grows within the same file
- **THEN** the adapter retains one latest monotonic observation and reports the
  replacement; conflicting nonmonotonic observations are diagnostic

#### Scenario: Split cache creation
- **WHEN** creation total includes a known 5-minute and 1-hour split
- **THEN** the split is counted once without adding the total again

### Requirement: Codex cumulative and response accounting
The system SHALL normalize supported Codex records, excluding cached input from
fresh input and retaining reasoning only as a subset of output.

#### Scenario: Legacy cumulative snapshots
- **WHEN** cumulative input snapshots are 100, 100 and 160 with stable cache/output
- **THEN** normalized input increments total 160, not 360

#### Scenario: Reset or missing accounting
- **WHEN** a cumulative snapshot decreases or usage is missing or invalid
- **THEN** the adapter reports incomplete coverage and does not invent negative tokens

#### Scenario: Modern record precedence
- **WHEN** response usage records and legacy token counts occur in one file
- **THEN** only response usage records are counted and the mixed format is reported

### Requirement: Original human prompts only
The system SHALL optionally extract eligible original human prompts with stable
identities while excluding assistant/tool/context/synthetic and subagent content.

#### Scenario: Claude mixed transcript
- **WHEN** a file contains original user text, assistant text, tool results, meta
  messages and compaction summaries with prompt collection enabled
- **THEN** only original eligible user text is collected, including earlier history

#### Scenario: Codex prompt and injected context
- **WHEN** a file has event_msg user_message and response_item role user entries
- **THEN** only eligible user_message text is collected

#### Scenario: Collection disabled
- **WHEN** collection is run without prompt inclusion
- **THEN** no prompt text is present in the generated bundle

### Requirement: Explicit bounded local collection
The system SHALL read only explicitly requested provider roots, skip symbolic
links and oversize files, and produce normalized version1 output with attribution.

#### Scenario: Collect a synthetic directory
- **WHEN** the CLI is given roots, member, machine ID and output path
- **THEN** it writes a valid bundle, prints record/diagnostic counts and does not
  print raw prompts or model outputs

#### Scenario: Malformed lines and missing roots
- **WHEN** files contain malformed lines or a requested root is missing
- **THEN** valid supported records are retained and diagnostics identify the issue
  without echoing source content

#### Scenario: No collection command
- **WHEN** the dashboard starts
- **THEN** no local transcript roots are scanned
