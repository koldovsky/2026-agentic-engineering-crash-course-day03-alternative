## Why

The user's current Codex app records submitted input as `event_msg` / `item_completed`
with a `UserMessage` item. Token Atlas only extracts legacy `user_message` events,
so usage imports successfully while the Codex human-prompt view remains empty.

## What Changes

- Recognize explicit completed Codex user-message items alongside legacy events.
- Keep generated context, assistant/tool content, attachments and subagent inputs
  outside human prompt text; retain explicit prompt opt-in.
- Preserve stable identities and support re-importing existing usage to add newly
  recognized prompts without changing usage totals.
- Add synthetic format, privacy, mixed-format and browser regression evidence;
  document the supported format and recovery through explicit re-import.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-ingestion`: current completed Codex user items are eligible human inputs.

## Impact

Codex adapter, synthetic parser/import/browser tests, provider and collection
documentation. No schema, pricing, usage-normalization or visual-layout change.
Existing data is not scanned or modified automatically.
