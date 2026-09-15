import { describe, expect, it } from "vitest";
import { BundleSchema, tokenTotal, type Bundle } from "./schema";

import { sample } from "./test-fixtures";
describe("normalized contract", () => {
  it("counts disjoint tokens without adding reasoning twice", () => {
    expect(tokenTotal(BundleSchema.parse(sample).usage[0].tokens)).toBe(175);
  });
  it.each([-1, 1.5, Infinity, NaN])("rejects invalid token value %s", (value) => {
    const bundle = structuredClone(sample); bundle.usage[0].tokens.input = value;
    expect(BundleSchema.safeParse(bundle).success).toBe(false);
  });
  it("rejects undeclared machines, invalid dates, extra fields, and invalid reasoning", () => {
    for (const mutation of [
      (b: Bundle) => { b.usage[0].machineId = "missing"; },
      (b: Bundle) => { b.usage[0].timestamp = "2026-02-30T00:00:00Z"; },
      (b: Bundle) => { Object.assign(b.usage[0], { modelOutput: "must never store" }); },
      (b: Bundle) => { b.usage[0].tokens.reasoning = 21; },
    ]) { const bundle = structuredClone(sample); mutation(bundle); expect(BundleSchema.safeParse(bundle).success).toBe(false); }
  });
});
