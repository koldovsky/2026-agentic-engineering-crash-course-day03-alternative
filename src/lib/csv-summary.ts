// Red state (step-09-factory-red): the contract from openspec/changes/11-usage-csv-summary/design.md
// exists so the test suite compiles, but nothing is implemented yet — every call throws.
import type { SummaryMetrics, UsageSummary } from "./aggregate";

export type SummaryCsvInput = Pick<UsageSummary, "byModel" | "totals">;
export type SummaryCsvOptions = { costDecimals?: number; shareDecimals?: number };
export type SummaryCsvSource = "local" | "demo";

export const SUMMARY_CSV_HEADER = ["model", "total_tokens", "estimated_cost_usd", "share_percent"] as const;

export function toSummaryCsv(_summary: SummaryCsvInput, _options?: SummaryCsvOptions): string {
  throw new Error("not implemented");
}

export function summaryCsvFileName(_source: SummaryCsvSource, _date: Date): string {
  throw new Error("not implemented");
}

export type { SummaryMetrics };
