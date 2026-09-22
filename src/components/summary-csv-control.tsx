"use client";

// Red state (step-09-factory-red): the control's props are the contract from design.md; the
// component is not implemented yet, so rendering it fails the markup tests on purpose.
import type { SummaryMetrics, UsageSummary } from "@/lib/aggregate";
import type { SummaryCsvSource } from "@/lib/csv-summary";

export type SummaryCsvControlProps = {
  rows: UsageSummary["byModel"];
  totals: SummaryMetrics;
  source: SummaryCsvSource;
  filtered: boolean;
};

export function SummaryCsvControl(_props: SummaryCsvControlProps): never {
  throw new Error("not implemented");
}
