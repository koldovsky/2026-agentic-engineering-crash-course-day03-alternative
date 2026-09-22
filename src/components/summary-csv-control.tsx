"use client";

// One-click, filter-faithful CSV download of the visible model rows (design.md).
// Only `rows` (byModel) and `totals` cross the server-client boundary: no session,
// machine or member identifiers reach this component (BC-PRIVACY-02).
import { useState } from "react";
import type { SummaryMetrics, UsageSummary } from "@/lib/aggregate";
import { summaryCsvFileName, toSummaryCsv, type SummaryCsvSource } from "@/lib/csv-summary";

export type SummaryCsvControlProps = {
  rows: UsageSummary["byModel"];
  totals: SummaryMetrics;
  source: SummaryCsvSource;
  filtered: boolean;
};

const FILTERED_EMPTY_MESSAGE =
  "Nothing to export: no usage matches the current filters. Clear the filters, or widen the provider, member, model or date range, to include usage in the CSV.";
const UNFILTERED_EMPTY_MESSAGE =
  "Nothing to export: this source has no usage yet. Import usage in Data sources to get a model breakdown.";
const FAILURE_MESSAGE =
  "The CSV could not be created in this browser. Try again or use Export data for JSON.";

export function SummaryCsvControl({ rows, totals, source, filtered }: SummaryCsvControlProps) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const disabled = rows.length === 0;

  function download() {
    setError(null);
    setStatus(null);
    try {
      const csv = toSummaryCsv({ byModel: rows, totals });
      const fileName = summaryCsvFileName(source, new Date());
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(`${fileName} downloaded.`);
    } catch {
      setError(FAILURE_MESSAGE);
    }
  }

  // No own wrapping element: the caller places the button (and, mutually
  // exclusively, one of the messages below) inside its own flex row, so the
  // control lands correctly whether that row is left-aligned (Usage by model
  // card heading) or centered (the empty-state action row).
  return (
    <>
      <button className="button button-secondary" type="button" disabled={disabled} onClick={download}>
        Download CSV
      </button>
      {disabled ? (
        <span className="muted">{filtered ? FILTERED_EMPTY_MESSAGE : UNFILTERED_EMPTY_MESSAGE}</span>
      ) : null}
      {error ? (
        <span className="notice notice-error" role="alert">
          {error}
        </span>
      ) : null}
      {status ? (
        <span className="notice notice-success" role="status">
          {status}
        </span>
      ) : null}
    </>
  );
}
