## ADDED Requirements

### Requirement: Visible export scope choice

The interface SHALL offer labeled All data and Current filters choices, default
to All data, and display the current source and active filter summary before
download. It SHALL explain that prompt search and pagination do not limit export.
Current filters without any active filter SHALL visibly describe that all usage
matches. Prompt inclusion SHALL remain a separate unchecked-by-default choice.

#### Scenario: U1 Select filtered export

- **WHEN** the user selects a provider and member and chooses Current filters
- **THEN** the summary identifies that selection and the download contains only
  matching usage from the displayed source, with no prompts by default

#### Scenario: U2 Current state at download

- **WHEN** the user changes a filter or source after selecting export scope
- **THEN** the summary and subsequent request use the new current values

#### Scenario: U3 Keyboard and narrow viewport

- **WHEN** export choices are operated by keyboard at desktop or 375px width
- **THEN** labels, focus, prompt opt-in and download remain usable without page overflow

#### Scenario: U4 Clear filters or choose all

- **WHEN** filters are cleared or the user chooses All data
- **THEN** the summary explains the resulting full usage selection before download

#### Scenario: U5 Failed export

- **WHEN** server validation or size checking rejects the export
- **THEN** an actionable error is shown, no success is reported and retry is available
