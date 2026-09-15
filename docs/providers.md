# Provider formats and pricing research

Verified **2026-09-15** against official documentation and public source code.
No real user sessions were read. Local JSONL is an implementation format, not a
versioned public API. The ingestion spec and synthetic regression fixtures define
the supported subset; this research does not imply support for every version.

## Normalized accounting

Follow [the portable contract](data-contract.md): `input` is uncached input;
`cacheRead`, `cacheWrite` and `cacheWrite1h` are separate input buckets. `output`
includes `reasoning`, so reasoning is never added again to the total or cost.
Never estimate token counts from prompt text. Missing usage is unknown.

## Claude Code

### Locations and usage

CLI transcripts normally live at
`~/.claude/projects/<encoded-project>/<session-id>.jsonl`; `CLAUDE_CONFIG_DIR`
can change the base directory. Subagent transcripts can live below
`<session-id>/subagents/`. Collection requires an explicit chosen root. See
[session storage](https://code.claude.com/docs/en/sessions).

Supported usage candidates have `type: "assistant"`, with model and usage under
`message.model` and `message.usage`, and a provider message identifier in
`message.id`. Multiple assistant blocks can share that identifier: **never sum
repeated IDs**. Ignore identical observations. Evolving or conflicting counts
need an explicit adapter rule and tests; they are not independent API requests.

Claude's `input_tokens` excludes cache reads and writes. Map
`cache_read_input_tokens` separately. `cache_creation_input_tokens` is the
aggregate write count; when `cache_creation.ephemeral_5m_input_tokens` and
`ephemeral_1h_input_tokens` are present, split writes accordingly without adding
the aggregate again. Without the duration split, a 5-minute assumption must be
disclosed or the write cost left unpriced.

**Output-count caveat:** current Agent SDK documentation says per-step
`output_tokens` can be a placeholder. SDK result `usage` covers the main agent
loop; `modelUsage` includes subagents. Result cost/model totals can be cumulative
in streaming-input mode. SDK streams and persisted CLI transcripts must not be
treated as interchangeable accounting contracts. Persisted reported output can
be displayed as reported usage, but must not be claimed as verified billed
output. See [cost tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking).

### Human prompts

Read original `type: "user"` entries and retain only string `message.content`
or top-level `text` blocks. Use the entry `uuid` for identity and `sessionId` for
the session. Exclude `isMeta`, `isCompactSummary`, `isSidechain`, `teamName`,
synthetic/subagent-origin entries, and messages containing `tool_result` blocks.
Never descend into tool results, image data, attachments or model output.

The official reader also identifies generated local-command output, hook/tick/
goal messages, interruption notices and standalone IDE context wrappers.
Slash-command wrappers are not automatically proof of human-authored text.
Ambiguous entries should produce a skipped-entry diagnostic.

For an archive of **all original prompts**, inspect eligible historical entries
and deduplicate UUIDs. Do not copy the SDK's current-chain reconstruction: it
intentionally replaces pre-compaction history with a generated summary.

Source: [official Python SDK session reader, commit
46fe65f](https://github.com/anthropics/claude-agent-sdk-python/blob/46fe65ff089722ba89da93717559b205439d8deb/src/claude_agent_sdk/_internal/sessions.py).

## Codex

Codex stores state below `CODEX_HOME`, normally `~/.codex`. Rollouts use the
`sessions` and `archived_sessions` directories. Read only explicitly selected
JSONL files; compressed archives and externally referenced history are separate
capabilities. [Configuration documentation](https://learn.chatgpt.com/docs/config-file/config-advanced),
[rollout storage source](https://github.com/openai/codex/blob/7f01a84effccef40d4726c3ca12e6c839ec98d7a/codex-rs/rollout/src/lib.rs).

### Modern usage records

Top-level `type: "token_usage_record"` has `payload.response_id`, `thread_id`,
`turn_id`, `session_id`, `root_turn_id`, `usage`, `turn_token_usage` and
`thread_token_usage`. Count only `payload.usage` once per provider response ID;
never add the turn/thread aggregates. Model comes from the applicable
`turn_context.payload.model`; missing attribution stays unknown.

Usage fields include `input_tokens`, `cached_input_tokens`,
`cache_write_input_tokens`, `output_tokens`, `reasoning_output_tokens` and
`total_tokens`. Cached input is included in input; reasoning is included in
output. New nonzero cache-write counts need a tested normalization rule and
matching price entry. They must not silently receive a zero-dollar write rate.

### Legacy cumulative records

Top-level `type: "event_msg"`, `payload.type: "token_count"` carries
`payload.info.total_token_usage` and `last_token_usage`. Repeated snapshots do
not represent additional usage. Derive nonnegative differences from cumulative
counters, suppress unchanged snapshots, and report counter decreases/resets.
Missing `info` means unknown. Do not add `last_token_usage` to cumulative deltas.
Modern records take precedence over legacy accounting within a file; mixed or
incomplete histories need a visible coverage limitation.

### Human prompts and identity

Use `type: "event_msg"`, `payload.type: "user_message"`, `payload.message`.
Do not collect `response_item` messages merely because their role is `user`:
they can duplicate the prompt or contain injected model context. Skip sessions
identified as subagents for human prompt collection while keeping their usage.
The event format can also carry system-origin input, so unsupported origins
must not be asserted to be verified human authorship.

`session_meta.payload.id` identifies the thread; newer `session_id` identifies
the root session. `client_id` and rollout `ordinal` are optional. Legacy prompt
IDs require a deterministic fallback that preserves repeated submissions and
remains stable on re-import. Moving a file must not change normalized identity.

Pinned source baseline, commit **7f01a84**:

- [Protocol types and token semantics](https://github.com/openai/codex/blob/7f01a84effccef40d4726c3ca12e6c839ec98d7a/codex-rs/protocol/src/protocol.rs)
- [Serialized JSONL payload types](https://github.com/openai/codex/blob/7f01a84effccef40d4726c3ca12e6c839ec98d7a/codex-rs/history/src/rollout_payload.rs)
- [Timestamped JSONL recorder](https://github.com/openai/codex/blob/7f01a84effccef40d4726c3ca12e6c839ec98d7a/codex-rs/rollout/src/recorder.rs)

## Conservative price snapshot

USD per **one million tokens**, standard processing, checked 2026-09-15.
Exact model IDs only; dated IDs and aliases need explicit verified entries.

| Model ID            | Uncached input | Cache read | 5-minute writes | 1-hour writes | Output |
| ------------------- | -------------: | ---------: | --------------: | ------------: | -----: |
| `claude-sonnet-4-6` |           3.00 |       0.30 |            3.75 |          6.00 |  15.00 |
| `claude-opus-4-6`   |           5.00 |       0.50 |            6.25 |         10.00 |  25.00 |
| `gpt-5.3-codex`     |           1.75 |      0.175 |        Unpriced |      Unpriced |  14.00 |
| `gpt-5.4`           |           2.50 |       0.25 |        Unpriced |      Unpriced |  15.00 |

Sources: [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing),
[GPT-5.3-Codex](https://developers.openai.com/api/docs/models/gpt-5.3-codex),
[GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4).

GPT-5.4 documents higher rates above 272K input tokens. Fast mode, residency,
long-context adjustments, tool charges and discounts are outside this baseline.
Claude 4.6 uses standard rates across its supported context window.

Display **Estimated API cost**, not subscription spend or an invoice. Retain
tokens for unknown models and display unpriced coverage. A record with nonzero
unsupported cache writes is unpriced. Do not infer a zero price from a missing
rate, infer a model from quota names, or apply today's snapshot as historical
billing truth. Keep the snapshot date and its assumptions visible.

### Additional exact IDs verified during implementation

The executable rate card also covers the following current models. USD/million:

| Exact ID        | Input | Cache read | Standard write | 1h write | Output |
| --------------- | ----: | ---------: | -------------: | -------: | -----: |
| gpt-6-astra     |    10 |          1 |           12.5 | Unpriced |     50 |
| gpt-5.6-sol     |     4 |        0.4 |              5 | Unpriced |     20 |
| gpt-5.6-terra   |     2 |        0.2 |            2.5 | Unpriced |     12 |
| gpt-5.6-luna    |   0.2 |       0.02 |           0.25 | Unpriced |    1.2 |
| claude-sonnet-5 |     2 |        0.2 |            2.5 |        4 |     10 |
| claude-opus-5   |     5 |        0.5 |           6.25 |       10 |     25 |

Sources: [Astra](https://developers.openai.com/api/docs/models/gpt-6-astra),
[Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol),
[Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra),
[Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna),
[OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching),
and [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
GPT-5.6+ standard writes use a 30-minute TTL; the guide establishes their 1.25x
input price and 0.1x read price. Fresh input excludes both reads and writes.
The current Claude page cancels a previously announced Sonnet 5 price increase;
the implemented snapshot uses its current$2/$10 input/output rates.

Explicit dated IDs: claude-sonnet-4-5-20250929, claude-opus-4-5-20251101,
claude-haiku-4-5-20251001. They use their documented 4.5 family rate, not substring
matching. [Model IDs](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions).
The complete 17-entry table, source URLs and missing-rate representation live in
`src/lib/pricing.ts` and the dashboard's Pricing view.
