import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { lstat, open, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMachineImportDefaults, importFromMachine } from "./machine-import";
import { MAX_RECORDS } from "./schema";
import { withLedger } from "./storage";
import { sample } from "./test-fixtures";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    lstat: vi.fn(actual.lstat),
    open: vi.fn(actual.open),
    readdir: vi.fn(actual.readdir),
  };
});

const machine = {
  id: "synthetic-computer",
  label: "Test computer",
  member: "Test member",
};
let directory: string;
let database: string;

function roots() {
  return [
    { provider: "claude-code" as const, path: join(directory, "claude") },
    { provider: "codex" as const, path: join(directory, "codex") },
  ];
}

function writeProviderFixtures() {
  for (const root of roots()) mkdirSync(root.path, { recursive: true });
  const timestamp = "2026-09-15T12:00:00Z";
  const claude = [
    {
      type: "user",
      sessionId: "claude-s1",
      uuid: "p1",
      timestamp,
      message: { role: "user", content: "Synthetic human task" },
    },
    {
      type: "assistant",
      sessionId: "claude-s1",
      timestamp,
      message: {
        id: "u1",
        model: "claude-sonnet-4-6",
        content: [{ type: "text", text: "SYNTHETIC_MODEL_OUTPUT" }],
        usage: { input_tokens: 100, output_tokens: 20 },
      },
    },
  ];
  const codex = [
    { type: "session_meta", timestamp, payload: { id: "codex-s1" } },
    {
      type: "turn_context",
      timestamp,
      payload: { turn_id: "t1", model: "unknown-lab" },
    },
    {
      type: "event_msg",
      timestamp,
      payload: {
        type: "user_message",
        client_id: "p1",
        message: "Synthetic human request",
      },
    },
    {
      type: "response_item",
      timestamp,
      payload: { role: "tool", content: "SYNTHETIC_TOOL_OUTPUT" },
    },
    {
      type: "token_usage_record",
      timestamp,
      payload: {
        response_id: "r1",
        thread_id: "codex-s1",
        turn_id: "t1",
        usage: {
          input_tokens: 100,
          cached_input_tokens: 20,
          output_tokens: 10,
          reasoning_output_tokens: 5,
        },
      },
    },
  ];
  writeFileSync(
    join(roots()[0].path, "session.jsonl"),
    claude.map((entry) => JSON.stringify(entry)).join("\n"),
  );
  writeFileSync(
    join(roots()[1].path, "session.jsonl"),
    codex.map((entry) => JSON.stringify(entry)).join("\n"),
  );
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "token-atlas-machine-unit-"));
  database = join(directory, "test.sqlite");
  vi.stubEnv("TOKEN_ATLAS_DB", database);
  vi.stubEnv("CLAUDE_CONFIG_DIR", join(directory, "configured-claude"));
  vi.stubEnv("CODEX_HOME", join(directory, "configured-codex"));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});

