import { describe, it, expect } from "vitest";
import { importData, exportData } from "./transfer";
import { Ledger } from "./storage";
import { sample } from "./test-fixtures";
import { BundleSchema, emptyBundle } from "./schema";

describe("portable team exchange", () => {
  it("allows an empty portable export to round-trip as a no-op", () => {
    const ledger = new Ledger(":memory:");
    try {
      const bundle = JSON.parse(exportData(emptyBundle()));
      expect(importData({ kind: "bundle", bundle, preview: true }, ledger)).toMatchObject({ usageCount: 0, promptCount: 0 });
      expect(importData({ kind: "bundle", bundle }, ledger)).toMatchObject({ addedUsage: 0, addedPrompts: 0 });
    } finally { ledger.close(); }
  });
  it("previews without writes and imports two machines without duplicates", () => {
    const ledger = new Ledger(":memory:");
    try {
      expect(importData({ kind: "bundle", bundle: sample, preview: true }, ledger)).toMatchObject({ usageCount: 1, promptCount: 1 });
      expect(ledger.read().usage).toHaveLength(0);
      importData({ kind: "bundle", bundle: sample }, ledger);
      const second = structuredClone(sample); second.machines[0].id = "m2"; second.machines[0].member = "Maya";
      second.usage[0].machineId = "m2"; second.prompts[0].machineId = "m2";
      importData({ kind: "bundle", bundle: second }, ledger);
      expect(importData({ kind: "bundle", bundle: sample }, ledger)).toMatchObject({ addedUsage: 0, duplicates: 2 });
      expect(ledger.read().usage).toHaveLength(2);
    } finally { ledger.close(); }
  });
  it("excludes prompts by default and allows an explicit round trip", () => {
    expect(exportData(sample)).not.toContain(sample.prompts[0].text);
    expect(JSON.parse(exportData(sample)).prompts).toEqual([]);
    const parsed = BundleSchema.parse(JSON.parse(exportData(sample, true)));
    expect(parsed.prompts).toEqual(sample.prompts);
  });
  it("rejects unsupported fields/version without changing existing data", () => {
    const ledger = new Ledger(":memory:");
    try {
      ledger.merge(sample);
      for (const invalid of [{ ...sample, schemaVersion: 99 }, { ...sample, outputs: ["secret"] }]) {
        expect(() => importData({ kind: "bundle", bundle: invalid }, ledger)).toThrow();
      }
      expect(ledger.read().usage).toEqual(sample.usage);
    } finally { ledger.close(); }
  });
  it("refuses oversize prompt exports instead of producing an unimportable file", () => {
    const bundle = { ...sample, prompts: Array.from({ length: 211 }, (_, index) => ({ ...sample.prompts[0], id: `p-${index}`, text: "x".repeat(100_000) })) };
    expect(() => exportData(bundle, true)).toThrow("Export exceeds 20 MiB");
    expect(() => exportData(bundle)).not.toThrow();
  });
});
