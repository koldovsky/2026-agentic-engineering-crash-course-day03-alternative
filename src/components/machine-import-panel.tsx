"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { Machine, Provider } from "@/lib/schema";
import type {
  MachineImportDefaults,
  MachineImportRequest,
  MachineImportResult,
  MachineImportRoot,
} from "@/lib/machine-import-contract";

const SETTINGS_KEY = "token-atlas:machine-import:v1";
const PROVIDER_NAMES: Record<Provider, string> = {
  "claude-code": "Claude Code",
  codex: "Codex",
};
type Settings = {
  machine: Machine;
  roots: (MachineImportRoot & { selected: boolean })[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 100 &&
    !/[\x00-\x1f\x7f]/.test(value)
  );
}

function validPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 4096 &&
    !/[\x00-\x1f\x7f]/.test(value) &&
    /^(?:[A-Za-z]:[\\/]|\/(?!\/))/.test(value)
  );
}

function parseMachine(value: unknown): Machine | null {
  if (!isObject(value)) return null;
  const { id, label, member } = value;
  if (
    typeof id !== "string" ||
    id.length > 192 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:@-]*$/.test(id) ||
    !validLabel(label) ||
    !validLabel(member)
  )
    return null;
  return { id, label: label.trim(), member: member.trim() };
}

// Read only the settings we own. Prompt consent is deliberately not part of them.
export function parseSavedMachineImportSettings(
  value: unknown,
): Settings | null {
  if (!isObject(value) || value.version !== 1) return null;
  const machine = parseMachine(value.machine);
  if (!machine || !Array.isArray(value.roots) || value.roots.length !== 2)
    return null;
  const roots: Settings["roots"] = [];
  for (const root of value.roots) {
    if (
      !isObject(root) ||
      (root.provider !== "claude-code" && root.provider !== "codex") ||
      !validPath(root.path) ||
      typeof root.selected !== "boolean" ||
      roots.some((existing) => existing.provider === root.provider)
    )
      return null;
    roots.push({
      provider: root.provider,
      path: root.path,
      selected: root.selected,
    });
  }
  return { machine, roots };
}

function restoreSettings(defaults: MachineImportDefaults): Settings {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ?? "null",
    );
    const settings = parseSavedMachineImportSettings(saved);
    if (settings) return settings;
  } catch {
    // Disabled storage and old or malformed preferences must not block import.
  }
  return {
    machine: defaults.machine,
    roots: defaults.roots.map((root) => ({ ...root, selected: true })),
  };
}

export function machineImportSettingsForStorage(
  settings: Settings,
  lastValidPaths: Partial<Record<Provider, string>>,
): Settings | null {
  return parseSavedMachineImportSettings({
    version: 1,
    machine: settings.machine,
    roots: settings.roots.map((root) => ({
      ...root,
      path:
        !root.selected && !validPath(root.path)
          ? (lastValidPaths[root.provider] ?? root.path)
          : root.path,
    })),
  });
}

function rememberSettings(
  settings: Settings,
  lastValidPaths: Partial<Record<Provider, string>>,
) {
  for (const root of settings.roots) {
    if (validPath(root.path)) lastValidPaths[root.provider] = root.path;
  }
  const valid = machineImportSettingsForStorage(settings, lastValidPaths);
  if (!valid) return;
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 1, ...valid }),
    );
  } catch {
    // Import remains usable when browser storage is unavailable.
  }
}

async function responseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const value: unknown = await response.json();
    if (isObject(value) && typeof value.error === "string")
      return new Error(value.error);
  } catch {
    // A failed proxy or server response may not contain JSON.
  }
  return new Error(fallback);
}

