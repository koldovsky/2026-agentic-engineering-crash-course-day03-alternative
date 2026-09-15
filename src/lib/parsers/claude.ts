import type { Tokens } from "../schema";
import { count, hash, identifier, isGeneratedText, isSynthetic, object, type JsonObject, type ParseContext, type SourceLine } from "./shared";

function tokensFromUsage(usage: JsonObject, context: ParseContext, line: number): Tokens | undefined {
  const input = count(usage.input_tokens);
  const output = count(usage.output_tokens);
  const cacheRead = count(usage.cache_read_input_tokens, true);
  const creation = count(usage.cache_creation_input_tokens, true);
  const split = object(usage.cache_creation);
  let cacheWrite: number | undefined;
  let cacheWrite1h: number | undefined;
  if (split) {
    cacheWrite = count(split.ephemeral_5m_input_tokens);
    cacheWrite1h = count(split.ephemeral_1h_input_tokens);
    if (cacheWrite !== undefined && cacheWrite1h !== undefined && usage.cache_creation_input_tokens !== undefined && creation !== cacheWrite + cacheWrite1h) {
      context.report("invalid_cache_split", "Cache duration counts disagree with the aggregate; this usage observation was skipped.", line);
      return undefined;
    }
  } else {
    if (usage.cache_creation !== undefined && usage.cache_creation !== null) return undefined;
    cacheWrite = creation;
    cacheWrite1h = 0;
    if (creation) context.reportOnce("cache_duration_assumed", "Claude cache creation has no duration split; writes are assumed to use the 5-minute rate.", line);
  }
  if ([input, output, cacheRead, cacheWrite, cacheWrite1h].some((value) => value === undefined)) return undefined;
  // Claude reports thinking within output and does not provide a separate count here.
  return { input: input!, output: output!, cacheRead: cacheRead!, cacheWrite: cacheWrite!, cacheWrite1h: cacheWrite1h!, reasoning: 0 };
}

function humanText(entry: JsonObject): string | undefined {
  const message = object(entry.message);
  if (!message || isSynthetic(entry) || isSynthetic(message)) return undefined;
  if (message.role !== undefined && message.role !== "user") return undefined;
  const content = message.content;
  let text: string;
  if (typeof content === "string") text = content;
  else if (Array.isArray(content)) {
    if (content.some((block) => object(block)?.type === "tool_result")) return undefined;
    text = content.flatMap((block) => {
      const item = object(block);
      return item?.type === "text" && typeof item.text === "string" && !isGeneratedText(item.text) ? [item.text] : [];
    }).join("\n");
  } else return undefined;
  return text.trim().length > 0 && !isGeneratedText(text) ? text : undefined;
}

export function parseClaude(lines: SourceLine[], context: ParseContext): void {
  const fileSession = lines.map(({ value }) => value.sessionId).find((value) => identifier(value));
  const firstEntry = lines[0]?.value;
  const fileSubagent = Boolean(firstEntry?.isSidechain || firstEntry?.teamName);
  for (const { value: entry, line } of lines) {
    if (entry.type === "assistant") {
      const message = object(entry.message);
      const usage = object(message?.usage);
      if (!message || !usage) {
        context.report("missing_usage", "An assistant record has no supported usage; accounting coverage is incomplete.", line);
        continue;
      }
      const tokens = tokensFromUsage(usage, context, line);
      if (!tokens) {
        context.report("invalid_usage", "An assistant usage observation has missing or invalid counts and was skipped.", line);
        continue;
      }
      const timestamp = context.timestamp(entry.timestamp, line);
      if (!timestamp) continue;
      const sessionId = context.session(entry.sessionId ?? fileSession, line);
      const nativeId = identifier(message.id);
      const model = context.model(message.model, line);
      const id = nativeId ? `claude-${hash(sessionId, nativeId)}`
        : context.fallbackId("claude", [sessionId, timestamp, model, tokens, entry.uuid], false, line);
      context.addUsage({ id, machineId: context.options.machine.id, provider: "claude-code", sessionId, timestamp, model, tokens }, line, true);
      context.reportOnce("claude_reported_usage", "Claude usage is reported transcript data. Output may be incomplete or a placeholder; totals are not verified billing.", line);
    } else if (entry.type === "user" && context.options.includePrompts) {
      const text = fileSubagent ? undefined : humanText(entry);
      if (text === undefined) {
        context.reportOnce("excluded_claude_prompts", "Tool, generated, subagent or ambiguous user entries were excluded from human prompts.", line);
        continue;
      }
      const timestamp = context.timestamp(entry.timestamp, line);
      if (!timestamp) continue;
      const sessionId = context.session(entry.sessionId ?? fileSession, line);
      const nativeId = identifier(entry.uuid);
      const id = nativeId ? `claude-prompt-${hash(sessionId, nativeId)}`
        : context.fallbackId("claude-prompt", [sessionId, timestamp, text], true, line);
      context.addPrompt({ id, machineId: context.options.machine.id, provider: "claude-code", sessionId, timestamp, text }, line);
    } else if (!["user", "system", "progress", "attachment", "summary", "file-history-snapshot", "queue-operation", "last-prompt", "custom-title", "agent-name", "agent-color"].includes(String(entry.type))) {
      context.reportOnce("unsupported_records", "Unrecognized transcript records were ignored; supported usage and prompts were retained.", line);
    }
  }
}