describe("explicit machine import", () => {
  it("suggests stable metadata and configured directories without filesystem reads", () => {
    const first = getMachineImportDefaults();
    expect(getMachineImportDefaults()).toEqual(first);
    expect(first.machine.member).toBe("Local user");
    expect(first.machine.id).toMatch(/^machine-[a-f0-9]{24}$/);
    expect(first.roots).toEqual([
      {
        provider: "claude-code",
        path: join(directory, "configured-claude", "projects"),
      },
      {
        provider: "codex",
        path: join(directory, "configured-codex", "sessions"),
      },
    ]);
    expect(lstat).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(readdir).not.toHaveBeenCalled();
    expect(existsSync(database)).toBe(false);
  });

  it("reuses existing portable attribution independently of local aliases without scanning folders", async () => {
    writeProviderFixtures();
    const defaults = getMachineImportDefaults();
    const original = { ...defaults.machine, member: "CodexSandboxOffline", label: "Original computer" };
    const input = { machine: original, roots: roots() };
    await importFromMachine(input);
    withLedger((ledger) => ledger.setDisplayNames(original.id, { member: "Chosen name", label: "Chosen computer" }));
    vi.clearAllMocks();
    const restored = getMachineImportDefaults();
    expect(restored.machine).toEqual(original);
    expect(lstat).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(readdir).not.toHaveBeenCalled();
    expect(await importFromMachine({ ...input, machine: restored.machine })).toMatchObject({ addedMachines: 0, addedUsage: 0, duplicates: 2 });
  });

  it("imports both providers privately, preserves unknown models, deduplicates repeats and permits prompt opt-in", async () => {
    writeProviderFixtures();
    const input = { machine, roots: roots() };
    const first = await importFromMachine(input);
    expect(first).toMatchObject({
      status: "imported",
      partial: false,
      filesRead: 2,
      usageCount: 2,
      promptCount: 0,
      addedMachines: 1,
      addedUsage: 2,
      addedPrompts: 0,
      duplicates: 0,
    });
    expect(first.sources.map((source) => source.usageCount)).toEqual([1, 1]);
    const saved = withLedger((ledger) => ledger.read());
    expect(saved.prompts).toEqual([]);
    expect(saved.usage.some((record) => record.model === "unknown-lab")).toBe(
      true,
    );
    expect(JSON.stringify(first)).not.toContain(directory);
    expect(await importFromMachine(input)).toMatchObject({
      addedUsage: 0,
      addedPrompts: 0,
      duplicates: 2,
    });
    expect(
      await importFromMachine({ ...input, includePrompts: true }),
    ).toMatchObject({ addedUsage: 0, addedPrompts: 2, duplicates: 2 });
    const withPrompts = withLedger((ledger) => ledger.read());
    expect(withPrompts.prompts).toHaveLength(2);
    expect(JSON.stringify(withPrompts)).not.toContain("SYNTHETIC_MODEL_OUTPUT");
    expect(JSON.stringify(withPrompts)).not.toContain("SYNTHETIC_TOOL_OUTPUT");
  });

  it("includes duplicate copies from collection in the reported duplicate total", async () => {
    writeProviderFixtures();
    writeFileSync(
      join(roots()[0].path, "copy.jsonl"),
      readFileSync(join(roots()[0].path, "session.jsonl")),
    );
    const input = { machine, roots: [roots()[0]] };
    expect(await importFromMachine(input)).toMatchObject({
      usageCount: 1,
      addedUsage: 1,
      duplicates: 1,
    });
    expect(await importFromMachine(input)).toMatchObject({
      usageCount: 1,
      addedUsage: 0,
      duplicates: 2,
    });
  });

  it("reports a missing provider as partial and still imports the other provider", async () => {
    writeProviderFixtures();
    const inputRoots = roots();
    inputRoots[0].path = join(directory, "missing-claude");
    const result = await importFromMachine({ machine, roots: inputRoots });
    expect(result).toMatchObject({
      status: "imported",
      partial: true,
      addedUsage: 1,
      filesRead: 1,
    });
    expect(result.sources[0]).toMatchObject({
      partial: true,
      filesRead: 0,
      diagnostics: [{ code: "unreadable-path" }],
    });
    expect(result.sources[1]).toMatchObject({ partial: false, usageCount: 1 });
    expect(JSON.stringify(result)).not.toContain(inputRoots[0].path);
  });

  it("keeps collecting Codex after Claude exhausts its traversal depth budget", async () => {
    writeProviderFixtures();
    const selected = roots();
    selected[0].path = join(directory, "deep-claude");
    const nested = join(selected[0].path, ...Array.from({ length: 21 }, () => "d"));
    mkdirSync(nested, { recursive: true });
    const result = await importFromMachine({ machine, roots: selected });
    expect(result).toMatchObject({ status: "imported", partial: true, addedUsage: 1, usageCount: 1, filesRead: 1 });
    expect(result.sources[0]).toMatchObject({ provider: "claude-code", partial: true, usageCount: 0 });
    expect(result.sources[0].diagnostics.some((diagnostic) => diagnostic.code === "scan-limit")).toBe(true);
    expect(result.sources[1]).toMatchObject({ provider: "codex", partial: false, filesRead: 1, usageCount: 1 });
    expect(withLedger((ledger) => ledger.read()).usage.map((record) => record.provider)).toEqual(["codex"]);
  });

  it("returns empty without even creating the database when roots have no records", async () => {
    const result = await importFromMachine({ machine, roots: roots() });
    expect(result).toMatchObject({
      status: "empty",
      partial: true,
      addedMachines: 0,
      addedUsage: 0,
      addedPrompts: 0,
    });
    expect(existsSync(database)).toBe(false);
  });

  it("rejects invalid entire requests before filesystem work", async () => {
    const valid = { machine, roots: [roots()[0]] };
    const invalid = [
      { ...valid, roots: [] },
      { ...valid, roots: [roots()[0], roots()[0]] },
      { ...valid, roots: [{ ...roots()[0], path: "relative/path" }] },
      { ...valid, roots: [{ ...roots()[0], path: " " }] },
      { ...valid, roots: [{ ...roots()[0], path: directory + "\0" }] },
      { ...valid, roots: [{ ...roots()[0], path: "x".repeat(4097) }] },
      { ...valid, roots: [{ ...roots()[0], surprise: true }] },
      { ...valid, machine: { ...machine, id: "invalid machine id" } },
      { ...valid, includePrompts: "true" },
      { ...valid, extra: true },
      ...(process.platform === "win32"
        ? [
            {
              ...valid,
              roots: [
                { ...roots()[0], path: "\\\\network-server\\private-share" },
              ],
            },
          ]
        : []),
    ];
    for (const input of invalid)
      await expect(importFromMachine(input)).rejects.toMatchObject({
        status: 400,
      });
    expect(lstat).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(readdir).not.toHaveBeenCalled();
    expect(existsSync(database)).toBe(false);
  });

  it("rolls back the other provider when saved usage or machine attribution conflicts", async () => {
    writeProviderFixtures();
    await importFromMachine({ machine, roots: [roots()[1]] });
    const prior = withLedger((ledger) => ledger.read());
    const codexFile = join(roots()[1].path, "session.jsonl");
    const entries = readFileSync(codexFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const usage = entries.find((entry) => entry.type === "token_usage_record");
    usage.payload.usage.input_tokens += 1;
    writeFileSync(
      codexFile,
      entries.map((entry) => JSON.stringify(entry)).join("\n"),
    );
    await expect(
      importFromMachine({ machine, roots: roots() }),
    ).rejects.toMatchObject({ status: 409 });
    expect(withLedger((ledger) => ledger.read()).usage).toEqual(prior.usage);
    await expect(
      importFromMachine({
        machine: { ...machine, member: "Changed member" },
        roots: [roots()[0]],
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(withLedger((ledger) => ledger.read()).usage).toEqual(prior.usage);
  });

  it("enforces the ledger-wide record limit without saving either provider", async () => {
    writeProviderFixtures();
    const usage = Array.from({ length: MAX_RECORDS }, (_, index) => ({
      ...sample.usage[0],
      id: `existing-${index}`,
    }));
    withLedger((ledger) => ledger.merge({ ...sample, usage, prompts: [] }));
    await expect(
      importFromMachine({ machine, roots: roots() }),
    ).rejects.toMatchObject({ status: 413 });
    const after = withLedger((ledger) => ledger.read());
    expect(after.usage).toHaveLength(MAX_RECORDS);
    expect(after.machines).toEqual(sample.machines);
  });

  it("rejects a combined provider bundle above the record limit before creating the ledger", async () => {
    writeProviderFixtures();
    const claudeFile = join(roots()[0].path, "session.jsonl");
    const codexFile = join(roots()[1].path, "session.jsonl");
    const claude = readFileSync(claudeFile, "utf8")
      .split("\n")
      .map((line) => JSON.parse(line));
    const codex = readFileSync(codexFile, "utf8")
      .split("\n")
      .map((line) => JSON.parse(line));
    const claudeUsage = claude.find((entry) => entry.type === "assistant");
    const codexUsage = codex.find(
      (entry) => entry.type === "token_usage_record",
    );
    const claudeRecords = Array.from({ length: 10_001 }, (_, index) => ({
      ...claudeUsage,
      message: { ...claudeUsage.message, id: `c-${index}` },
    }));
    const codexRecords = [
      codex[0],
      codex[1],
      ...Array.from({ length: 10_000 }, (_, index) => ({
        ...codexUsage,
        payload: { ...codexUsage.payload, response_id: `x-${index}` },
      })),
    ];
    writeFileSync(
      claudeFile,
      claudeRecords.map((entry) => JSON.stringify(entry)).join("\n"),
    );
    writeFileSync(
      codexFile,
      codexRecords.map((entry) => JSON.stringify(entry)).join("\n"),
    );
    await expect(
      importFromMachine({ machine, roots: roots() }),
    ).rejects.toMatchObject({ status: 413 });
    expect(existsSync(database)).toBe(false);
  });
});
