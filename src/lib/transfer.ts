import { z } from "zod";
import { BundleSchema, MachineSchema, ProviderSchema, MAX_FILE_BYTES, type Bundle } from "./schema";
import { parseTranscript, type Diagnostic } from "./parsers";
import { HttpError } from "./http";
import { type Ledger } from "./storage";

const ImportRequestSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("bundle"), bundle: z.unknown(), preview: z.boolean().default(false) }),
  z.strictObject({ kind: z.literal("transcript"), text: z.string().min(1), provider: ProviderSchema, machine: MachineSchema, includePrompts: z.boolean().default(false), preview: z.boolean().default(false) }),
]);
export const ExportRequestSchema = z.strictObject({
  source: z.enum(["local", "demo"]).default("local"), includePrompts: z.boolean().default(false),
});

export function importData(input: unknown, ledger: Ledger) {
  const request = ImportRequestSchema.parse(input);
  let bundle: Bundle;
  let diagnostics: Diagnostic[] = [];
  if (request.kind === "bundle") bundle = BundleSchema.parse(request.bundle);
  else {
    if (Buffer.byteLength(request.text) > MAX_FILE_BYTES) throw new HttpError(413, "Transcript exceeds 20 MiB. Choose a smaller completed session.");
    const parsed = parseTranscript(request.text, request);
    bundle = BundleSchema.parse(parsed.bundle); diagnostics = parsed.diagnostics;
  }
  if (request.kind === "transcript" && !bundle.usage.length && !bundle.prompts.length) throw new HttpError(400, "No supported usage or human prompts were found. Check the provider and session format.");
  const preview = { machines: bundle.machines, usageCount: bundle.usage.length, promptCount: bundle.prompts.length, diagnostics };
  if (request.preview) return { preview: true as const, ...preview };
  return { preview: false as const, ...preview, ...ledger.merge(bundle) };
}

export function exportData(bundle: Bundle, includePrompts = false): string {
  const output = BundleSchema.parse({ ...bundle, prompts: includePrompts ? bundle.prompts : [], exportedAt: new Date().toISOString() });
  const text = JSON.stringify(output, null, 2) + "\n";
  if (Buffer.byteLength(text) > MAX_FILE_BYTES) throw new HttpError(413, "Export exceeds 20 MiB. Export usage only, or collect a smaller dataset.");
  return text;
}
