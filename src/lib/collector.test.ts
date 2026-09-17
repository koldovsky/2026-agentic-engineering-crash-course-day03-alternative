import { mkdtemp, mkdir, writeFile, readFile, truncate, symlink, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { collect, writeBundle } from "./collector";
import { BundleSchema, MAX_FILE_BYTES } from "./schema";

describe("explicit collector", () => {
  it.each(["claude-code", "codex"] as const)("treats known generated exclusions as complete and ambiguous prompts as partial for %s", async (provider) => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-prompt-coverage-"));
    const timestamp = "2026-09-15T12:00:00Z";
    const records = provider === "claude-code" ? [
      { type: "assistant", sessionId: "s1", timestamp, message: { id: "u1", model: "unknown-lab", usage: { input_tokens: 10, output_tokens: 1 } } },
      { type: "user", sessionId: "s1", uuid: "p1", timestamp, message: { role: "user", content: "Synthetic human request" } },
      { type: "user", sessionId: "s1", uuid: "tool", timestamp, message: { role: "user", content: [{ type: "tool_result", content: "EXCLUDED_TOOL_CONTENT" }] } },
    ] : [
      { type: "session_meta", timestamp, payload: { id: "s1", model: "unknown-lab" } },
      { type: "token_usage_record", timestamp, payload: { response_id: "r1", thread_id: "s1", usage: { input_tokens: 10, output_tokens: 1 } } },
      { type: "event_msg", timestamp, payload: { type: "user_message", client_id: "p1", message: "Synthetic human request" } },
      { type: "event_msg", timestamp, payload: { type: "user_message", message: "<system-reminder>EXCLUDED_GENERATED_CONTENT</system-reminder>" } },
    ];
    try {
      const file = join(directory, "session.jsonl");
      await writeFile(file, records.map((entry) => JSON.stringify(entry)).join("\n"));
      const options = { roots: [{ provider, path: directory }], machine: { id: "test", label: "Test", member: "Maya" }, includePrompts: true };
      const complete = await collect(options);
      expect(complete.partial).toBe(false);
      expect(complete.bundle.usage).toHaveLength(1);
      expect(complete.bundle.prompts.map((prompt) => prompt.text)).toEqual(["Synthetic human request"]);
      expect(JSON.stringify(complete)).not.toContain("EXCLUDED_");
      const ambiguous = provider === "claude-code"
        ? { type: "user", sessionId: "s1", uuid: "ambiguous", timestamp, message: { role: "user", content: {} } }
        : { type: "event_msg", timestamp, payload: { type: "user_message", message: {} } };
      await writeFile(file, [...records, ambiguous].map((entry) => JSON.stringify(entry)).join("\n"));
      expect((await collect(options)).partial).toBe(true);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("keeps incomplete coverage visible when diagnostic output is capped", async () => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-partial-"));
    try {
      await writeFile(join(directory, "broken.jsonl"), Array.from({ length: 210 }, () => "not-json").join("\n"));
      const result = await collect({ roots: [{ provider: "codex", path: directory }], machine: { id: "test", label: "Test", member: "Maya" } });
      expect(result.partial).toBe(true);
      expect(result.diagnostics).toHaveLength(200);
      expect(result.diagnostics.at(-1)?.code).toBe("diagnostic_limit");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("does not label unknown-model attribution or duplicate copies as omitted usage", async () => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-complete-"));
    try {
      const text = JSON.stringify({ type: "assistant", sessionId: "s1", timestamp: "2026-09-15T12:00:01Z", message: { id: "u1", usage: { input_tokens: 100, output_tokens: 20 } } });
      await writeFile(join(directory, "one.jsonl"), text);
      await writeFile(join(directory, "copy.jsonl"), text);
      const result = await collect({ roots: [{ provider: "claude-code", path: directory }], machine: { id: "test", label: "Test", member: "Maya" } });
      expect(result.partial).toBe(false);
      expect(result.duplicates).toBe(1);
      expect(result.bundle.usage[0].model).toBe("unknown");
      expect(result.diagnostics.some((item) => item.code === "unknown_model")).toBe(true);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("reports invalid UTF-8 without silently changing human text", async () => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-encoding-"));
    try {
      await writeFile(join(directory, "damaged.jsonl"), Buffer.concat([Buffer.from('{"text":"before'), Buffer.from([255]), Buffer.from('after"}') ]));
      const result = await collect({ roots: [{ provider: "claude-code", path: directory }], machine: { id: "test", label: "Test", member: "Maya" }, includePrompts: true });
      expect(result.filesRead).toBe(0); expect(result.bundle.prompts).toEqual([]);
      expect(result.diagnostics[0].code).toBe("invalid-encoding");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("skips oversize files and linked directories", async () => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-limits-"));
    try {
      const root = join(directory, "chosen"); const outside = join(directory, "outside");
      await mkdir(root); await mkdir(outside);
      const large = join(root, "large.jsonl"); await writeFile(large, "");
      await truncate(large, MAX_FILE_BYTES + 1);
      await symlink(outside, join(root, "linked"), "junction");
      const result = await collect({ roots: [{ provider: "codex", path: root }], machine: { id: "test", label: "Test", member: "Maya" } });
      expect(result.filesRead).toBe(0);
      expect(result.partial).toBe(true);
      expect(result.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining(["oversize-file", "symlink-skipped"]));
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("collects chosen roots, dedupes copies, preserves exports and defaults to no prompts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-collector-"));
    try {
      const root = join(directory, "chosen"); await mkdir(root);
      const text = [
        { type: "user", sessionId: "s1", uuid: "p1", timestamp: "2026-09-15T12:00:00Z", message: { role: "user", content: "Synthetic human prompt" } },
        { type: "assistant", sessionId: "s1", timestamp: "2026-09-15T12:00:01Z", message: { id: "u1", model: "claude-sonnet-4-6", content: [{ type: "text", text: "PRIVATE_MODEL_OUTPUT" }], usage: { input_tokens: 100, output_tokens: 20 } } },
      ].map((value) => JSON.stringify(value)).join("\n");
      await writeFile(join(root, "one.jsonl"), text);
      await writeFile(join(root, "copy.jsonl"), text);
      await writeFile(join(root, "ignored.txt"), "not a transcript");
      const result = await collect({ roots: [{ provider: "claude-code", path: root }], machine: { id: "test", label: "Test machine", member: "Maya" } });
      expect(result.filesRead).toBe(2); expect(result.bundle.usage).toHaveLength(1);
      expect(result.bundle.prompts).toEqual([]); expect(result.duplicates).toBe(1);
      expect(JSON.stringify(result)).not.toContain("PRIVATE_MODEL_OUTPUT");
      const target = join(directory, "result.json"); await writeBundle(target, result.bundle);
      expect(BundleSchema.parse(JSON.parse(await readFile(target, "utf8"))).usage).toHaveLength(1);
      await expect(writeBundle(target, result.bundle)).rejects.toMatchObject({ code: "EEXIST" });
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it("reports missing explicitly requested roots without inventing records", async () => {
    const directory = await mkdtemp(join(tmpdir(), "token-atlas-missing-"));
    try {
      const result = await collect({ roots: [{ provider: "codex", path: join(directory, "missing") }], machine: { id: "test", label: "Test", member: "Maya" } });
      expect(result.filesRead).toBe(0); expect(result.bundle.usage).toEqual([]);
      expect(result.diagnostics[0].code).toBe("unreadable-path");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
