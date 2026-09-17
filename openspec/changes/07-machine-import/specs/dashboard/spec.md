## ADDED Requirements

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
