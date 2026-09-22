## MODIFIED Requirements

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
