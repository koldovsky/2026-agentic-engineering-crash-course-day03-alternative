import { mkdtemp, mkdir, writeFile, readFile, truncate, symlink, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { collect, writeBundle } from "./collector";
import { BundleSchema, MAX_FILE_BYTES } from "./schema";

describe("explicit collector", () => {
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
