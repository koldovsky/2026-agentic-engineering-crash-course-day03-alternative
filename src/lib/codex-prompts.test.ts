import { describe, expect, it } from "vitest";
import { parseTranscript } from "./parsers";
import { Ledger } from "./storage";

const timestamp = "2026-09-17T10:00:00.000Z";
const machine = { id: "current-codex-machine", label: "Synthetic computer", member: "Test member" };
const meta = (extra = {}) => ({ type: "session_meta", timestamp, payload: { id: "current-thread", source: "vscode", ...extra } });
const block = (text: string, extra = {}) => ({ type: "text", text, text_elements: [], ...extra });
const completed = (content: unknown = [block("Synthetic current request")], item = {}, event = {}, entry = {}) => ({
  type: "event_msg", timestamp, ordinal: 17, payload: {
    type: "item_completed", thread_id: "current-thread", turn_id: "turn-1",
    item: { type: "UserMessage", id: "item-1", client_id: "client-1", content, ...item }, ...event,
  }, ...entry,
});
const legacy = (extra = {}, entry = {}) => ({ type: "event_msg", timestamp, payload: {
  type: "user_message", client_id: "client-1", message: "Synthetic current request", ...extra,
}, ...entry });
const usage = { type: "token_usage_record", timestamp, payload: { response_id: "response-1", thread_id: "current-thread", usage: { input_tokens: 100, output_tokens: 20 } } };
const parse = (entries: unknown[], includePrompts = true) => parseTranscript(entries.map((entry) => JSON.stringify(entry)).join("\n"), {
  provider: "codex", machine, includePrompts,
});
const codes = (result: ReturnType<typeof parse>) => result.diagnostics.map((d) => d.code);

