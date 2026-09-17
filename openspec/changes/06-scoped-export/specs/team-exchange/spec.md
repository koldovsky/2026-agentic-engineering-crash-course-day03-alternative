## ADDED Requirements

### Requirement: Explicit export scope

The system SHALL support all-source and filtered export scope, defaulting to
all-source for backwards compatibility. Filtered export SHALL apply the
intersection of provider, member, exact model and inclusive UTC dates to usage.
Unknown models SHALL remain eligible. Export SHALL retain portable v1 and existing
size, origin and allowlist constraints without modifying the stored source.

#### Scenario: E1 Legacy request

- **WHEN** an export request omits scope and filters and omits includePrompts or sets it false
- **THEN** it exports all usage and machines in the selected source and no prompts

#### Scenario: E11 Legacy explicit prompt inclusion

- **WHEN** a legacy request omits scope and filters and sets includePrompts true
- **THEN** it preserves all usage, machines and stored human prompts, including
  prompt-only sessions, as the previous all-source export did

#### Scenario: E2 Filter intersection and date boundary

- **WHEN** filtered scope selects member Ada, provider codex, model unknown-lab,
  and from/to 2026-09-16
- **THEN** only matching usage from 00:00:00Z through 23:59:59.999Z is exported,
  including that unknown model, with its original token buckets and identifiers

#### Scenario: E12 Member display names preserve portable attribution

- **WHEN** filtered scope selects a local member display name that differs from
  the original imported member label
- **THEN** usage and opted-in prompts match the machines with that visible member,
  while the exported machine payloads retain their original attribution;
  a nonmatching name returns an empty filtered bundle

#### Scenario: E3 Strict invalid request

- **WHEN** filters include an unknown key, invalid provider/date or from after to,
  or scope is invalid
- **THEN** export returns a client error without a download or persistent changes

#### Scenario: E4 All source ignores valid filters

- **WHEN** scope is all and valid filters are supplied
- **THEN** all source usage is exported regardless of those filters

#### Scenario: E5 No matching records

- **WHEN** filtered scope matches no usage
- **THEN** a valid portable v1 bundle with empty usage, prompts and machines is returned

#### Scenario: E6 Filtered machine closure and repeat import

- **WHEN** a filtered bundle is exported and imported twice into a separate ledger
- **THEN** every exported record references an included machine, no unused machine
  is included, and the second import adds no duplicate usage or prompts

#### Scenario: E7 Empty filters

- **WHEN** scope is filtered and its filter object is empty
- **THEN** all usage matches and filtered prompt and machine rules still apply

## MODIFIED Requirements

### Requirement: Explicit prompt export

The system SHALL omit prompts from exports by default and include them only on
explicit selection. Export SHALL contain only allowed normalized fields.
All-source scope SHALL preserve the existing opt-in export of all stored human
prompts. Filtered scope SHALL include only opted-in prompts whose machine,
provider and session match selected usage and whose provider, member and UTC date
match the filters. Prompt search text and pagination SHALL NOT define export scope.

#### Scenario: Default export

- **WHEN** local records include human prompts and export uses defaults
- **THEN** the downloaded bundle has an empty prompts array and no prompt text

#### Scenario: Prompt-inclusive round trip

- **WHEN** prompt sharing is selected and an all-source file is imported into another ledger
- **THEN** eligible stored prompts and usage are preserved without model outputs

#### Scenario: E8 Same session ID on different machines or providers

- **WHEN** only a model filter selects usage on machine A, provider codex, session
  shared, while same-date prompts on machine B or provider claude-code share that
  session ID and their usage has another model, with identical member labels
- **THEN** those other prompts are excluded even when prompt sharing is selected

#### Scenario: E9 Out of range and prompt-only sessions

- **WHEN** filtered prompt sharing is selected and stored prompts either fall
  outside the date range or have no selected usage in their machine/provider/session
- **THEN** those prompts are excluded and matching in-range human prompts remain

#### Scenario: E10 Explicit prompt exclusion in either scope

- **WHEN** includePrompts is omitted or false for either scope
- **THEN** prompts is empty and no prompt text appears elsewhere in the bundle
