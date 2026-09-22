"use client";

// One-click, filter-faithful CSV download of the visible model rows (design.md).
// Only `rows` (byModel) and `totals` cross the server-client boundary: no session,
// machine or member identifiers reach this component (BC-PRIVACY-02).
import { useState } from "react";
import type { SummaryMetrics } from "@/lib/aggregate";
import { summaryCsvFileName, toSummaryCsv, type SummaryCsvRow, type SummaryCsvSource } from "@/lib/csv-summary";
import { triggerCsvDownload } from "@/lib/csv-download";

export type SummaryCsvControlProps = {
  rows: SummaryCsvRow[];
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
      triggerCsvDownload(csv, fileName);
      setStatus(`Download started: ${fileName}`);
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
