// @trace FR-CSV-01, FR-CSV-02, BC-PRIVACY-02
import { describe, expect, it } from "vitest";
import { SUMMARY_CSV_HEADER, toSummaryCsv, summaryCsvFileName } from "./csv-summary";
import { summarize } from "./aggregate";
import type { SummaryMetrics, UsageSummary } from "./aggregate";
import type { Bundle, Provider, Tokens } from "./schema";

type ModelRow = UsageSummary["byModel"][number];

function zeroTokens(): Tokens {
  return { input: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, output: 0, reasoning: 0 };
}

/** Hand-built row: only model/totalTokens/estimatedCostUsd/events/pricedEvents drive the generator. */
function modelRow(spec: {
  model: string;
  totalTokens: number;
  estimatedCostUsd?: number;
  events?: number;
  pricedEvents?: number;
  provider?: Provider;
}): ModelRow {
  const events = spec.events ?? 1;
  const pricedEvents = spec.pricedEvents ?? events;
  const unpricedEvents = events - pricedEvents;
  return {
    provider: spec.provider ?? "codex",
    model: spec.model,
    events,
    totalTokens: spec.totalTokens,
    tokens: zeroTokens(),
    estimatedCostUsd: spec.estimatedCostUsd ?? 0,
    pricedEvents,
    unpricedEvents,
    pricedTokens: pricedEvents > 0 ? spec.totalTokens : 0,
    unpricedTokens: unpricedEvents > 0 ? spec.totalTokens : 0,
    pricingCoverage: spec.totalTokens === 0 ? null : pricedEvents === events ? 1 : pricedEvents === 0 ? 0 : 0.5,
    sessions: 1,
    members: 1,
    machines: 1,
  };
}

function totalsRow(totalTokens: number): SummaryMetrics {
  return {
    events: 1,
    totalTokens,
    tokens: zeroTokens(),
    estimatedCostUsd: 0,
    pricedEvents: 1,
    unpricedEvents: 0,
    pricedTokens: totalTokens,
    unpricedTokens: 0,
    pricingCoverage: totalTokens === 0 ? null : 1,
    sessions: 1,
    members: 1,
    machines: 1,
  };
}

describe("SUMMARY_CSV_HEADER", () => {
  it("is exactly the four documented columns, in order", () => {
    expect(SUMMARY_CSV_HEADER).toEqual(["model", "total_tokens", "estimated_cost_usd", "share_percent"]);
  });
});

describe("toSummaryCsv: header and row order", () => {
  // Deliberately NOT in summarize()'s tokens-descending order, so a generator
  // that re-sorts (instead of trusting byModel's given order) fails here.
  const zeta = modelRow({ model: "zeta-model", totalTokens: 100, estimatedCostUsd: 1 });
  const alpha = modelRow({ model: "alpha-model", totalTokens: 900, estimatedCostUsd: 9 });
  const mu = modelRow({ model: "mu-model", totalTokens: 500, estimatedCostUsd: 5 });
  const summary = { byModel: [zeta, alpha, mu], totals: totalsRow(1500) };

  it("writes the exact header line, one row per model, preserving byModel order verbatim", () => {
    const csv = toSummaryCsv(summary);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("model,total_tokens,estimated_cost_usd,share_percent");
    expect(lines.slice(1, 4)).toEqual([
      "zeta-model,100,1,6.67",
      "alpha-model,900,9,60.00",
      "mu-model,500,5,33.33",
    ]);
    // Exactly 3 data lines: header + 3 rows + the empty tail from the final CRLF.
    expect(lines).toHaveLength(5);
    expect(lines[4]).toBe("");
  });

  it("ends every row, including the header and the last row, with CRLF and no bare LF", () => {
    const csv = toSummaryCsv(summary);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.match(/(?<!\r)\n/)).toBeNull();
  });
});

