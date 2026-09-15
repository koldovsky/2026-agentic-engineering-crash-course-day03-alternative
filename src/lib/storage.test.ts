import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Ledger, ImportConflictError } from "./storage";
import { sample } from "./test-fixtures";

describe("durable atomic ledger", () => {
  it("survives reopen and counts repeated imports only once", () => {
    const directory = mkdtempSync(join(tmpdir(), "token-atlas-test-"));
    const path = join(directory, "ledger.sqlite");
    try {
      const ledger = new Ledger(path);
      expect(ledger.merge(sample)).toMatchObject({ addedUsage: 1, addedPrompts: 1 });
      expect(ledger.merge(sample)).toMatchObject({ addedUsage: 0, addedPrompts: 0, duplicates: 2 });
      ledger.close();
      const reopened = new Ledger(path);
      try { expect(reopened.read().usage).toEqual(sample.usage); expect(reopened.read().prompts).toEqual(sample.prompts); }
      finally { reopened.close(); }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it("rolls back additions when an existing immutable record conflicts", () => {
    const ledger = new Ledger(":memory:");
    try {
      ledger.merge(sample);
      const bundle = structuredClone(sample);
      bundle.usage.unshift({ ...bundle.usage[0], id: "new" });
      bundle.usage[1].tokens.input++;
      expect(() => ledger.merge(bundle)).toThrow(ImportConflictError);
      expect(ledger.read().usage).toHaveLength(1);
    } finally { ledger.close(); }
  });
  it("allows a prompt-inclusive import after usage-only import", () => {
    const ledger = new Ledger(":memory:");
    try {
      ledger.merge({ ...sample, prompts: [] });
      expect(ledger.merge(sample)).toMatchObject({ addedUsage: 0, addedPrompts: 1 });
      expect(ledger.read(false).prompts).toEqual([]);
    } finally { ledger.close(); }
  });
});
