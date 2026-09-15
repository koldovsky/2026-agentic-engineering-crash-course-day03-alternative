"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import type { Machine, Provider } from "@/lib/schema";
import type { importData } from "@/lib/transfer";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
type Source = "local" | "demo";
type ImportReply = ReturnType<typeof importData>;
type Preview = Extract<ImportReply, { preview: true }>;
type ImportRequest =
  | { kind: "bundle"; bundle: unknown }
  | {
      kind: "transcript";
      text: string;
      provider: Provider;
      machine: Machine;
      includePrompts: boolean;
    };

async function responseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    )
      return new Error(body.error);
  } catch {
    /* A non-JSON response still gets a useful retry message. */
  }
  return new Error(fallback);
}

async function postImport(
  request: ImportRequest,
  preview: boolean,
): Promise<ImportReply> {
  const body = JSON.stringify({ ...request, preview });
  if (new Blob([body]).size > MAX_UPLOAD_BYTES)
    throw new Error(
      "The encoded request exceeds 20 MiB. Choose a smaller file.",
    );
  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!response.ok)
    throw await responseError(
      response,
      "The import could not be processed. Please try again.",
    );
  return response.json() as Promise<ImportReply>;
}

export function ImportPanel({ source }: { source: Source }) {
  const router = useRouter();
  const fieldId = useId();
  const [kind, setKind] = useState<"bundle" | "transcript">("bundle");
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<Provider>("claude-code");
  const [machine, setMachine] = useState<Machine>({
    id: "",
    label: "",
    member: "",
  });
  const [includePrompts, setIncludePrompts] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reviewedRequest = useRef<ImportRequest | null>(null);

  function clearPreview() {
    reviewedRequest.current = null;
    setPreview(null);
    setError(null);
    setStatus(null);
  }

  function changeMachine(key: keyof Machine, value: string) {
    clearPreview();
    setMachine((current) => ({ ...current, [key]: value }));
  }

  function previewFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPreview();
    if (!file) {
      setError("Choose a usage file first.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Choose a file no larger than 20 MiB.");
      return;
    }
    startTransition(async () => {
      try {
        let text: string;
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(
            await file.arrayBuffer(),
          );
        } catch {
          throw new Error(
            "This file contains invalid UTF-8. Export a valid UTF-8 file and try again.",
          );
        }
        let request: ImportRequest;
        if (kind === "bundle") {
          let bundle: unknown;
          try {
            bundle = JSON.parse(text.replace(/^\uFEFF/, ""));
          } catch {
            throw new Error(
              "This file is not valid JSON. For a Claude Code or Codex JSONL file, select Transcript as the file format.",
            );
          }
          request = { kind: "bundle", bundle };
        } else {
          request = {
            kind: "transcript",
            text,
            provider,
            machine,
            includePrompts,
          };
        }
        const result = await postImport(request, true);
        if (!result.preview)
          throw new Error("A preview could not be created. Please try again.");
        reviewedRequest.current = request;
        setPreview(result);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The selected file could not be read. Please try again.",
        );
      }
    });
  }

  function importFile() {
    const request = reviewedRequest.current;
    if (!request || !preview || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await postImport(request, false);
        if (result.preview)
          throw new Error(
            "The file was not imported. Preview it and try again.",
          );
        setStatus(
          `Imported ${result.addedUsage.toLocaleString()} usage records and ${result.addedPrompts.toLocaleString()} prompts. ${result.duplicates.toLocaleString()} duplicates skipped.`,
        );
        reviewedRequest.current = null;
        setPreview(null);
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The import failed. Please try again.",
        );
      }
    });
  }

  return (
    <section className="card" aria-labelledby={`${fieldId}-title`}>
      <div className="card-head">
        <div>
          <h2 id={`${fieldId}-title`}>Import usage</h2>
          <p className="muted">
            Combine team exports or collect a completed local transcript.
          </p>
        </div>
      </div>
      <div className="card-body">
        {source === "demo" ? (
          <p className="notice">
            Imports are saved to your local data.{" "}
            <Link href="/?source=local&view=sources">View local sources</Link>
          </p>
        ) : null}
        <form
          className="transfer-form"
          onSubmit={previewFile}
          aria-busy={pending}
        >
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor={`${fieldId}-format`}>
                File format
              </label>
              <select
                id={`${fieldId}-format`}
                value={kind}
                disabled={pending}
                onChange={(event) => {
                  clearPreview();
                  setKind(event.target.value as typeof kind);
                }}
              >
                <option value="bundle">Team export (.json)</option>
                <option value="transcript">Transcript (.jsonl)</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor={`${fieldId}-file`}>
                Usage file
              </label>
              <input
                className="file-picker"
                id={`${fieldId}-file`}
                type="file"
                accept=".json,.jsonl,application/json"
                required
                disabled={pending}
                aria-describedby={`${fieldId}-file-help`}
                onChange={(event) => {
                  clearPreview();
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected && selected.size > MAX_UPLOAD_BYTES)
                    setError("Choose a file no larger than 20 MiB.");
                }}
              />
              <span className="muted" id={`${fieldId}-file-help`}>
                Up to 20 MiB. Files are processed on this machine.
              </span>
            </div>
          </div>
          {kind === "transcript" ? (
            <>
              <div className="form-grid">
                <div className="field">
                  <label
                    className="field-label"
                    htmlFor={`${fieldId}-provider`}
                  >
                    Provider
                  </label>
                  <select
                    id={`${fieldId}-provider`}
                    value={provider}
                    disabled={pending}
                    onChange={(event) => {
                      clearPreview();
                      setProvider(event.target.value as Provider);
                    }}
                  >
                    <option value="claude-code">Claude Code</option>
                    <option value="codex">Codex</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor={`${fieldId}-member`}>
                    Member name
                  </label>
                  <input
                    id={`${fieldId}-member`}
                    value={machine.member}
                    required
                    maxLength={100}
                    placeholder="Alex"
                    disabled={pending}
                    onChange={(event) =>
                      changeMachine("member", event.target.value)
                    }
                  />
                </div>
                <div className="field">
                  <label
                    className="field-label"
                    htmlFor={`${fieldId}-machine-id`}
                  >
                    Machine ID
                  </label>
                  <input
                    id={`${fieldId}-machine-id`}
                    value={machine.id}
                    required
                    maxLength={192}
                    placeholder="alex-laptop"
                    disabled={pending}
                    aria-describedby={`${fieldId}-identity-help`}
                    onChange={(event) =>
                      changeMachine("id", event.target.value)
                    }
                  />
                </div>
                <div className="field">
                  <label
                    className="field-label"
                    htmlFor={`${fieldId}-machine-label`}
                  >
                    Machine label
                  </label>
                  <input
                    id={`${fieldId}-machine-label`}
                    value={machine.label}
                    required
                    maxLength={100}
                    placeholder="Alex’s laptop"
                    disabled={pending}
                    onChange={(event) =>
                      changeMachine("label", event.target.value)
                    }
                  />
                </div>
              </div>
              <p className="muted" id={`${fieldId}-identity-help`}>
                Keep the same machine ID, label and member name for repeat
                imports.
              </p>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={includePrompts}
                  disabled={pending}
                  onChange={(event) => {
                    clearPreview();
                    setIncludePrompts(event.target.checked);
                  }}
                />
                Collect human prompts
              </label>
            </>
          ) : (
            <p className="muted">
              Team exports include their machine and member labels. Any prompts
              included in the file will also be imported.
            </p>
          )}
          <div className="inline-row">
            <button
              className="button button-secondary"
              type="submit"
              disabled={pending || !file || file.size > MAX_UPLOAD_BYTES}
            >
              {pending && !preview ? "Reading file…" : "Preview file"}
            </button>
          </div>
          {preview ? (
            <div className="notice" aria-live="polite">
              <h3>Import preview</h3>
              <div className="preview-counts">
                <span>
                  <strong>{preview.usageCount.toLocaleString()}</strong> usage
                  records
                </span>
                <span>
                  <strong>{preview.promptCount.toLocaleString()}</strong>{" "}
                  prompts
                </span>
                <span>
                  <strong>{preview.machines.length.toLocaleString()}</strong>{" "}
                  machines
                </span>
              </div>
              <p className="muted">
                {preview.machines
                  .map((item) => `${item.label} · ${item.member}`)
                  .join("; ")}
              </p>
              {preview.diagnostics.length ? (
                <details>
                  <summary>
                    Review diagnostics ({preview.diagnostics.length})
                  </summary>
                  <ul>
                    {preview.diagnostics.map((diagnostic, index) => (
                      <li
                        key={`${diagnostic.code}-${diagnostic.line ?? 0}-${index}`}
                      >
                        {diagnostic.line ? `Line ${diagnostic.line}: ` : ""}
                        {diagnostic.message}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <p>
                Save these records to local data. Existing identical records are
                skipped.
              </p>
              <button
                className="button button-primary"
                type="button"
                disabled={pending}
                onClick={importFile}
              >
                {pending ? "Importing…" : "Import data"}
              </button>
            </div>
          ) : null}
          {error ? (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          ) : null}
          {status ? (
            <p className="notice notice-success" role="status">
              {status}{" "}
              {source === "demo" ? (
                <Link href="/?source=local&view=sources">Open local data</Link>
              ) : null}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

export function ExportControl({ source }: { source: Source }) {
  const [includePrompts, setIncludePrompts] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function download() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, includePrompts }),
        });
        if (!response.ok)
          throw await responseError(
            response,
            "The export could not be created. Please try again.",
          );
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `token-atlas-${source}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus(
          includePrompts
            ? "Usage and prompts exported."
            : "Usage exported. Prompts were excluded.",
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The export failed. Please try again.",
        );
      }
    });
  }

  return (
    <details
      className="export-control"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          setIncludePrompts(false);
          setError(null);
          setStatus(null);
        }
      }}
    >
      <summary className="button button-secondary">Export data</summary>
      <div className="card card-body transfer-form">
        <p>
          <strong>Export {source === "demo" ? "demo" : "local"} data</strong>
        </p>
        <p className="muted">
          Download all records from this source for manual team sharing. Current
          view filters do not limit the export.
        </p>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={includePrompts}
            disabled={pending}
            onChange={(event) => setIncludePrompts(event.target.checked)}
          />
          Include prompts in export
        </label>
        <p className="muted">
          Off by default. Turning this on includes original human prompt text.
        </p>
        <button
          className="button button-primary"
          type="button"
          disabled={pending}
          onClick={download}
        >
          {pending ? "Exporting…" : "Download JSON"}
        </button>
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="notice notice-success" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </details>
  );
}