describe("toSummaryCsv: plain numbers", () => {
  it("matches the spec example: 1,234,567 tokens, cost 0.1234567 -> 0.123457, half share, empty cost when fully unpriced (never 0)", () => {
    const priced = modelRow({
      model: "priced-model",
      totalTokens: 1234567,
      estimatedCostUsd: 0.1234567,
      events: 3,
      pricedEvents: 3,
    });
    const unpriced = modelRow({
      model: "unpriced-model",
      totalTokens: 1234567,
      events: 2,
      pricedEvents: 0,
    });
    const summary = { byModel: [priced, unpriced], totals: totalsRow(2469134) };
    const lines = toSummaryCsv(summary).split("\r\n");
    expect(lines[1]).toBe("priced-model,1234567,0.123457,50.00");
    expect(lines[2]).toBe("unpriced-model,1234567,,50.00");
  });

  it.each([
    [0.1234567, "0.123457"],
    [1.5, "1.5"],
    [2, "2"],
    // A naive trailing-zero strip (e.g. a bare /0+$/ regex) turns "10.000000"
    // into "1" instead of "10"; this case only passes a correct trim.
    [10, "10"],
  ])("formats a fully priced cost of %s as %s (trailing zeros and dangling dot trimmed, no locale formatting)", (cost, expected) => {
    const summary = {
      byModel: [modelRow({ model: "cost-model", totalTokens: 1000, estimatedCostUsd: cost })],
      totals: totalsRow(1000),
    };
    const lines = toSummaryCsv(summary).split("\r\n");
    expect(lines[1]).toBe(`cost-model,1000,${expected},100.00`);
  });

  it("carries the priced sum without a marker for a partially priced model, with no $, % or separators anywhere", () => {
    const summary = {
      byModel: [
        // fixture id must not contain "partial": the negative regex below guards against the UI's " partial" cost marker
        modelRow({ model: "mixed-model", totalTokens: 1000, estimatedCostUsd: 3.4, events: 10, pricedEvents: 6 }),
      ],
      totals: totalsRow(1000),
    };
    const csv = toSummaryCsv(summary);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe("mixed-model,1000,3.4,100.00");
    expect(csv).not.toMatch(/partial/i);
    expect(csv).not.toContain("$");
    expect(csv).not.toContain("%");
    // no thousands separators inside any field (commas between fields are the CSV separator itself)
    for (const field of lines[1].split(",")) expect(field).not.toMatch(/\d[,\s]\d{3}/);
  });
});

describe("toSummaryCsv: RFC 4180 escaping", () => {
  it("quotes fields containing a comma, a doubled double quote, an embedded LF or an embedded CR, and leaves plain fields unquoted", () => {
    const rows = [
      modelRow({ model: "a,b", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: 'say "hi"', totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "line\nbreak", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "carriage\rreturn", totalTokens: 100, estimatedCostUsd: 1 }),
    ];
    const summary = { byModel: rows, totals: totalsRow(400) };
    // Pinning the exact string in one shot proves quoting, CRLF row ends, and
    // that the LF/CR original to the field is preserved verbatim inside the
    // quotes (never turned into a bare LF that would sit outside a quoted field).
    const expected =
      `model,total_tokens,estimated_cost_usd,share_percent\r\n` +
      `"a,b",100,1,25.00\r\n` +
      `"say ""hi""",100,1,25.00\r\n` +
      `"line\nbreak",100,1,25.00\r\n` +
      `"carriage\rreturn",100,1,25.00\r\n`;
    expect(toSummaryCsv(summary)).toBe(expected);
  });
});

describe("toSummaryCsv: spreadsheet formula injection", () => {
  it("neutralises a model id starting with a formula-triggering character with a leading single quote, then quotes the field", () => {
    const rows = [
      modelRow({ model: "=SUM(A1)", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "+1+1", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "-1", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "@cmd", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "\tmodel", totalTokens: 100, estimatedCostUsd: 1 }),
      modelRow({ model: "\rmodel", totalTokens: 100, estimatedCostUsd: 1 }),
    ];
    const summary = { byModel: rows, totals: totalsRow(600) };
    const lines = toSummaryCsv(summary).split("\r\n");
    expect(lines[1]).toBe(`"'=SUM(A1)",100,1,16.67`);
    expect(lines[2]).toBe(`"'+1+1",100,1,16.67`);
    expect(lines[3]).toBe(`"'-1",100,1,16.67`);
    expect(lines[4]).toBe(`"'@cmd",100,1,16.67`);
    expect(lines[5]).toBe(`"'\tmodel",100,1,16.67`);
    expect(lines[6]).toBe(`"'\rmodel",100,1,16.67`);
  });

  it("leaves a plain model id starting with a hyphenated but non-formula character alone", () => {
    const summary = {
      byModel: [modelRow({ model: "gpt-5.4", totalTokens: 100, estimatedCostUsd: 1 })],
      totals: totalsRow(100),
    };
    const lines = toSummaryCsv(summary).split("\r\n");
    expect(lines[1]).toBe("gpt-5.4,100,1,100.00");
  });
});

