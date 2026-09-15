import { describe, expect, it } from "vitest";
import { parseTranscript, type ParseOptions } from "./parsers";
import { BundleSchema, MAX_FILE_BYTES, MAX_RECORDS, tokenTotal } from "./schema";

const options: ParseOptions = {
  provider: "claude-code", machine: { id: "laptop-1", label: "Workshop laptop", member: "Alex" }, includePrompts: true,
};
const time = "2026-09-15T12:00:00.000Z";
const jsonl = (...entries: unknown[]) => entries.map((entry) => JSON.stringify(entry)).join("\n");
const claudeUsage = (usage: Record<string, unknown> = {}, extras: Record<string, unknown> = {}) => ({
  type: "assistant", sessionId: "session-1", timestamp: time, uuid: "block-1",
  message: { id: "message-1", model: "claude-sonnet-4-6", content: [{ type: "text", text: "PRIVATE_ASSISTANT_OUTPUT" }], usage: {
    input_tokens: 100, output_tokens: 10, cache_read_input_tokens: 40, cache_creation_input_tokens: 0, ...usage,
  } }, ...extras,
});
const claudePrompt = (content: unknown = "Build a token dashboard", extras: Record<string, unknown> = {}) => ({
  type: "user", sessionId: "session-1", timestamp: time, uuid: "prompt-1", message: { role: "user", content }, ...extras,
});
const codexMeta = (extras: Record<string, unknown> = {}) => ({ type: "session_meta", timestamp: time, payload: { id: "thread-1", source: "cli", ...extras } });
const codexContext = (extras: Record<string, unknown> = {}) => ({ type: "turn_context", timestamp: time, payload: { turn_id: "turn-1", model: "gpt-5.4", ...extras } });
const codexTokens = (extras: Record<string, unknown> = {}) => ({ input_tokens: 100, cached_input_tokens: 20, output_tokens: 10, reasoning_output_tokens: 4, ...extras });
const codexLegacy = (tokens = codexTokens(), extras: Record<string, unknown> = {}) => ({ type: "event_msg", timestamp: time, payload: { type: "token_count", info: { total_token_usage: tokens, last_token_usage: { input_tokens: 999_999 } } }, ...extras });
const codexModern = (tokens = codexTokens(), extras: Record<string, unknown> = {}) => ({ type: "token_usage_record", timestamp: time, payload: {
  response_id: "response-1", thread_id: "thread-1", session_id: "root-1", turn_id: "turn-1", usage: tokens,
  turn_token_usage: { input_tokens: 999_999 }, thread_token_usage: { input_tokens: 999_999 }, ...extras,
} });
const codexPrompt = (extras: Record<string, unknown> = {}) => ({ type: "event_msg", timestamp: time, payload: { type: "user_message", message: "Build a token dashboard", ...extras } });
const parseCodex = (...entries: unknown[]) => parseTranscript(jsonl(...entries), { ...options, provider: "codex" });
const codes = (result: ReturnType<typeof parseTranscript>) => result.diagnostics.map((diagnostic) => diagnostic.code);

