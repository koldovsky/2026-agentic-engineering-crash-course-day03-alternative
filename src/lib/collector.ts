import { lstat, readdir, open, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { BundleSchema, MachineSchema, MAX_FILE_BYTES, MAX_RECORDS, recordKey, type Bundle, type Machine, type Provider } from "./schema";
import { parseTranscript } from "./parsers";

type CollectionDiagnostic = { code: string; message: string; line?: number };
export type CollectionOptions = {
  roots: { provider: Provider; path: string }[];
  machine: Machine;
  includePrompts?: boolean;
};
const MAX_FILES = 2_000;
const MAX_ENTRIES = 10_000;
const MAX_SCAN_BYTES = 100 * 1024 * 1024;

/** No defaults or implicit home scans: every root is an explicit caller choice. */
export async function collect(options: CollectionOptions) {
  const machine = MachineSchema.parse(options.machine);
  const bundle: Bundle = { schemaVersion: 1, exportedAt: new Date().toISOString(), machines: [machine], usage: [], prompts: [] };
  const diagnostics: CollectionDiagnostic[] = [];
  const usage = new Map<string, Bundle["usage"][number]>();
  const prompts = new Map<string, Bundle["prompts"][number]>();
  let filesRead = 0;
  let filesVisited = 0;
  let entriesVisited = 0;
  let bytesRead = 0;
  let duplicates = 0;
  let exhausted = false;
  const report = (code: string, message: string) => { if (diagnostics.length < 200) diagnostics.push({ code, message }); };

  async function walk(path: string, provider: Provider, depth: number) {
    if (exhausted) return;
    if (++entriesVisited > MAX_ENTRIES || depth > 20) {
      exhausted = true; report("scan-limit", "Collection stopped at the directory traversal limit."); return;
    }
    let stat;
    try { stat = await lstat(path); }
    catch { report("unreadable-path", "A selected path is missing or unreadable."); return; }
    if (stat.isSymbolicLink()) { report("symlink-skipped", "A symbolic link was skipped."); return; }
    if (stat.isDirectory()) {
      let entries;
      try { entries = await readdir(path, { withFileTypes: true }); }
      catch { report("unreadable-directory", "A selected directory could not be read."); return; }
      // Stable order makes diagnostics and duplicate resolution reproducible.
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (exhausted) break;
        await walk(join(path, entry.name), provider, depth + 1);
      }
      return;
    }
    if (!stat.isFile() || !path.toLowerCase().endsWith(".jsonl")) return;
    if (++filesVisited > MAX_FILES) { exhausted = true; report("file-limit", "Collection stopped at 2,000 JSONL files."); return; }
    if (stat.size > MAX_FILE_BYTES) { report("oversize-file", "A JSONL file exceeded 20 MiB and was skipped."); return; }
    if (bytesRead + stat.size > MAX_SCAN_BYTES) { exhausted = true; report("byte-limit", "Collection stopped at 100 MiB. Choose a smaller date folder."); return; }
    let text;
    try {
      const buffer = await readBoundedFile(path);
      if (buffer.byteLength > MAX_FILE_BYTES || bytesRead + buffer.byteLength > MAX_SCAN_BYTES) {
        report("growing-file", "A growing file exceeded the byte limit and was skipped."); return;
      }
      bytesRead += buffer.byteLength; text = buffer.toString("utf8");
    } catch { report("unreadable-file", "A JSONL file could not be read."); return; }
    const parsed = parseTranscript(text, { provider, machine, includePrompts: options.includePrompts ?? false });
    filesRead++;
    for (const diagnostic of parsed.diagnostics) {
      if (diagnostics.length < 200) diagnostics.push(diagnostic);
    }
    for (const record of parsed.bundle.usage) {
      const key = recordKey(record); const previous = usage.get(key);
      if (previous && JSON.stringify(previous) !== JSON.stringify(record)) throw new Error("Conflicting session snapshots. Collect completed sessions without overlapping copies.");
      if (previous) duplicates++; else usage.set(key, record);
    }
    for (const record of parsed.bundle.prompts) {
      const key = recordKey(record); const previous = prompts.get(key);
      if (previous && JSON.stringify(previous) !== JSON.stringify(record)) throw new Error("Conflicting prompt identities in selected files.");
      if (previous) duplicates++; else prompts.set(key, record);
    }
    if (usage.size > MAX_RECORDS || prompts.size > MAX_RECORDS) throw new Error("Collection exceeds 20,000 records. Choose a smaller date folder.");
  }
  for (const root of options.roots) await walk(resolve(root.path), root.provider, 0);
  bundle.usage = [...usage.values()]; bundle.prompts = [...prompts.values()];
  return { bundle: BundleSchema.parse(bundle), diagnostics, filesRead, duplicates };
}

async function readBoundedFile(path: string): Promise<Buffer> {
  const file = await open(path, "r");
  try {
    const buffer = Buffer.alloc(Math.min((await file.stat()).size + 1, MAX_FILE_BYTES + 1));
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await file.read(buffer, offset, buffer.length - offset, null);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    return buffer.subarray(0, offset);
  } finally { await file.close(); }
}

export async function writeBundle(path: string, bundle: Bundle, force = false) {
  const text = JSON.stringify(BundleSchema.parse(bundle), null, 2) + "\n";
  if (Buffer.byteLength(text, "utf8") > MAX_FILE_BYTES) throw new Error("Export exceeds 20 MiB. Collect a smaller date folder.");
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text, { flag: force ? "w" : "wx", mode: 0o600 });
}
