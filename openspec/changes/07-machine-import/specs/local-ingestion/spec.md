## ADDED Requirements

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