describe("Claude transcript normalization", () => {
  it("deduplicates assistant blocks without retaining their content", () => {
    const first = claudeUsage();
    const second = { ...first, uuid: "different-block", timestamp: "2026-09-15T12:00:01Z" };
    const result = parseTranscript(jsonl(first, second), options);
    expect(result.bundle.usage).toHaveLength(1);
    expect(result.bundle.usage[0].tokens).toEqual({ input: 100, cacheRead: 40, cacheWrite: 0, cacheWrite1h: 0, output: 10, reasoning: 0 });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_ASSISTANT_OUTPUT");
    expect(codes(result)).toContain("claude_reported_usage");
    expect(BundleSchema.safeParse(result.bundle).success).toBe(true);
  });

  it("retains the latest monotonic vector and reports conflicts without mixing maxima", () => {
    const result = parseTranscript(jsonl(
      claudeUsage(),
      claudeUsage({ input_tokens: 120, output_tokens: 20 }, { timestamp: "2026-09-15T12:00:01Z" }),
      claudeUsage({ input_tokens: 110, output_tokens: 40 }),
    ), options);
    expect(result.bundle.usage).toHaveLength(1);
    expect(result.bundle.usage[0].tokens.input).toBe(120);
    expect(result.bundle.usage[0].tokens.output).toBe(20);
    expect(result.bundle.usage[0].timestamp).toBe(time);
    expect(codes(result)).toEqual(expect.arrayContaining(["usage_updated", "usage_conflict"]));
  });

  it("splits cache writes once and discloses missing duration assumptions", () => {
    const split = parseTranscript(jsonl(claudeUsage({ cache_creation_input_tokens: 50, cache_creation: { ephemeral_5m_input_tokens: 30, ephemeral_1h_input_tokens: 20 } })), options);
    expect(split.bundle.usage[0].tokens).toMatchObject({ cacheWrite: 30, cacheWrite1h: 20 });
    expect(tokenTotal(split.bundle.usage[0].tokens)).toBe(200);
    expect(codes(split)).not.toContain("cache_duration_assumed");
    const missing = parseTranscript(jsonl(claudeUsage({ cache_creation_input_tokens: 50 })), options);
    expect(missing.bundle.usage[0].tokens).toMatchObject({ cacheWrite: 50, cacheWrite1h: 0 });
    expect(codes(missing)).toContain("cache_duration_assumed");
  });

  it("rejects inconsistent cache totals", () => {
    const result = parseTranscript(jsonl(claudeUsage({ cache_creation_input_tokens: 60, cache_creation: { ephemeral_5m_input_tokens: 30, ephemeral_1h_input_tokens: 20 } })), options);
    expect(result.bundle.usage).toHaveLength(0);
    expect(codes(result)).toContain("invalid_cache_split");
  });

  it.each([-1, 1.1, "12", null, undefined, 1_000_000_001])("does not invent missing or invalid input counts: %s", (input_tokens) => {
    const result = parseTranscript(jsonl(claudeUsage({ input_tokens }), claudeUsage({}, { uuid: "valid" })), options);
    expect(result.bundle.usage).toHaveLength(1);
    expect(codes(result)).toContain("invalid_usage");
  });

  it("collects original historical user text only, independent of parent chains", () => {
    const secret = "EXCLUDED_PRIVATE_CONTENT";
    const exclusions = [
      claudePrompt(secret, { uuid: "meta", isMeta: true }),
      claudePrompt(secret, { uuid: "summary", isCompactSummary: true }),
      claudePrompt(secret, { uuid: "synthetic", isSynthetic: true }),
      claudePrompt(secret, { uuid: "sidechain", isSidechain: true }),
      claudePrompt(secret, { uuid: "team", teamName: "team" }),
      claudePrompt(secret, { uuid: "subagent", parent_tool_use_id: "tool-1" }),
      claudePrompt(secret, { uuid: "origin", origin: { type: "system" } }),
      claudePrompt([{ type: "text", text: secret }, { type: "tool_result", content: "TOOL_RESULT_SECRET" }], { uuid: "tool" }),
      claudePrompt(`<session-start-hook>${secret}</session-start-hook>`, { uuid: "hook" }),
      claudePrompt(`<ide_opened_file>${secret}</ide_opened_file>`, { uuid: "ide" }),
      claudePrompt(`<command-name>/review</command-name>${secret}`, { uuid: "command" }),
    ];
    const result = parseTranscript(jsonl(
      claudePrompt("Before compaction", { uuid: "before", parentUuid: null }),
      ...exclusions,
      claudePrompt([{ type: "text", text: "After compaction" }, { type: "image", source: { data: secret } }, { type: "text", text: `<system-reminder>${secret}</system-reminder>` }], { uuid: "after", parentUuid: "summary" }),
      claudeUsage(),
    ), options);
    expect(result.bundle.prompts.map((prompt) => prompt.text)).toEqual(["Before compaction", "After compaction"]);
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(JSON.stringify(result)).not.toContain("TOOL_RESULT_SECRET");
  });

  it("does not collect later unmarked inputs from a known subagent transcript", () => {
    const result = parseTranscript(jsonl(claudePrompt("AGENT_INSTRUCTION", { isSidechain: true }), claudePrompt("AGENT_FOLLOWUP", { uuid: "p2" }), claudeUsage()), options);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(result.bundle.usage).toHaveLength(1);
  });

  it("deduplicates native prompt UUIDs but preserves repeated human submissions", () => {
    const result = parseTranscript(jsonl(claudePrompt(), claudePrompt(), claudePrompt(undefined, { uuid: "prompt-2" })), options);
    expect(result.bundle.prompts).toHaveLength(2);
    const fallback = parseTranscript(jsonl(claudePrompt("Again", { uuid: undefined }), claudePrompt("Again", { uuid: undefined })), options);
    expect(fallback.bundle.prompts).toHaveLength(2);
    expect(new Set(fallback.bundle.prompts.map((prompt) => prompt.id)).size).toBe(2);
  });
});

