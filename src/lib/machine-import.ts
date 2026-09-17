// Node-only orchestration; defaults never inspect the suggested directories.
import { createHash } from "node:crypto";
import { homedir, hostname } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { z } from "zod";
import {
  collect,
  CollectionConflictError,
  CollectionLimitError,
} from "./collector";
import { HttpError } from "./http";
import type {
  MachineImportDefaults,
  MachineImportResult,
  MachineImportSourceResult,
} from "./machine-import-contract";
import {
  BundleSchema,
  MachineSchema,
  MAX_RECORDS,
  ProviderSchema,
  recordKey,
  type Bundle,
} from "./schema";
import { DatasetLimitError, findImportedMachine, ImportConflictError, withLedger } from "./storage";

const rootPath = z
  .string()
  .min(1)
  .max(4096)
  .refine((value) => {
    if (
      value.trim() !== value ||
      /[\x00-\x1f\x7f]/.test(value) ||
      !isAbsolute(value)
    )
      return false;
    // Drive-rooted paths only on Windows: UNC/device paths may reach a network share.
    return process.platform !== "win32" || /^[A-Za-z]:[\\/]/.test(value);
  }, "Choose an absolute local provider directory.");

const MachineImportRequestSchema = z.strictObject({
  machine: MachineSchema,
  roots: z
    .array(z.strictObject({ provider: ProviderSchema, path: rootPath }))
    .min(1)
    .max(2)
    .refine(
      (roots) =>
        new Set(roots.map((root) => root.provider)).size === roots.length,
      "Select one root per provider.",
    ),
  includePrompts: z.boolean().default(false),
});

function safeLabel(value: string, fallback: string): string {
  return (
    value
      .replace(/[\x00-\x1f\x7f]/g, "")
      .trim()
      .slice(0, 100) || fallback
  );
}

export function getMachineImportDefaults(): MachineImportDefaults {
  const home = homedir();
  const host = hostname();
  const suggested = MachineSchema.parse({
    id: `machine-${createHash("sha256")
      .update(JSON.stringify([host, home]))
      .digest("hex")
      .slice(0, 24)}`,
    label: safeLabel(host, "This computer"),
    member: "Local user",
  });
  const machine = findImportedMachine(suggested.id) ?? suggested;
  return {
    machine,
    roots: [
      // Runtime suggestions are metadata, not files to trace into the app build.
      {
        provider: "claude-code",
        path: join(
          resolve(
            /* turbopackIgnore: true */ process.env.CLAUDE_CONFIG_DIR?.trim() ||
              join(home, ".claude"),
          ),
          "projects",
        ),
      },
      {
        provider: "codex",
        path: join(
          resolve(
            /* turbopackIgnore: true */ process.env.CODEX_HOME?.trim() ||
              join(home, ".codex"),
          ),
          "sessions",
        ),
      },
    ],
  };
}

export async function importFromMachine(
  input: unknown,
): Promise<MachineImportResult> {
  // Validate the entire request before any collection or ledger creation.
  const validated = MachineImportRequestSchema.safeParse(input);
  if (!validated.success)
    throw new HttpError(
      400,
      "Choose one absolute local directory per provider and valid machine details. Network paths and unknown fields are not supported.",
    );
  const request = validated.data;
  const bundle: Bundle = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    machines: [request.machine],
    usage: [],
    prompts: [],
  };
  const usage = new Map<string, Bundle["usage"][number]>();
  const prompts = new Map<string, Bundle["prompts"][number]>();
  const sources: MachineImportSourceResult[] = [];
  let duplicates = 0;

  for (const root of request.roots) {
    let result: Awaited<ReturnType<typeof collect>>;
    try {
      result = await collect({
        roots: [root],
        machine: request.machine,
        includePrompts: request.includePrompts,
      });
    } catch (error) {
      if (error instanceof CollectionConflictError)
        throw new HttpError(
          409,
          "Selected session snapshots conflict. Choose completed sessions without overlapping changed copies.",
        );
      if (error instanceof CollectionLimitError)
        throw new HttpError(
          413,
          "Collection exceeds 20,000 records. Choose a smaller completed-session folder.",
        );
      throw error;
    }
    sources.push({
      provider: root.provider,
      filesRead: result.filesRead,
      usageCount: result.bundle.usage.length,
      promptCount: result.bundle.prompts.length,
      partial: result.partial,
      diagnostics: result.diagnostics,
    });
    duplicates += result.duplicates;
    for (const record of result.bundle.usage) {
      const key = recordKey(record);
      const previous = usage.get(key);
      if (previous && JSON.stringify(previous) !== JSON.stringify(record))
        throw new ImportConflictError();
      if (previous) duplicates++;
      else usage.set(key, record);
    }
    for (const record of result.bundle.prompts) {
      const key = recordKey(record);
      const previous = prompts.get(key);
      if (previous && JSON.stringify(previous) !== JSON.stringify(record))
        throw new ImportConflictError();
      if (previous) duplicates++;
      else prompts.set(key, record);
    }
    if (usage.size > MAX_RECORDS || prompts.size > MAX_RECORDS)
      throw new HttpError(
        413,
        "Combined collection exceeds 20,000 records. Choose smaller completed-session folders.",
      );
  }
  bundle.usage = [...usage.values()];
  bundle.prompts = [...prompts.values()];
  const parsed = BundleSchema.parse(bundle);
  const summary = {
    partial: sources.some((source) => source.partial),
    filesRead: sources.reduce((total, source) => total + source.filesRead, 0),
    usageCount: parsed.usage.length,
    promptCount: parsed.prompts.length,
    sources,
  };
  if (!parsed.usage.length && !parsed.prompts.length) {
    return {
      status: "empty",
      ...summary,
      addedMachines: 0,
      addedUsage: 0,
      addedPrompts: 0,
      duplicates,
    };
  }
  // All filesystem work and combined validation finish before the one atomic merge.
  try {
    const merged = withLedger((ledger) => ledger.merge(parsed));
    return {
      status: "imported",
      ...summary,
      ...merged,
      duplicates: duplicates + merged.duplicates,
    };
  } catch (error) {
    if (error instanceof ImportConflictError)
      throw new HttpError(
        409,
        "This import conflicts with saved records. Keep machine attribution consistent and choose unchanged completed sessions.",
      );
    if (error instanceof DatasetLimitError)
      throw new HttpError(
        413,
        "Local data is limited to 100 machines and 20,000 records of each kind. Choose smaller completed-session folders.",
      );
    throw error;
  }
}
