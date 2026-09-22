// Pure CSV generator for the visible model breakdown (design.md, FR-CSV-01/02).
// No I/O, no Intl, no Date.now(), no storage imports: only the passed-in summary
// (and, for the file name, an injected Date) may influence the output.
import type { UsageSummary } from "./aggregate";
import type { Source } from "./schema";

/** Only the five fields the generator reads; keeps the RSC payload to the control minimal. */
export type SummaryCsvRow = Pick<
  UsageSummary["byModel"][number],
  "model" | "totalTokens" | "estimatedCostUsd" | "events" | "pricedEvents"
>;
export type SummaryCsvInput = { byModel: SummaryCsvRow[]; totals: UsageSummary["totals"] };
export type SummaryCsvOptions = { costDecimals?: number; shareDecimals?: number };
export type SummaryCsvSource = Source;

export const SUMMARY_CSV_HEADER = ["model", "total_tokens", "estimated_cost_usd", "share_percent"] as const;

const DEFAULT_COST_DECIMALS = 6;
const DEFAULT_SHARE_DECIMALS = 2;

/**
 * OWASP CSV-injection guidance: a field whose first character is `=`, `+`,
 * `-`, `@`, TAB or CR could be read as a formula by a spreadsheet app. Such a
 * field is neutralised with a leading single quote and force-quoted per RFC
 * 4180 regardless of its other characters.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/** RFC 4180: quote a field that contains a comma, double quote, CR or LF; double inner quotes. */
function escapeField(value: string): string {
  if (FORMULA_TRIGGER.test(value)) return `"'${value.replace(/"/g, '""')}"`;
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Trim trailing fractional zeros, then a now-dangling decimal point. Never touches the integer part. */
function trimTrailingZeros(fixed: string): string {
  if (!fixed.includes(".")) return fixed;
  return fixed.replace(/0+$/, "").replace(/\.$/, "");
}

function formatCost(row: SummaryCsvInput["byModel"][number], decimals: number): string {
  // Fully unpriced (events observed, none priced): an empty field, never "0".
  if (row.events > 0 && row.pricedEvents === 0) return "";
  return trimTrailingZeros(row.estimatedCostUsd.toFixed(decimals));
}

function formatShare(totalTokens: number, grandTotalTokens: number, decimals: number): string {
  const share = (totalTokens / Math.max(grandTotalTokens, 1)) * 100;
  return share.toFixed(decimals);
}

export function toSummaryCsv(summary: SummaryCsvInput, options: SummaryCsvOptions = {}): string {
  const costDecimals = options.costDecimals ?? DEFAULT_COST_DECIMALS;
  const shareDecimals = options.shareDecimals ?? DEFAULT_SHARE_DECIMALS;
  const lines = [SUMMARY_CSV_HEADER.join(",")];
  // byModel's given order is preserved verbatim; this generator never re-sorts.
  for (const row of summary.byModel) {
    lines.push(
      [
        escapeField(row.model),
        String(row.totalTokens),
        formatCost(row, costDecimals),
        formatShare(row.totalTokens, summary.totals.totalTokens, shareDecimals),
      ].join(","),
    );
  }
  return lines.map((line) => `${line}\r\n`).join("");
}

export function summaryCsvFileName(source: SummaryCsvSource, date: Date): string {
  // toISOString() is always UTC regardless of the host's local offset.
  const utcDate = date.toISOString().slice(0, 10);
  return `token-atlas-summary-${source}-${utcDate}.csv`;
}