describe("Codex transcript normalization", () => {
  it("counts legacy cumulative differences once and ignores last-request fields", () => {
    const result = parseCodex(codexMeta(), codexContext(), codexLegacy(), codexLegacy(), codexLegacy(codexTokens({ input_tokens: 160, cached_input_tokens: 30, output_tokens: 25, reasoning_output_tokens: 8 })));
    expect(result.bundle.usage).toHaveLength(2);
    const totals = result.bundle.usage.reduce((sum, item) => ({ input: sum.input + item.tokens.input, read: sum.read + item.tokens.cacheRead, output: sum.output + item.tokens.output, reasoning: sum.reasoning + item.tokens.reasoning }), { input: 0, read: 0, output: 0, reasoning: 0 });
    expect(totals).toEqual({ input: 130, read: 30, output: 25, reasoning: 8 });
    expect(result.bundle.usage.every((record) => record.model === "gpt-5.4")).toBe(true);
    expect(codes(result)).toContain("legacy_snapshot_coverage");
  });

  it("skips and rebaselines a reset instead of counting the reset snapshot", () => {
    const result = parseCodex(codexMeta(), codexContext(),
      codexLegacy(codexTokens({ cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0 })),
      codexLegacy(codexTokens({ input_tokens: 40, cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0 })),
      codexLegacy(codexTokens({ input_tokens: 70, cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0 })),
    );
    expect(result.bundle.usage.map((usage) => usage.tokens.input)).toEqual([100, 30]);
    expect(codes(result)).toContain("cumulative_reset");
  });

  it("rejects subset-invalid cumulative deltas and resumes from their baseline", () => {
    const result = parseCodex(codexMeta(), codexContext(), codexLegacy(),
      codexLegacy(codexTokens({ input_tokens: 110, cached_input_tokens: 40 })),
      codexLegacy(codexTokens({ input_tokens: 130, cached_input_tokens: 40 })),
    );
    expect(result.bundle.usage.map((usage) => usage.tokens.input)).toEqual([80, 20]);
    expect(codes(result)).toContain("invalid_usage_delta");
  });

  it("uses deduplicated modern responses instead of legacy, turn and thread totals", () => {
    const result = parseCodex(codexMeta(), codexContext(), codexLegacy(codexTokens({ input_tokens: 999_999 })), codexModern(), codexModern());
    expect(result.bundle.usage).toHaveLength(1);
    expect(result.bundle.usage[0]).toMatchObject({ sessionId: "thread-1", model: "gpt-5.4", tokens: { input: 80, cacheRead: 20, output: 10, reasoning: 4 } });
    expect(codes(result)).toContain("modern_precedence");
  });

  it("reports missing modern coverage without falling back to possibly duplicated legacy totals", () => {
    const result = parseCodex(codexMeta(), codexContext(), codexLegacy(), { type: "token_usage_record", timestamp: time, payload: {} });
    expect(result.bundle.usage).toHaveLength(0);
    expect(codes(result)).toEqual(expect.arrayContaining(["modern_precedence", "invalid_usage", "no_usage"]));
  });

  it("retains provider writes in a separate unpriced bucket", () => {
    const result = parseCodex(codexMeta(), codexContext(), codexModern(codexTokens({ cache_write_input_tokens: 30 })));
    expect(result.bundle.usage[0].tokens).toMatchObject({ input: 50, cacheRead: 20, cacheWrite: 30 });
    expect(tokenTotal(result.bundle.usage[0].tokens)).toBe(110);
    expect(codes(result)).toContain("unpriced_cache_writes");
  });

  it.each([
    { input_tokens: -1 }, { output_tokens: undefined }, { cached_input_tokens: 101 },
    { cached_input_tokens: 80, cache_write_input_tokens: 30 }, { reasoning_output_tokens: 11 },
    { output_tokens: "10" }, { output_tokens: 0.5 },
  ])("skips invalid usage and preserves the next valid response: %j", (invalid) => {
    const result = parseCodex(codexMeta(), codexContext(), codexModern(codexTokens(invalid)), codexModern(codexTokens(), { response_id: "good" }));
    expect(result.bundle.usage).toHaveLength(1);
    expect(codes(result)).toContain("invalid_usage");
  });

  it("collects only eligible input events and excludes injected context and synthetic origins", () => {
    const secret = "PRIVATE_CODEX_CONTENT";
    const result = parseCodex(codexMeta(), codexContext(), codexPrompt({ client_id: "client-1" }), codexPrompt({ client_id: "client-1" }),
      { type: "response_item", timestamp: time, payload: { type: "message", role: "user", content: [{ type: "input_text", text: secret }] } },
      codexPrompt({ message: secret, origin: "system" }), codexPrompt({ message: secret, isSynthetic: true }),
      codexPrompt({ message: `<environment_context>${secret}</environment_context>` }),
      { type: "event_msg", timestamp: time, payload: { type: "agent_message", message: secret } },
    );
    expect(result.bundle.prompts).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("preserves repeated prompt submissions and deduplicates explicit ordinals", () => {
    const repeated = parseCodex(codexMeta(), codexPrompt(), codexPrompt());
    expect(repeated.bundle.prompts).toHaveLength(2);
    const indexed = parseCodex(codexMeta(), { ...codexPrompt(), ordinal: 2 }, { ...codexPrompt(), ordinal: 2 });
    expect(indexed.bundle.prompts).toHaveLength(1);
  });

  it("excludes subagent prompts while retaining usage", () => {
    const result = parseCodex(codexMeta({ source: { subagent: { thread_spawn: { parent_thread_id: "root-1" } } } }), codexContext(), codexPrompt({ message: "AGENT_TASK_SECRET" }), codexModern());
    expect(result.bundle.prompts).toHaveLength(0);
    expect(result.bundle.usage).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain("AGENT_TASK_SECRET");
  });

  it("keeps missing model attribution unknown and supports models changing by turn", () => {
    const unknown = parseCodex(codexMeta(), codexModern());
    expect(unknown.bundle.usage[0].model).toBe("unknown");
    expect(codes(unknown)).toContain("unknown_model");
    const changed = parseCodex(codexMeta(), codexContext(), codexModern(), codexContext({ turn_id: "turn-2", model: "gpt-5.3-codex" }), codexModern(codexTokens(), { turn_id: "turn-2", response_id: "response-2" }));
    expect(changed.bundle.usage.map((usage) => usage.model)).toEqual(["gpt-5.4", "gpt-5.3-codex"]);
  });
});

describe("transcript boundaries and identity", () => {
  it.each(["claude-code", "codex"] as const)("includes no prompt or output text when collection is disabled for %s", (provider) => {
    const entries = provider === "claude-code" ? [claudePrompt("DO_NOT_EXPORT_THIS_PROMPT"), claudeUsage()]
      : [codexMeta(), codexContext(), codexPrompt({ message: "DO_NOT_EXPORT_THIS_PROMPT" }), codexModern()];
    const result = parseTranscript(jsonl(...entries), { ...options, provider, includePrompts: false });
    expect(result.bundle.prompts).toHaveLength(0);
    expect(result.bundle.usage).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain("DO_NOT_EXPORT_THIS_PROMPT");
    expect(JSON.stringify(result)).not.toContain("PRIVATE_ASSISTANT_OUTPUT");
  });

  it("salvages valid lines without echoing malformed or unknown content", () => {
    const input = `\uFEFF${jsonl(claudeUsage())}\r\n{MALFORMED_SECRET}\n[]\n${jsonl({ type: "future_type", content: "UNKNOWN_SECRET" })}`;
    const result = parseTranscript(input, options);
    expect(result.bundle.usage).toHaveLength(1);
    expect(result.diagnostics).toEqual(expect.arrayContaining([{ code: "malformed_json", message: expect.any(String), line: 2 }]));
    expect(JSON.stringify(result)).not.toContain("MALFORMED_SECRET");
    expect(JSON.stringify(result)).not.toContain("UNKNOWN_SECRET");
  });

  it("uses stable IDs independent of import date, member label and unrelated lines", () => {
    const input = jsonl(claudeUsage(), claudePrompt());
    const first = parseTranscript(input, options);
    const second = parseTranscript(`${input}\n${jsonl({ type: "summary", text: "Unrelated generated summary" })}`, { ...options, machine: { ...options.machine, label: "Renamed label" } });
    expect(first.bundle.usage.map((record) => record.id)).toEqual(second.bundle.usage.map((record) => record.id));
    expect(first.bundle.prompts.map((record) => record.id)).toEqual(second.bundle.prompts.map((record) => record.id));
  });

  it("uses deterministic fallback session/record identities", () => {
    const entry = claudeUsage();
    const text = jsonl({ ...entry, sessionId: undefined, message: { ...entry.message, id: undefined } });
    const first = parseTranscript(text, options);
    const second = parseTranscript(text, options);
    expect(first.bundle.usage).toEqual(second.bundle.usage);
    expect(first.bundle.usage[0].sessionId).toMatch(/^snapshot-/);
    expect(codes(first)).toEqual(expect.arrayContaining(["identity_fallback", "session_fallback"]));
  });

  it("validates real timestamps and normalizes offsets", () => {
    const result = parseTranscript(jsonl(claudeUsage({}, { timestamp: "2026-02-30T12:00:00Z" }), claudeUsage({}, { timestamp: "2026-09-15T15:00:00+03:00" })), options);
    expect(result.bundle.usage).toHaveLength(1);
    expect(result.bundle.usage[0].timestamp).toBe(time);
    expect(codes(result)).toContain("invalid_timestamp");
  });

  it("bounds diagnostics and excludes raw malformed text", () => {
    const result = parseTranscript("{MALFORMED_PRIVATE_LINE}\n".repeat(1000), options);
    expect(result.diagnostics).toHaveLength(200);
    expect(codes(result)).toContain("diagnostic_limit");
    expect(JSON.stringify(result)).not.toContain("MALFORMED_PRIVATE_LINE");
  });

  it("bounds file bytes, source lines and emitted records", () => {
    const oversized = parseTranscript("x".repeat(MAX_FILE_BYTES + 1), options);
    expect(codes(oversized)).toContain("file_limit");
    expect(oversized.bundle.usage).toHaveLength(0);
    const manyLines = parseTranscript("\n".repeat(100_001), options);
    expect(codes(manyLines)).toContain("line_limit");
    const manyRecords = parseTranscript(jsonl(...Array.from({ length: MAX_RECORDS + 1 }, (_, index) => claudePrompt("Prompt", { uuid: `prompt-${index}` }))), options);
    expect(manyRecords.bundle.prompts).toHaveLength(MAX_RECORDS);
    expect(codes(manyRecords)).toContain("prompt_limit");
    expect(BundleSchema.safeParse(manyRecords.bundle).success).toBe(true);
  });
});
