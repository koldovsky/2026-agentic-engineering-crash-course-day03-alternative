import { describe, expect, it } from "vitest";
import { estimateCost, getRate, PRICE_RATES, PRICE_SNAPSHOT_DATE } from "./pricing";
import type { Tokens } from "./schema";

const zero: Tokens = { input: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, output: 0, reasoning: 0 };

describe("API-equivalent pricing", () => {
  it("prices one million fresh Sonnet tokens at three USD", () => {
    expect(estimateCost({ provider: "claude-code", model: "claude-sonnet-4-6", tokens: { ...zero, input: 1_000_000 } })).toBe(3);
  });

  it("prices each disjoint Claude bucket at its own rate without repricing reasoning", () => {
    const tokens = { input: 1_000_000, cacheRead: 1_000_000, cacheWrite: 1_000_000, cacheWrite1h: 1_000_000, output: 1_000_000, reasoning: 900_000 };
    expect(estimateCost({ provider: "claude-code", model: "claude-sonnet-4-6", tokens })).toBeCloseTo(28.05);
  });

  it("prices Codex cached input separately and reasoning only as output", () => {
    expect(estimateCost({
      provider: "codex", model: "gpt-5.3-codex",
      tokens: { ...zero, input: 1_000_000, cacheRead: 1_000_000, output: 1_000_000, reasoning: 1_000_000 },
    })).toBeCloseTo(15.925);
  });

  it.each([
    ["gpt-6-astra", 73.5],
    ["gpt-5.6-sol", 29.4],
    ["gpt-5.6-terra", 16.7],
    ["gpt-5.6-luna", 1.67],
  ])("prices the supported cache-write bucket for %s", (model, expected) => {
    expect(estimateCost({
      provider: "codex", model,
      tokens: { ...zero, input: 1_000_000, cacheRead: 1_000_000, cacheWrite: 1_000_000, output: 1_000_000, reasoning: 500_000 },
    })).toBeCloseTo(expected);
    expect(getRate("codex", model)?.cacheSource).toBe("https://developers.openai.com/api/docs/guides/prompt-caching");
    expect(estimateCost({ provider: "codex", model, tokens: { ...zero, cacheWrite1h: 1 } })).toBeNull();
  });

  it.each([
    ["claude-sonnet-5", 18.7],
    ["claude-opus-5", 46.75],
  ])("uses verified current standard prices for %s", (model, expected) => {
    expect(estimateCost({
      provider: "claude-code", model,
      tokens: { input: 1_000_000, cacheRead: 1_000_000, cacheWrite: 1_000_000, cacheWrite1h: 1_000_000, output: 1_000_000, reasoning: 0 },
    })).toBeCloseTo(expected);
  });

  it.each([
    ["claude-sonnet-4-5-20250929", "claude-sonnet-4-5"],
    ["claude-opus-4-5-20251101", "claude-opus-4-5"],
    ["claude-haiku-4-5-20251001", "claude-haiku-4-5"],
  ])("recognizes the documented dated ID %s", (model, alias) => {
    expect(getRate("claude-code", model)?.rates).toEqual(getRate("claude-code", alias)?.rates);
    expect(getRate("claude-code", `${model}-unknown`)).toBeNull();
  });

  it("does not guess unknown models, aliases, provider combinations, or cache-write prices", () => {
    expect(getRate("claude-code", "claude-sonnet-4-6-new")).toBeNull();
    expect(getRate("codex", "claude-sonnet-4-6")).toBeNull();
    expect(estimateCost({ provider: "codex", model: "unknown", tokens: zero })).toBeNull();
    for (const bucket of ["cacheWrite", "cacheWrite1h"] as const) {
      expect(estimateCost({ provider: "codex", model: "gpt-5.4", tokens: { ...zero, [bucket]: 1 } })).toBeNull();
    }
  });

  it("gives every supported rate an auditable source and verification date", () => {
    expect(PRICE_RATES).toHaveLength(17);
    for (const entry of PRICE_RATES) {
      expect(entry.verifiedAt).toBe(PRICE_SNAPSHOT_DATE);
      expect(new URL(entry.source).protocol).toBe("https:");
      expect(entry.rates.input).toBeGreaterThan(0);
      expect(entry.rates.output).toBeGreaterThan(0);
    }
  });
});
