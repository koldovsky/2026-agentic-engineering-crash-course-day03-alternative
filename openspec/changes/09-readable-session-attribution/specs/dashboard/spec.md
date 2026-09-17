## ADDED Requirements

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
