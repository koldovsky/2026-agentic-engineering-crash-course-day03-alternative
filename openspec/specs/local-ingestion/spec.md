# local-ingestion Specification

## Purpose
Let contributors explicitly collect supported local session usage and original
human prompts while excluding model output and reporting incomplete coverage.

## Requirements

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
- **WHEN** a file has eligible legacy `event_msg` / `user_message` or completed
  `event_msg` / `item_completed` / `UserMessage` entries and `response_item` user entries
- **THEN** only eligible explicit user-event text is collected; user-role response
  items and non-text attachments are not used as prompt text

#### Scenario: Current Codex generated and subagent inputs
- **WHEN** completed user items carry generated/synthetic origins, generated text
  or belong to a known subagent session
- **THEN** those inputs are excluded while supported usage is retained

#### Scenario: Stable mixed-format prompt identity
- **WHEN** a completed user item and eligible legacy event share a client identity
- **THEN** one prompt is retained using the legacy identity and timestamp;
  distinct client submissions with equal text remain distinct

#### Scenario: Explicit backfill after usage import
- **WHEN** a previously imported supported session is explicitly re-imported with
  prompt inclusion after current-format support is available
- **THEN** newly recognized prompts are added without duplicating usage, and
  repeating the same import does not duplicate those prompts

#### Scenario: Unsupported completed input
- **WHEN** a completed user item has malformed or ambiguous content
- **THEN** unsupported input is excluded and a content-free coverage diagnostic
  explains the omission

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

### Requirement: Explicit machine import
The system SHALL offer local provider directory suggestions and stable machine
attribution without reading transcripts. Only an explicit same-origin import
request SHALL collect selected directories and save normalized data locally.
Human prompts SHALL be excluded unless explicitly selected for that request.

#### Scenario: M1 Defaults without collection
- **WHEN** a user opens Data sources or requests machine import defaults
- **THEN** Claude projects and Codex sessions paths respect configured provider
  home overrides, stable machine/member details are prefilled, and no transcript
  files or directories are enumerated or read

#### Scenario: M2 One action imports selected usage
- **WHEN** the user requests import for selected valid local roots
- **THEN** their supported usage is imported without a portable intermediate file,
  prompt text is omitted by default, unknown-model usage is retained, and saved,
  duplicate and per-provider collection counts are returned without raw content

#### Scenario: M3 Explicit prompt choice
- **WHEN** human prompt collection is explicitly enabled for an import
- **THEN** only eligible human prompt records are stored, never model/tool/system
  content, and the choice is not reused as consent on a later page visit

#### Scenario: M4 Bounded and incomplete collection
- **WHEN** a selected root is missing, unreadable, has unsupported/skipped records
  or exceeds a collection limit
- **THEN** supported data from other selected roots can still be collected, the
  result visibly reports incomplete coverage, and limits or omitted diagnostics
  cannot be hidden by a successful import count

#### Scenario: M5 Empty collection
- **WHEN** no supported records are found in any selected root
- **THEN** the result says nothing was imported, reports relevant diagnostics and
  creates no machine or usage records

#### Scenario: M6 Repeat and failed import atomicity
- **WHEN** the same unchanged records are imported again
- **THEN** they are not counted twice
- **WHEN** combined records conflict or exceed the ledger's existing limits
- **THEN** the entire merge fails without saving any provider's new records and
  the error explains that smaller completed snapshots or consistent attribution
  are required

#### Scenario: M7 Local request boundary
- **WHEN** a request has a foreign host/origin, absent mutation origin, invalid
  provider/path/identity or unknown request fields
- **THEN** it is rejected before any filesystem collection or database write

#### Scenario: M8 Explicit roots and bounded work
- **WHEN** an import is invoked
- **THEN** only one explicitly selected absolute root per provider is traversed,
  symbolic links and files over 20 MiB are skipped, each root has at most the
  existing 100 MiB and traversal budget, and combined records retain the portable
  v1 and database limits

### Requirement: Honest import member defaults
New machine-import defaults SHALL use a neutral Local user attribution instead of
guessing a human from the server's OS account. For an already imported stable machine,
defaults SHALL retain its original portable attribution to allow repeat collection.
Loading defaults SHALL NOT scan transcript directories. Import settings SHALL explain
the difference between member attribution and the provider application.

#### Scenario: Fresh defaults
- **WHEN** defaults are requested before the machine has been imported
- **THEN** the member is Local user regardless of the server OS account and no
  transcript directory is scanned

#### Scenario: Existing machine defaults
- **WHEN** defaults are requested for a machine already present in the ledger
- **THEN** its original member and computer attribution are reused, independently
  of local display names, and repeated import remains idempotent
