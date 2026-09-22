// @trace FR-CSV-03
//
// DEVIATION FROM HOUSE STYLE: neither existing component test
// (machine-import-panel.test.ts, ui.test.ts) renders JSX -- both test pure
// functions exported alongside the component. There is no house precedent
// for markup rendering. The spec scenarios here (FR-CSV-03) assert markup
// facts -- a `disabled` attribute, an exact visible sentence -- that only
// exist once the element tree is rendered, and design.md's only export for
// this file is the `SummaryCsvControl` component itself (no pure text-only
// helper is specified). Rendering is therefore necessary, not optional.
//
// vitest.config.mts restricts collection to "src/**/*.test.ts" (no jsdom
// environment, no .tsx), so this file uses `React.createElement` (a plain
// function call, no JSX) and `react-dom/server`'s `renderToStaticMarkup`,
// which needs no DOM and works under the "node" test environment. This
// renders the component's initial output correctly (hooks such as useState
// run fine in a single synchronous render pass); it does not simulate clicks
// or effects, which the spec scenarios covered here do not require.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SummaryCsvControl } from "./summary-csv-control";
import type { SummaryMetrics, UsageSummary } from "@/lib/aggregate";

const FILTERED_EMPTY_MESSAGE =
  "Nothing to export: no usage matches the current filters. Clear the filters, or widen the provider, member, model or date range, to include usage in the CSV.";
const UNFILTERED_EMPTY_MESSAGE =
  "Nothing to export: this source has no usage yet. Import usage in Data sources to get a model breakdown.";

function zeroTokens() {
  return { input: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, output: 0, reasoning: 0 };
}

function totals(totalTokens: number): SummaryMetrics {
  const priced = totalTokens > 0 ? 1 : 0;
  return {
    events: priced,
    totalTokens,
    tokens: zeroTokens(),
    estimatedCostUsd: 0,
    pricedEvents: priced,
    unpricedEvents: 0,
    pricedTokens: totalTokens,
    unpricedTokens: 0,
    pricingCoverage: totalTokens === 0 ? null : 1,
    sessions: priced,
    members: priced,
    machines: priced,
  };
}

function oneRow(): UsageSummary["byModel"] {
  return [
    {
      provider: "codex",
      model: "gpt-5.4",
      events: 1,
      totalTokens: 100,
      tokens: zeroTokens(),
      estimatedCostUsd: 1,
      pricedEvents: 1,
      unpricedEvents: 0,
      pricedTokens: 100,
      unpricedTokens: 0,
      pricingCoverage: 1,
      sessions: 1,
      members: 1,
      machines: 1,
    },
  ];
}

function renderControl(props: {
  rows: UsageSummary["byModel"];
  totals: SummaryMetrics;
  source: "local" | "demo";
  filtered: boolean;
}): string {
  return renderToStaticMarkup(createElement(SummaryCsvControl, props));
}

function firstButton(html: string): { attrsHtml: string; text: string } {
  const match = html.match(/<button([^>]*)>([\s\S]*?)<\/button>/);
  if (!match) throw new Error(`No <button> element found in rendered markup: ${html}`);
  return { attrsHtml: match[1], text: match[2].replace(/<[^>]*>/g, "").trim() };
}

describe("SummaryCsvControl", () => {
  it("disables the button and shows the filtered empty-state sentence when active filters match no usage", () => {
    const html = renderControl({ rows: [], totals: totals(0), source: "demo", filtered: true });
    const button = firstButton(html);
    expect(button.text).toBe("Download CSV");
    expect(button.attrsHtml).toContain('disabled=""');
    expect(html).toContain(FILTERED_EMPTY_MESSAGE);
    expect(html).not.toContain(UNFILTERED_EMPTY_MESSAGE);
  });

  it("disables the button and shows the unfiltered empty-state sentence when the source itself has no usage", () => {
    const html = renderControl({ rows: [], totals: totals(0), source: "local", filtered: false });
    const button = firstButton(html);
    expect(button.text).toBe("Download CSV");
    expect(button.attrsHtml).toContain('disabled=""');
    expect(html).toContain(UNFILTERED_EMPTY_MESSAGE);
    expect(html).not.toContain(FILTERED_EMPTY_MESSAGE);
  });

  it("enables the button with an accessible name and renders no empty-state sentence once at least one row exists", () => {
    const html = renderControl({ rows: oneRow(), totals: totals(100), source: "demo", filtered: false });
    const button = firstButton(html);
    expect(button.text).toBe("Download CSV");
    expect(button.attrsHtml).not.toMatch(/\bdisabled\b/);
    expect(html).not.toContain(FILTERED_EMPTY_MESSAGE);
    expect(html).not.toContain(UNFILTERED_EMPTY_MESSAGE);
  });
});