export function MachineImportPanel({ source }: { source: "local" | "demo" }) {
  const router = useRouter();
  const fieldId = useId();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [defaultsError, setDefaultsError] = useState<string | null>(null);
  const [defaultsAttempt, setDefaultsAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [includePrompts, setIncludePrompts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MachineImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const lastValidPaths = useRef<Partial<Record<Provider, string>>>({});

  useEffect(() => {
    const controller = new AbortController();
    async function loadDefaults() {
      try {
        const response = await fetch("/api/machine-import", {
          signal: controller.signal,
        });
        if (!response.ok)
          throw await responseError(
            response,
            "Computer settings could not be loaded. Please retry.",
          );
        const defaults = (await response.json()) as MachineImportDefaults;
        if (!controller.signal.aborted) {
          const restored = restoreSettings(defaults);
          for (const root of [...defaults.roots, ...restored.roots]) {
            if (validPath(root.path))
              lastValidPaths.current[root.provider] = root.path;
          }
          setSettings(restored);
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setDefaultsError(
            cause instanceof Error
              ? cause.message
              : "Computer settings could not be loaded. Please retry.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadDefaults();
    return () => controller.abort();
  }, [defaultsAttempt]);

  function updateSettings(next: Settings) {
    setSettings(next);
    rememberSettings(next, lastValidPaths.current);
    setError(null);
    setResult(null);
  }

  function changeMachine(key: keyof Machine, value: string) {
    if (settings)
      updateSettings({
        ...settings,
        machine: { ...settings.machine, [key]: value },
      });
  }

  function changeRoot(
    provider: Provider,
    patch: { path?: string; selected?: boolean },
  ) {
    if (settings)
      updateSettings({
        ...settings,
        roots: settings.roots.map((root) =>
          root.provider === provider ? { ...root, ...patch } : root,
        ),
      });
  }

  function importMachine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || pending || submitting.current) return;
    setError(null);
    setResult(null);
    const machine = parseMachine(settings.machine);
    const roots = settings.roots
      .filter((root) => root.selected)
      .map(({ provider, path }) => ({ provider, path }));
    if (!machine || roots.some((root) => !validPath(root.path))) {
      setSettingsOpen(true);
      setError(
        "Check the names, stable machine ID, and selected folder paths in Names and folders.",
      );
      return;
    }
    if (!roots.length) {
      setError("Select Claude Code, Codex, or both to import.");
      return;
    }
    const request: MachineImportRequest = { machine, roots, includePrompts };
    rememberSettings(settings, lastValidPaths.current);
    submitting.current = true;
    startTransition(async () => {
      try {
        const response = await fetch("/api/machine-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        if (!response.ok)
          throw await responseError(
            response,
            "Import failed. Check the selected folders and try again.",
          );
        const imported = (await response.json()) as MachineImportResult;
        setResult(imported);
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Import failed. Check the selected folders and try again.",
        );
      } finally {
        submitting.current = false;
      }
    });
  }

  const noProvider = settings?.roots.every((root) => !root.selected) ?? true;
  return (
    <section
      className="card machine-import"
      aria-labelledby={`${fieldId}-title`}
    >
      <div className="card-head">
        <div>
          <h2 id={`${fieldId}-title`}>Import from this computer</h2>
          <p>
            Collect Claude Code and Codex usage directly into your local
            dashboard.
          </p>
        </div>
      </div>
      <div className="card-body">
        {source === "demo" ? (
          <p className="notice">
            This imports into your local data. The demo stays separate.
          </p>
        ) : null}
        {loading ? <p className="muted">Loading computer settings…</p> : null}
        {defaultsError ? (
          <div className="notice notice-error" role="alert">
            <p>{defaultsError}</p>
            <button
              className="button button-secondary"
              type="button"
              disabled={loading}
              onClick={() => {
                setDefaultsError(null);
                setLoading(true);
                setDefaultsAttempt((attempt) => attempt + 1);
              }}
            >
              Retry loading settings
            </button>
          </div>
        ) : null}
        {settings ? (
          <form
            className="transfer-form"
            noValidate
            onSubmit={importMachine}
            aria-busy={pending}
          >
            <fieldset className="machine-import-fields" disabled={pending}>
              <legend className="sr-only">
                Choose local sources and import settings
              </legend>
              <div className="machine-import-providers">
                {settings.roots.map((root) => (
                  <div className="machine-import-provider" key={root.provider}>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={root.selected}
                        onChange={(event) =>
                          changeRoot(root.provider, {
                            selected: event.target.checked,
                          })
                        }
                        aria-describedby={`${fieldId}-${root.provider}-path`}
                      />
                      Import {PROVIDER_NAMES[root.provider]}
                    </label>
                    <code
                      className="machine-import-path"
                      id={`${fieldId}-${root.provider}-path`}
                    >
                      {root.path}
                    </code>
                  </div>
                ))}
              </div>
              <p className="muted">
                These folders are read only when you import. Only supported
                usage is saved locally; no cloud upload.
              </p>
              <details
                className="machine-import-settings"
                open={settingsOpen}
                onToggle={(event) => setSettingsOpen(event.currentTarget.open)}
              >
                <summary>Names and folders</summary>
                <div className="form-grid">
                  <div className="field">
                    <label
                      className="field-label"
                      htmlFor={`${fieldId}-member`}
                    >
                      Team member
                    </label>
                    <input
                      id={`${fieldId}-member`}
                      value={settings.machine.member}
                      maxLength={100}
                      onChange={(event) =>
                        changeMachine("member", event.target.value)
                      }
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor={`${fieldId}-label`}>
                      Computer name
                    </label>
                    <input
                      id={`${fieldId}-label`}
                      value={settings.machine.label}
                      maxLength={100}
                      onChange={(event) =>
                        changeMachine("label", event.target.value)
                      }
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor={`${fieldId}-id`}>
                      Stable machine ID
                    </label>
                    <input
                      id={`${fieldId}-id`}
                      value={settings.machine.id}
                      maxLength={192}
                      aria-describedby={`${fieldId}-identity-help`}
                      onChange={(event) =>
                        changeMachine("id", event.target.value)
                      }
                    />
                  </div>
                  {settings.roots.map((root) => (
                    <div className="field" key={root.provider}>
                      <label
                        className="field-label"
                        htmlFor={`${fieldId}-${root.provider}-folder`}
                      >
                        {PROVIDER_NAMES[root.provider]} folder
                      </label>
                      <input
                        id={`${fieldId}-${root.provider}-folder`}
                        value={root.path}
                        maxLength={4096}
                        spellCheck={false}
                        onChange={(event) =>
                          changeRoot(root.provider, {
                            path: event.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="muted" id={`${fieldId}-identity-help`}>
                  Keep the same machine ID, name and member for repeat imports.
                  Names, selected sources and folders are remembered in this
                  browser. Member identifies the person assigned to this usage;
                  provider identifies the application that recorded it. After
                  importing, use Edit display names in Machines in this
                  workspace to personalize existing names without changing the
                  import identity.
                </p>
              </details>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={includePrompts}
                  aria-describedby={`${fieldId}-prompt-help`}
                  onChange={(event) => {
                    setIncludePrompts(event.target.checked);
                    setError(null);
                    setResult(null);
                  }}
                />
                Include human prompts from this computer
              </label>
              <p className="muted" id={`${fieldId}-prompt-help`}>
                Optional prompt text stays local and may contain sensitive
                information. This choice resets when you reopen the page.
              </p>
              <div className="inline-row">
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={pending || noProvider}
                >
                  {pending ? "Importing…" : "Import from this computer"}
                </button>
                {noProvider ? (
                  <span className="muted">Select at least one source.</span>
                ) : null}
              </div>
              <p className="muted">
                For repeatable imports, use completed sessions. Large histories
                may need smaller folders; skipped files and limits appear in the
                result.
              </p>
            </fieldset>
            {error ? (
              <div className="notice notice-error" role="alert">
                <p>{error}</p>
                <p>Review Names and folders, then try importing again.</p>
              </div>
            ) : null}
            {result ? (
              <div
                className={`notice ${result.partial || result.status === "empty" ? "notice-warning" : "notice-success"}`}
                role="status"
                aria-atomic="true"
              >
                <h3>
                  {result.status === "empty"
                    ? "Nothing imported"
                    : result.partial
                      ? "Partial import"
                      : "Import complete"}
                </h3>
                {result.status === "empty" ? (
                  <p>
                    No supported records were found. Check source details and
                    adjust the folders before trying again.
                  </p>
                ) : (
                  <p>
                    Saved {result.addedUsage.toLocaleString()} usage records and{" "}
                    {result.addedPrompts.toLocaleString()} human prompts.{" "}
                    {result.duplicates.toLocaleString()} duplicates skipped.
                  </p>
                )}
                {result.partial ? (
                  <p>
                    Some history may be missing or unsupported. Review source
                    details or select smaller folders; these results do not
                    cover all selected history.
                  </p>
                ) : null}
                <p>
                  Read {result.filesRead.toLocaleString()} files. All imported
                  data is in your local database.
                </p>
                {result.sources.map((item) => (
                  <details
                    className="machine-import-source-result"
                    key={item.provider}
                  >
                    <summary>
                      {PROVIDER_NAMES[item.provider]}:{" "}
                      {item.usageCount.toLocaleString()} usage records,{" "}
                      {item.promptCount.toLocaleString()} prompts
                      {item.partial ? " · incomplete" : ""}
                    </summary>
                    <p>{item.filesRead.toLocaleString()} files read.</p>
                    {item.diagnostics.length ? (
                      <ul>
                        {item.diagnostics.map((diagnostic, index) => (
                          <li key={`${diagnostic.code}-${index}`}>
                            {diagnostic.message}
                            {diagnostic.line !== undefined
                              ? ` (line ${diagnostic.line})`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No collection warnings.</p>
                    )}
                  </details>
                ))}
                {result.status === "imported" ? (
                  <Link href="/?source=local&view=overview">
                    View imported usage
                  </Link>
                ) : null}
              </div>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  );
}
