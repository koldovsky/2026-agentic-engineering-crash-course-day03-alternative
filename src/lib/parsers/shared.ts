import { createHash } from "node:crypto";
import { z } from "zod";
import {
  MAX_RECORDS, PromptEventSchema, UsageEventSchema,
  type Bundle, type Machine, type PromptEvent, type Provider, type Tokens, type UsageEvent,
} from "../schema";

export type Diagnostic = { code: string; message: string; line?: number };
export type ParseOptions = { provider: Provider; machine: Machine; includePrompts: boolean };
export type JsonObject = Record<string, unknown>;
export type SourceLine = { value: JsonObject; line: number };
const dateSchema = z.iso.datetime({ offset: true });
const nativeIdSchema = z.string().min(1).max(192).regex(/^[A-Za-z0-9][A-Za-z0-9._:@-]*$/);
const MAX_DIAGNOSTICS = 200;
export const MAX_LINES = 100_000;

export function object(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject : undefined;
}

export function hash(...values: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

export function identifier(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return nativeIdSchema.safeParse(value).success ? value : `source-${hash(value)}`;
}

export function count(value: unknown, optional = false): number | undefined {
  if (value === undefined && optional) return 0;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000_000
    ? value : undefined;
}

export function sameTokens(left: Tokens, right: Tokens): boolean {
  return (Object.keys(left) as (keyof Tokens)[]).every((key) => left[key] === right[key]);
}

export function monotonicTokens(before: Tokens, after: Tokens): boolean {
  return (Object.keys(before) as (keyof Tokens)[]).every((key) => after[key] >= before[key]);
}

export class ParseContext {
  readonly diagnostics: Diagnostic[] = [];
  readonly usage = new Map<string, UsageEvent>();
  readonly prompts = new Map<string, PromptEvent>();
  private readonly once = new Set<string>();
  private readonly occurrences = new Map<string, number>();
  readonly fallbackSession: string;

  constructor(readonly options: ParseOptions, text: string) {
    this.fallbackSession = `snapshot-${hash(options.provider, text)}`;
  }

  report(code: string, message: string, line?: number): void {
    if (this.diagnostics.length < MAX_DIAGNOSTICS - 1) {
      this.diagnostics.push({ code, message, ...(line === undefined ? {} : { line }) });
    } else if (this.diagnostics.length === MAX_DIAGNOSTICS - 1) {
      this.diagnostics.push({ code: "diagnostic_limit", message: "Additional diagnostics were omitted. Coverage may be incomplete." });
    }
  }

  reportOnce(code: string, message: string, line?: number): void {
    if (!this.once.has(code)) { this.once.add(code); this.report(code, message, line); }
  }

  session(value: unknown, line: number): string {
    const native = identifier(value);
    if (native) return native;
    this.reportOnce("session_fallback", "Session identity is missing; fallback IDs identify this exact completed snapshot.", line);
    return this.fallbackSession;
  }

  timestamp(value: unknown, line: number): string | undefined {
    const parsed = dateSchema.safeParse(value);
    if (!parsed.success) {
      this.report("invalid_timestamp", "Record skipped because its timestamp is missing or invalid.", line);
      return undefined;
    }
    return new Date(parsed.data).toISOString();
  }

  model(value: unknown, line: number): string {
    if (typeof value === "string" && value.trim().length > 0 && value.length <= 120) return value;
    this.reportOnce("unknown_model", "Some usage has no recognized model attribution and remains unpriced.", line);
    return "unknown";
  }

  fallbackId(kind: string, values: unknown[], preserveOccurrences: boolean, line: number): string {
    this.reportOnce("identity_fallback", "Some records lack native IDs; deterministic snapshot identities are used.", line);
    const fingerprint = hash(kind, ...values);
    const occurrence = preserveOccurrences ? (this.occurrences.get(fingerprint) ?? 0) + 1 : 0;
    this.occurrences.set(fingerprint, occurrence);
    return `${kind}-${hash(fingerprint, occurrence)}`;
  }

  addUsage(candidate: UsageEvent, line: number, allowGrowth = false): void {
    const parsed = UsageEventSchema.safeParse(candidate);
    if (!parsed.success) {
      this.report("invalid_usage", "Usage was skipped because normalized counts or attribution are invalid.", line);
      return;
    }
    const previous = this.usage.get(candidate.id);
    if (previous) {
      if (previous.model === candidate.model && previous.sessionId === candidate.sessionId && sameTokens(previous.tokens, candidate.tokens)) return;
      if (allowGrowth && previous.model === candidate.model && previous.sessionId === candidate.sessionId && monotonicTokens(previous.tokens, candidate.tokens)) {
        // Preserve the first observation time and one coherent, later usage vector.
        this.usage.set(candidate.id, { ...candidate, timestamp: previous.timestamp });
        this.report("usage_updated", "A repeated message grew; its latest monotonic usage replaced the earlier observation. Import completed snapshots to avoid ledger conflicts.", line);
      } else {
        this.report("usage_conflict", "A repeated usage identity conflicts with an earlier observation; the first valid observation was retained.", line);
      }
      return;
    }
    if (this.usage.size >= MAX_RECORDS) {
      this.reportOnce("usage_limit", "Usage record limit reached; remaining new usage was omitted.", line);
      return;
    }
    this.usage.set(candidate.id, parsed.data);
  }

  addPrompt(candidate: PromptEvent, line: number): void {
    const parsed = PromptEventSchema.safeParse(candidate);
    if (!parsed.success) {
      this.report("invalid_prompt", "A prompt was omitted because its text length, timestamp or identity is invalid.", line);
      return;
    }
    const previous = this.prompts.get(candidate.id);
    if (previous) {
      if (previous.text !== candidate.text || previous.sessionId !== candidate.sessionId) {
        this.report("prompt_conflict", "A repeated prompt identity has conflicting content; the first observation was retained.", line);
      }
      return;
    }
    if (this.prompts.size >= MAX_RECORDS) {
      this.reportOnce("prompt_limit", "Prompt record limit reached; remaining new prompts were omitted.", line);
      return;
    }
    this.prompts.set(candidate.id, parsed.data);
  }

  bundle(): Bundle {
    return {
      schemaVersion: 1, exportedAt: new Date().toISOString(), machines: [this.options.machine],
      usage: [...this.usage.values()], prompts: [...this.prompts.values()],
    };
  }
}

export function sourceLines(text: string, context: ParseContext): SourceLine[] {
  const lines = text.replace(/^\uFEFF/, "").split("\n", MAX_LINES + 1);
  if (lines.length > MAX_LINES) {
    context.report("line_limit", "Line limit reached; the remaining transcript was omitted.");
    lines.length = MAX_LINES;
  }
  const parsed: SourceLine[] = [];
  for (let index = 0; index < lines.length; index++) {
    if (!lines[index].trim()) continue;
    try {
      const value = object(JSON.parse(lines[index]));
      if (value) parsed.push({ value, line: index + 1 });
      else context.report("invalid_line", "A JSONL entry was not an object and was skipped.", index + 1);
    } catch {
      context.report("malformed_json", "A malformed JSONL line was skipped; other valid records were retained.", index + 1);
    }
  }
  return parsed;
}

export function isSynthetic(entry: JsonObject): boolean {
  if (["isMeta", "isCompactSummary", "isSidechain", "isSynthetic", "synthetic"].some((key) => Boolean(entry[key]))) return true;
  if (["teamName", "parent_tool_use_id", "parentToolUseId", "agentId", "agent_id", "sourceToolAssistantUUID", "toolUseResult", "tool_use_result"].some((key) => entry[key] !== undefined && entry[key] !== null)) return true;
  for (const key of ["origin", "source"]) {
    const origin = entry[key];
    if (origin === undefined || origin === null) continue;
    const detail = object(origin);
    const kind = detail ? detail.type ?? detail.kind ?? detail.source : origin;
    if (kind !== "user" && kind !== "human") return true;
  }
  return false;
}

export function isGeneratedText(text: string): boolean {
  return /^\s*(?:<(?:local-command-stdout|local-command-stderr|session-start-hook|tick|goal|command-name|command-message|system-reminder|environment_context|permissions instructions|developer|system|subagent_notification|task-notification|ide_opened_file|ide_selection)(?:[\s>])|\[Request interrupted by user[^\]]*\])/i.test(text);
}