describe("current Codex human prompts", () => {
  it("reads completed user text in order without storing attachments or model-facing context", () => {
    const result = parse([meta(), completed([
      block("Keep the first line.\n"), { type: "image", image_url: "PRIVATE_IMAGE_URL" },
      block("Keep the second line."), { type: "local_image", path: "PRIVATE_IMAGE_PATH" },
    ]), { type: "response_item", timestamp, payload: { type: "message", role: "user", content: [{ type: "input_text", text: "PRIVATE_INJECTED_CONTEXT" }] } }, usage]);
    expect(result.bundle.prompts.map((p) => p.text)).toEqual(["Keep the first line.\nKeep the second line."]);
    expect(result.bundle.prompts[0]).toMatchObject({ provider: "codex", sessionId: "current-thread", timestamp });
    expect(result.bundle.usage).toHaveLength(1);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE_IMAGE|PRIVATE_INJECTED/);
  });

  it("ignores started, assistant, tool and reasoning items", () => {
    const entries = [
      completed([block("PRIVATE_STARTED")], {}, { type: "item_started" }),
      ...["AgentMessage", "ToolCall", "Reasoning"].map((type) => completed([block("PRIVATE_OUTPUT")], { type })),
    ];
    const result = parse([meta(), ...entries, usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
  });

  it.each(["entry", "event", "item", "block"])("rejects generated origin at the %s boundary", (boundary) => {
    const flag = { origin: { type: "system" } };
    const result = parse([meta(), completed([block("PRIVATE_GENERATED", boundary === "block" ? flag : {})],
      boundary === "item" ? flag : {}, boundary === "event" ? flag : {}, boundary === "entry" ? flag : {}), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(codes(result)).toContain("generated_codex_prompts");
    expect(JSON.stringify(result)).not.toContain("PRIVATE_GENERATED");
  });

  it("excludes generated text even when it follows an ordinary block", () => {
    const result = parse([meta(), completed([block("Human-looking prefix"), block("<system-reminder>PRIVATE_CONTEXT</system-reminder>")]), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(codes(result)).toContain("generated_codex_prompts");
    expect(JSON.stringify(result)).not.toContain("PRIVATE_CONTEXT");
  });

  it.each([
    { source: { subagent: { thread_spawn: { parent_thread_id: "parent" } } } },
    { parent_thread_id: "parent" },
    { agent_path: "/root/worker" },
  ])("retains subagent usage while excluding delegated instructions: %j", (details) => {
    const result = parse([meta(details), completed([block("PRIVATE_DELEGATED_TASK")]), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(result.bundle.usage).toHaveLength(1);
    expect(codes(result)).toContain("generated_codex_prompts");
  });

  it.each([
    null, "PRIVATE_UNSUPPORTED", [{ type: "future_text", text: "PRIVATE_UNSUPPORTED" }],
    [block("Synthetic text"), { type: "text", text: { secret: "PRIVATE_UNSUPPORTED" } }],
  ].map((content) => [content]))("reports malformed content without leaking it: %j", (content) => {
    const result = parse([meta(), completed(content), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(codes(result)).toContain("excluded_codex_prompts");
    expect(JSON.stringify(result)).not.toContain("PRIVATE_UNSUPPORTED");
  });

  it("does not misclassify an unknown origin as human", () => {
    const result = parse([meta(), completed([block("PRIVATE_UNKNOWN")], { origin: "future-origin" }), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(codes(result)).toContain("excluded_codex_prompts");
  });

  it.each(["subagent", "guardian_review", "memory_consolidation"])("excludes the generated thread source %s", (thread_source) => {
    const result = parse([meta({ thread_source }), completed(), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(result.bundle.usage).toHaveLength(1);
    expect(codes(result)).toContain("generated_codex_prompts");
  });

  it("accepts explicit user threads and diagnoses unknown thread origins", () => {
    expect(parse([meta({ thread_source: "user" }), completed(), usage]).bundle.prompts).toHaveLength(1);
    const result = parse([meta({ thread_source: "future-origin" }), completed(), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(codes(result)).toContain("excluded_codex_prompts");
  });

  it.each(["guardian", "memory_consolidation"])("excludes the internal %s session even without thread_source", (internal) => {
    const result = parse([meta({ source: { internal } }), completed(), legacy(), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(result.bundle.usage).toHaveLength(1);
    expect(codes(result)).toContain("generated_codex_prompts");
  });

  it("rejects unknown internal-session origins without asserting human authorship", () => {
    const result = parse([meta({ source: { internal: "future-generated-task" } }), completed(), usage]);
    expect(result.bundle.prompts).toHaveLength(0);
    expect(codes(result)).toContain("excluded_codex_prompts");
  });

  it("keeps completed prompt and usage attribution on the event's explicit owning thread", () => {
    const result = parse([meta(), completed(undefined, {}, { thread_id: "owning-thread" }),
      { ...usage, payload: { ...usage.payload, thread_id: "owning-thread" } }]);
    expect(result.bundle.prompts[0].sessionId).toBe("owning-thread");
    expect(result.bundle.usage[0].sessionId).toBe("owning-thread");
  });

  it("keeps distinct equal-text submissions and deduplicates repeated completions", () => {
    const entries = [meta(), completed(), completed(), completed(undefined, { id: "item-2", client_id: "client-2" }), usage];
    const first = parse(entries).bundle;
    const repeat = parse([...entries, { type: "response_item", payload: { role: "assistant", content: [] } }]).bundle;
    expect(first.prompts).toHaveLength(2);
    expect(first.prompts).toEqual(repeat.prompts);
    expect(first.prompts[0].id).not.toBe(first.prompts[1].id);
  });

  it("preserves legacy identity and time for mixed matching client events in either order", () => {
    const old = legacy({}, { timestamp: "2026-09-17T09:59:59.000Z" });
    const original = parse([meta(), old, usage]).bundle.prompts;
    for (const events of [[completed(), old], [old, completed()]]) {
      expect(parse([meta(), ...events, usage]).bundle.prompts).toEqual(original);
    }
  });

  it("does not let an ineligible legacy twin hide a valid completed message", () => {
    const result = parse([meta(), legacy({ origin: "unknown-source" }), completed(), usage]);
    expect(result.bundle.prompts.map((p) => p.text)).toEqual(["Synthetic current request"]);
  });

  it("uses item identity when no client ID exists and retains equal-text distinct items", () => {
    const result = parse([meta(), completed(undefined, { client_id: undefined }), completed(undefined, { client_id: undefined }),
      completed(undefined, { client_id: undefined, id: "item-2" }), usage]);
    expect(result.bundle.prompts).toHaveLength(2);
  });

  it("adds prompts to usage-only imports without changing existing usage or duplicating on repeat", () => {
    const entries = [meta(), completed(), usage];
    const ledger = new Ledger(":memory:");
    try {
      const without = parse(entries, false);
      expect(JSON.stringify(without)).not.toContain("Synthetic current request");
      expect(ledger.merge(without.bundle)).toMatchObject({ addedUsage: 1, addedPrompts: 0 });
      const before = ledger.read().usage;
      expect(ledger.merge(parse(entries).bundle)).toMatchObject({ addedUsage: 0, addedPrompts: 1 });
      expect(ledger.merge(parse(entries).bundle)).toMatchObject({ addedUsage: 0, addedPrompts: 0 });
      expect(ledger.read().usage).toEqual(before);
      expect(ledger.read().prompts).toHaveLength(1);
    } finally { ledger.close(); }
  });
});
