import type { Provider, Tokens, UsageEvent } from "./schema";

export const PRICE_SNAPSHOT_DATE = "2026-09-15";
export const PRICE_ESTIMATE_LABEL = "Estimated API-equivalent cost";
export const PRICE_DISCLAIMER =
  "USD estimates use the September 15, 2026 rate snapshot, not historical bills or subscription charges. Discounts, priority and long-context multipliers are excluded. Unknown model or rate combinations remain unpriced.";

export type PriceRate = {
  provider: Provider;
  model: string;
  /** USD per million tokens. Reasoning is already included in output. */
  rates: Omit<Tokens, "reasoning">;
  source: string;
  verifiedAt: string;
};

const claudeSource = "https://platform.claude.com/docs/en/about-claude/pricing";

function claudeRate(model: string, input: number, output: number): PriceRate {
  return {
    provider: "claude-code",
    model,
    rates: { input, output, cacheRead: input / 10, cacheWrite: input * 1.25, cacheWrite1h: input * 2 },
    source: claudeSource,
    verifiedAt: PRICE_SNAPSHOT_DATE,
  };
}

function codexRate(model: string, input: number, output: number): PriceRate {
  return {
    provider: "codex",
    model,
    // Codex cache writes have no rate in this snapshot. estimateCost rejects them.
    rates: { input, output, cacheRead: input / 10, cacheWrite: 0, cacheWrite1h: 0 },
    source: `https://developers.openai.com/api/docs/models/${model}`,
    verifiedAt: PRICE_SNAPSHOT_DATE,
  };
}

/** Exact IDs only: a new model never inherits a rate by substring matching. */
export const PRICE_RATES: readonly PriceRate[] = [
  claudeRate("claude-sonnet-4-6", 3, 15),
  claudeRate("claude-sonnet-4-5", 3, 15),
  claudeRate("claude-opus-4-6", 5, 25),
  claudeRate("claude-opus-4-5", 5, 25),
  claudeRate("claude-haiku-4-5", 1, 5),
  codexRate("gpt-5.3-codex", 1.75, 14),
  codexRate("gpt-5.4", 2.5, 15),
  codexRate("gpt-5.5", 5, 30),
];

export function getRate(provider: Provider, model: string): PriceRate | null {
  return PRICE_RATES.find((entry) => entry.provider === provider && entry.model === model) ?? null;
}

/** Returns null when any observed bucket is not covered by this rate snapshot. */
export function estimateCost(event: Pick<UsageEvent, "provider" | "model" | "tokens">): number | null {
  const rate = getRate(event.provider, event.model);
  if (!rate) return null;
  const { tokens } = event;
  if (event.provider === "codex" && (tokens.cacheWrite > 0 || tokens.cacheWrite1h > 0)) return null;
  const { rates } = rate;
  return (
    tokens.input * rates.input +
    tokens.cacheRead * rates.cacheRead +
    tokens.cacheWrite * rates.cacheWrite +
    tokens.cacheWrite1h * rates.cacheWrite1h +
    tokens.output * rates.output
  ) / 1_000_000;
}
