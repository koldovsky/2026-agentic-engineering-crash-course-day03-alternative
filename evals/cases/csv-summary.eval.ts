// CSV EMPTY-STATE EVAL CASES (FR-CSV-03)
//
// Grades the two empty-state sentences SummaryCsvControl renders when there
// is nothing to export: "no usage matches the current filters" vs. "this
// source has no usage yet". `produce()` renders the real component with
// `renderToStaticMarkup` (rows: [], filtered: true|false) so the eval grades
// the actual rendered output, not a hand-copied literal that can drift from
// the component's real copy. See evals/README.md for the case shape.
//
// TRACEABILITY: keep `trace:` on each case in sync with the `@trace` footer
// at the bottom of this file; check-traceability.mjs scans for the footer.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SummaryCsvControl } from "../../src/components/summary-csv-control";
import type { SummaryMetrics } from "../../src/lib/aggregate";

export type EvalCase = {
  /** Stable, unique id. Used in reports and the manifest. */
  id: string;
  /** Requirement ids this case proves. Mirror these in the @trace footer. */
  trace: string[];
  /** Score bucket. Cases sharing a dimension are averaged and ratcheted together. */
  dimension: string;
  /** Owning capability (informational; groups the report). */
  capability: string;
  /** One-line description of the situation being graded. */
  scenario: string;
  /** Produces the user-visible output the judge will grade. */
  produce: () => Promise<unknown>;
  /** The grading criteria; every CRITICAL criterion must pass. */
  rubric: string[];
};

function zeroTotals(): SummaryMetrics {
  return {
    events: 0,
    totalTokens: 0,
    tokens: { input: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, output: 0, reasoning: 0 },
    estimatedCostUsd: 0,
    pricedEvents: 0,
    unpricedEvents: 0,
    pricedTokens: 0,
    unpricedTokens: 0,
    pricingCoverage: null,
    sessions: 0,
    members: 0,
    machines: 0,
  };
}

/** Renders the control's empty-state markup and extracts the visible message, tags stripped. */
function emptyStateMessage(filtered: boolean): string {
  const html = renderToStaticMarkup(
    createElement(SummaryCsvControl, {
      rows: [],
      totals: zeroTotals(),
      source: "demo",
      filtered,
    }),
  );
  const match = html.match(/<span class="muted">([\s\S]*?)<\/span>/);
  if (!match) throw new Error(`No empty-state message found in rendered markup: ${html}`);
  return match[1].replace(/<[^>]*>/g, "").trim();
}

export const cases: EvalCase[] = [
  {
    id: "csv-empty-filtered",
    trace: ["FR-CSV-03"],
    dimension: "usability-clarity",
    capability: "dashboard",
    scenario:
      "The Usage by model card is showing with an active provider, member, model or date filter that matches no usage; Download CSV is disabled.",
    produce: async () => emptyStateMessage(true),
    rubric: [
      "CRITICAL: names the condition (no usage matches the current filters) and the remedy (clear or widen filters)",
      "the message is two sentences or fewer",
      "no jargon or internal names (no field names, status codes, or implementation terms)",
      "tells the user what to do next in plain, actionable language",
    ],
  },
  {
    id: "csv-empty-source",
    trace: ["FR-CSV-03"],
    dimension: "usability-clarity",
    capability: "dashboard",
    scenario:
      "The active source (e.g. local) has no imported usage at all and no filters are applied; Download CSV is disabled.",
    produce: async () => emptyStateMessage(false),
    rubric: [
      "CRITICAL: names the condition (no usage in this source) and the remedy (import usage), and does not tell the user to widen filters",
      "the message is two sentences or fewer",
      "no jargon or internal names (no field names, status codes, or implementation terms)",
      "tells the user what to do next in plain, actionable language",
    ],
  },
];

// @trace FR-CSV-03
