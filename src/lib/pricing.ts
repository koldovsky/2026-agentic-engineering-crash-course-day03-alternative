import type { Provider, Tokens, UsageEvent } from "./schema";

export const PRICE_SNAPSHOT_DATE = "2026-09-15";
export const PRICE_ESTIMATE_LABEL = "Estimated API-equivalent cost";
export const PRICE_DISCLAIMER =
  "USD estimates use the September 15, 2026 rate snapshot, not historical bills or subscription charges. Discounts, priority and long-context multipliers are excluded. Unknown model or rate combinations remain unpriced.";

export type PriceRate = {
  provider: Provider;
  model: string;
  /** USD per million tokens. Reasoning is already included in output. */
  rates: Pick<Tokens, "input" | "cacheRead" | "output"> & {
    cacheWrite: number | null;
    cacheWrite1h: number | null;
  };
  source: string;
  /** Supplementary source when cache-write pricing is documented separately. */
  cacheSource?: string;
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

function codexRate(model: string, input: number, output: number, cacheWrite: number | null = null): PriceRate {
  return {
    provider: "codex",
    model,
    // GPT-5.6+ writes use the documented 30-minute cache, not Claude's 1-hour bucket.
    rates: { input, output, cacheRead: input / 10, cacheWrite, cacheWrite1h: null },
    source: `https://developers.openai.com/api/docs/models/${model}`,
    ...(cacheWrite !== null ? { cacheSource: "https://developers.openai.com/api/docs/guides/prompt-caching" } : {}),
    verifiedAt: PRICE_SNAPSHOT_DATE,
  };
}

/** Exact IDs only: a new model never inherits a rate by substring matching. */
export const PRICE_RATES: readonly PriceRate[] = [
  claudeRate("claude-sonnet-5", 2, 10),
  claudeRate("claude-sonnet-4-6", 3, 15),
  claudeRate("claude-sonnet-4-5", 3, 15),
  claudeRate("claude-sonnet-4-5-20250929", 3, 15),
  claudeRate("claude-opus-5", 5, 25),
  claudeRate("claude-opus-4-6", 5, 25),
  claudeRate("claude-opus-4-5", 5, 25),
  claudeRate("claude-opus-4-5-20251101", 5, 25),
  claudeRate("claude-haiku-4-5", 1, 5),
  claudeRate("claude-haiku-4-5-20251001", 1, 5),
  codexRate("gpt-6-astra", 10, 50, 12.5),
  codexRate("gpt-5.6-sol", 4, 20, 5),
  codexRate("gpt-5.6-terra", 2, 12, 2.5),
  codexRate("gpt-5.6-luna", 0.2, 1.2, 0.25),
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
  const { rates } = rate;
  if ((rates.cacheWrite === null && tokens.cacheWrite > 0) ||
      (rates.cacheWrite1h === null && tokens.cacheWrite1h > 0)) return null;
  return (
    tokens.input * rates.input +
    tokens.cacheRead * rates.cacheRead +
    tokens.cacheWrite * (rates.cacheWrite ?? 0) +
    tokens.cacheWrite1h * (rates.cacheWrite1h ?? 0) +
    tokens.output * rates.output
  ) / 1_000_000;
}
