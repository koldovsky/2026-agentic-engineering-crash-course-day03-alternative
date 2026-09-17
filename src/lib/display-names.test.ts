import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { summarize } from "./aggregate";
import { displayMachine, withDisplayNames } from "./display-names";
import { getBundle, getDisplayBundle, parseQuery, queryMachines, queryPrompts } from "./queries";
import { Ledger } from "./storage";
import { sample } from "./test-fixtures";

describe("local display names", () => {
  it("falls back only for exact legacy sandbox accounts and respects explicit overrides", () => {
    for (const member of ["CodexSandboxOffline", "CodexSandboxOnline"]) {
      const machine = { ...sample.machines[0], member };
      expect(displayMachine(machine).member).toBe("Local user");
      expect(displayMachine(machine, { member, label: "Chosen computer" })).toMatchObject({ member, label: "Chosen computer" });
      expect(machine.member).toBe(member);
    }
    for (const member of ["Codex teammate", "codexsandboxoffline", "CodexSandboxOffline user"]) {
      expect(displayMachine({ ...sample.machines[0], member }).member).toBe(member);
    }
  });

  it("persists aliases across reopening without changing records, exports or repeat imports", () => {
    const directory = mkdtempSync(join(tmpdir(), "token-atlas-display-"));
    const path = join(directory, "test.sqlite");
    vi.stubEnv("TOKEN_ATLAS_DB", path);
    const imported = structuredClone(sample);
    imported.machines[0].member = "CodexSandboxOffline";
    imported.usage.push({ ...imported.usage[0], id: "claude-event", provider: "claude-code", model: "claude-sonnet-4-6" });
    let ledger = new Ledger(path);
    try {
      ledger.merge(imported);
      const before = ledger.read();
      expect(ledger.setDisplayNames("m1", { member: " Codex teammate ", label: " Personal laptop " })).toBe(true);
      ledger.close();
      ledger = new Ledger(path);
      expect(ledger.readDisplayNames().get("m1")).toEqual({ member: "Codex teammate", label: "Personal laptop" });
      expect(ledger.read()).toMatchObject({ machines: before.machines, usage: before.usage, prompts: before.prompts });
      expect(ledger.merge(imported)).toEqual({ addedMachines: 0, addedUsage: 0, addedPrompts: 0, duplicates: 3 });

      const display = getDisplayBundle("local", true);
      const query = parseQuery(new URLSearchParams("member=Codex+teammate"));
      const summary = summarize(display, query.filters);
      expect(summary.totals.events).toBe(2);
      expect(summary.totals.totalTokens).toBe(summarize(before).totals.totalTokens);
      expect(summary.choices.members).toEqual(["Codex teammate"]);
      expect(summary.byProvider.map((item) => item.provider).sort()).toEqual(["claude-code", "codex"]);
      expect(queryPrompts(display, query).items[0]).toMatchObject({ member: "Codex teammate", machineLabel: "Personal laptop" });
      expect(queryMachines(display)[0]).toMatchObject({
        member: "Codex teammate", label: "Personal laptop", importedMember: "CodexSandboxOffline",
        importedLabel: "Laptop", hasDisplayOverride: true,
      });
      expect(getBundle("local", true)).toMatchObject({ machines: imported.machines, usage: before.usage, prompts: before.prompts });
      expect(getDisplayBundle("local").prompts).toEqual([]);
      expect(ledger.resetDisplayNames("m1")).toBe(true);
      expect(getDisplayBundle("local").machines[0]).toMatchObject({ member: "Local user", label: "Laptop" });
      expect(queryMachines(getDisplayBundle("local"))[0].hasDisplayOverride).toBe(false);
      expect(ledger.resetDisplayNames("m1")).toBe(true);
    } finally {
      ledger.close();
      vi.unstubAllEnvs();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects invalid aliases and absent machines without changing saved preferences", () => {
    const ledger = new Ledger(":memory:");
    try {
      ledger.merge(sample);
      expect(ledger.setDisplayNames("absent", { member: "A", label: "B" })).toBe(false);
      expect(ledger.resetDisplayNames("absent")).toBe(false);
      expect(() => ledger.setDisplayNames("m1", { member: "\n", label: "B" })).toThrow();
      expect(ledger.readDisplayNames().size).toBe(0);
    } finally { ledger.close(); }
  });

  it("keeps supplied bundles intact and demo names independent from local preferences", () => {
    const original = structuredClone(sample);
    const display = withDisplayNames(original, new Map([["m1", { member: "Other", label: "Other" }]]));
    expect(display.machines[0].member).toBe("Other");
    expect(original).toEqual(sample);
    expect(queryMachines(original)[0]).toMatchObject({ importedMember: "Alex", importedLabel: "Laptop", hasDisplayOverride: false });
    expect(getDisplayBundle("demo").machines).toEqual(getBundle("demo").machines);
    expect(getDisplayBundle("demo").prompts).toEqual([]);
  });
});
