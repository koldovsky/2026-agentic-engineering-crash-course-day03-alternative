import { describe, expect, it } from "vitest";
import { summarize } from "./aggregate";
import { makeDemoBundle } from "./demo";
import { BundleSchema } from "./schema";

describe("isolated synthetic demo", () => {
  it("produces a deterministic, valid fourteen-day dataset for four members", () => {
    const demo = BundleSchema.parse(makeDemoBundle());
    expect(demo).toEqual(makeDemoBundle());
    expect(demo.usage).toHaveLength(84);
    expect(demo.prompts).toHaveLength(84);
    const summary = summarize(demo);
    expect(summary.totals.members).toBe(4);
    expect(summary.totals.machines).toBe(5);
    expect(summary.byDay).toHaveLength(14);
    expect(summary.byDay[0].date).toBe("2026-09-02");
    expect(summary.byDay.at(-1)?.date).toBe("2026-09-15");
    expect(summary.choices.providers).toEqual(["claude-code", "codex"]);
    expect(summary.totals.unpricedEvents).toBeGreaterThan(0);
  });

  it("returns fresh records so changing one demo cannot affect another", () => {
    const first = makeDemoBundle();
    const expectedPrompt = first.prompts[0].text;
    first.machines[0].member = "Changed";
    first.prompts[0].text = "Changed";
    first.usage[0].tokens.input = 0;
    const second = makeDemoBundle();
    expect(second.machines[0].member).toBe("Maya Chen");
    expect(second.prompts[0].text).toBe(expectedPrompt);
    expect(second.usage[0].tokens.input).toBeGreaterThan(0);
  });
});