describe("toSummaryCsv: determinism", () => {
  it("produces a byte-identical string for a structurally equal (JSON-cloned) summary", () => {
    const original = {
      byModel: [
        modelRow({ model: "zeta-model", totalTokens: 100, estimatedCostUsd: 1 }),
        modelRow({ model: "alpha-model", totalTokens: 900, estimatedCostUsd: 9 }),
      ],
      totals: totalsRow(1000),
    };
    const clone = JSON.parse(JSON.stringify(original)) as typeof original;
    expect(toSummaryCsv(clone)).toBe(toSummaryCsv(original));
  });
});

describe("summaryCsvFileName", () => {
  it("uses the UTC calendar date of the injected Date and the source name, regardless of a positive local offset rolling the date forward", () => {
    expect(summaryCsvFileName("demo", new Date("2026-09-22T23:30:00Z"))).toBe(
      "token-atlas-summary-demo-2026-09-22.csv",
    );
    expect(summaryCsvFileName("local", new Date("2026-09-22T23:30:00Z"))).toBe(
      "token-atlas-summary-local-2026-09-22.csv",
    );
  });

  it("still uses the UTC calendar date near midnight when a negative local offset would roll it backward", () => {
    expect(summaryCsvFileName("demo", new Date("2026-09-22T00:30:00Z"))).toBe(
      "token-atlas-summary-demo-2026-09-22.csv",
    );
  });
});

describe("privacy invariant (BC-PRIVACY-02)", () => {
  it("never leaks prompt text, session ids, machine ids/labels, member names or file paths into the CSV", () => {
    const bundle = {
      schemaVersion: 1,
      exportedAt: "2026-09-15T00:00:00.000Z",
      machines: [
        {
          id: "machine-must-not-leak",
          label: "LEAK-LABEL-must-not-leak",
          member: "member-must-not-leak",
          // Not part of the domain schema; carried along to prove even an
          // incidental extra field never reaches the export.
          importPath: "C:\\Users\\must-not-leak\\x",
        },
      ],
      usage: [
        {
          id: "u-privacy-1",
          machineId: "machine-must-not-leak",
          provider: "codex",
          sessionId: "session-must-not-leak",
          timestamp: "2026-09-14T12:00:00.000Z",
          model: "gpt-5.4",
          tokens: { input: 100, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, output: 50, reasoning: 10 },
        },
      ],
      prompts: [
        {
          id: "p-privacy-1",
          machineId: "machine-must-not-leak",
          provider: "codex",
          sessionId: "session-must-not-leak",
          timestamp: "2026-09-14T12:00:00.000Z",
          text: "SYNTHETIC_PROMPT_MUST_NOT_LEAK",
        },
      ],
    } as unknown as Bundle;

    const summary = summarize(bundle);
    // Guard against a vacuous pass: the negative assertions below mean nothing
    // if there are no rows to begin with.
    expect(summary.byModel.length).toBeGreaterThan(0);

    const csv = toSummaryCsv({ byModel: summary.byModel, totals: summary.totals });
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(SUMMARY_CSV_HEADER.join(","));
    expect(SUMMARY_CSV_HEADER).toHaveLength(4);
    expect(lines.length).toBeGreaterThanOrEqual(3); // header + >=1 row + trailing empty

    const secrets = [
      "SYNTHETIC_PROMPT_MUST_NOT_LEAK",
      "session-must-not-leak",
      "machine-must-not-leak",
      "LEAK-LABEL-must-not-leak",
      "member-must-not-leak",
      "C:\\Users\\must-not-leak\\x",
    ];
    for (const secret of secrets) expect(csv).not.toContain(secret);
  });
});
