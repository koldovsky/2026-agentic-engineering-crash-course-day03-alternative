// CSV EMPTY-STATE EVAL CASES (FR-CSV-03)
//
// Grades the two empty-state sentences SummaryCsvControl renders when there
// is nothing to export: "no usage matches the current filters" vs. "this
// source has no usage yet". Both are static, pure copy -- there is nothing
// to drive in a running app -- so `produce()` inlines the exact rendered
// sentence, the same non-interactive shape the sample cases use (see
// evals/cases/sample.eval.ts and evals/README.md).
//
// TRACEABILITY: keep `trace:` on each case in sync with the `@trace` footer
// at the bottom of this file; check-traceability.mjs scans for the footer.

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

export const cases: EvalCase[] = [
  {
    id: "csv-empty-filtered",
    trace: ["FR-CSV-03"],
    dimension: "usability-clarity",
    capability: "dashboard",
    scenario:
      "The Usage by model card is showing with an active provider, member, model or date filter that matches no usage; Download CSV is disabled.",
    produce: async () =>
      "Nothing to export: no usage matches the current filters. Clear the filters, or widen the provider, member, model or date range, to include usage in the CSV.",
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
    produce: async () =>
      "Nothing to export: this source has no usage yet. Import usage in Data sources to get a model breakdown.",
    rubric: [
      "CRITICAL: names the condition (no usage in this source) and the remedy (import usage), and does not tell the user to widen filters",
      "the message is two sentences or fewer",
      "no jargon or internal names (no field names, status codes, or implementation terms)",
      "tells the user what to do next in plain, actionable language",
    ],
  },
];

// @trace FR-CSV-03
