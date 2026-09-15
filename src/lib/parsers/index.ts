import { MAX_FILE_BYTES, MachineSchema, ProviderSchema, type Bundle } from "../schema";
import { parseClaude } from "./claude";
import { parseCodex } from "./codex";
import { ParseContext, sourceLines, type Diagnostic, type ParseOptions } from "./shared";

export type { Diagnostic, ParseOptions } from "./shared";

export function parseTranscript(text: string, options: ParseOptions): { bundle: Bundle; diagnostics: Diagnostic[] } {
  const safeOptions = { ...options, machine: MachineSchema.parse(options.machine), provider: ProviderSchema.parse(options.provider) };
  const context = new ParseContext(safeOptions, text);
  if (Buffer.byteLength(text, "utf8") > MAX_FILE_BYTES) {
    context.report("file_limit", "Transcript exceeds the file size limit and was not parsed.");
  } else {
    const lines = sourceLines(text, context);
    if (options.provider === "claude-code") parseClaude(lines, context);
    else parseCodex(lines, context);
    if (context.usage.size === 0) context.report("no_usage", "No supported usage records were found; accounting coverage is empty.");
  }
  return { bundle: context.bundle(), diagnostics: context.diagnostics };
}
