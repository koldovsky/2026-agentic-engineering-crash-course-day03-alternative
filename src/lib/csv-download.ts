// Browser side-effects of a CSV download (Blob, object URL, detached anchor,
// revoke timer), extracted out of the component so they can be exercised with
// a fake `env` in a unit test: this function is pure with respect to the
// injected environment and does not itself catch anything (the caller wraps
// it in try/catch to surface the "Download failure surfaces inline" scenario).
export type CsvDownloadEnv = {
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
  document: Document;
  setTimeout: typeof setTimeout;
};

export function triggerCsvDownload(
  csv: string,
  fileName: string,
  env: CsvDownloadEnv = {
    createObjectURL: URL.createObjectURL,
    revokeObjectURL: URL.revokeObjectURL,
    document,
    // Wrapped, not passed bare: unlike the static URL methods above, a
    // detached `setTimeout` reference called as `env.setTimeout(...)` risks
    // an "Illegal invocation" this-check in some engines.
    setTimeout: ((handler: () => void, timeout?: number) => setTimeout(handler, timeout)) as typeof setTimeout,
  },
): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = env.createObjectURL(blob);
  const link = env.document.createElement("a");
  link.href = url;
  link.download = fileName;
  env.document.body.appendChild(link);
  link.click();
  link.remove();
  env.setTimeout(() => env.revokeObjectURL(url), 1000);
}
