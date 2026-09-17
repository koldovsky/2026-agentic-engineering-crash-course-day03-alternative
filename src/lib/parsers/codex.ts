import type { Tokens } from "../schema";
import { count, hash, identifier, isGeneratedText, isSynthetic, object, type JsonObject, type ParseContext, type SourceLine } from "./shared";

type RawTokens = { input: number; read: number; write: number; output: number; reasoning: number };

function readCounts(value: unknown): RawTokens | undefined {
  const usage = object(value);
  if (!usage) return undefined;
  const input = count(usage.input_tokens);
  const read = count(usage.cached_input_tokens, true);
  const write = count(usage.cache_write_input_tokens, true);
  const output = count(usage.output_tokens);
  const reasoning = count(usage.reasoning_output_tokens, true);
  if ([input, read, write, output, reasoning].some((number) => number === undefined)) return undefined;
  if (usage.total_tokens !== undefined && count(usage.total_tokens) === undefined) return undefined;
  if (read! + write! > input! || reasoning! > output!) return undefined;
  return { input: input!, read: read!, write: write!, output: output!, reasoning: reasoning! };
}

function normalize(tokens: RawTokens): Tokens {
  return { input: tokens.input - tokens.read - tokens.write, cacheRead: tokens.read, cacheWrite: tokens.write, cacheWrite1h: 0, output: tokens.output, reasoning: tokens.reasoning };
}

function generatedSession(meta: JsonObject | undefined): boolean {
  if (!meta) return false;
  const source = meta.source;
  return Boolean(meta.parent_thread_id || meta.agent_path || meta.agent_role || meta.agent_nickname)
    || ["subagent", "guardian_review", "memory_consolidation"].includes(String(meta.thread_source))
    || ["guardian", "memory_consolidation"].includes(String(object(source)?.internal))
    || (typeof source === "string" && /subagent|agent_spawn|thread_spawn/i.test(source))
    || Boolean(object(source)?.subagent);
}

function knownGeneratedMetadata(value: JsonObject): boolean {
  if (["isMeta", "isCompactSummary", "isSidechain", "isSynthetic", "synthetic"].some((key) => value[key] === true)) return true;
  if (["teamName", "parent_tool_use_id", "parentToolUseId", "agentId", "agent_id", "sourceToolAssistantUUID"].some((key) => typeof value[key] === "string" && value[key].length > 0)) return true;
  return ["origin", "source"].some((key) => {
    const detail = object(value[key]);
    const kind = detail ? detail.type ?? detail.kind ?? detail.source : value[key];
    return ["system", "developer", "assistant", "tool", "subagent"].includes(String(kind));
  });
}

function reportExcludedPrompt(context: ParseContext, line: number, generated: boolean): void {
  if (generated) context.reportOnce("generated_codex_prompts", "Known generated or subagent inputs were excluded from human prompts.", line);
  else context.reportOnce("excluded_codex_prompts", "Ambiguous or unsupported input events were excluded from human prompts; prompt coverage may be incomplete.", line);
}

function collectPrompts(lines: SourceLine[], context: ParseContext, meta: JsonObject | undefined): void {
  if (!context.options.includePrompts) return;
  const fileSession = meta?.id ?? meta?.session_id;
  const isGeneratedSession = generatedSession(meta);
  const unknownThreadSource = meta?.thread_source !== undefined && meta.thread_source !== null && meta.thread_source !== "user";
  const source = object(meta?.source);
  const unknownInternalSource = source !== undefined && Object.hasOwn(source, "internal")
    && !["guardian", "memory_consolidation"].includes(String(source.internal));

  // Keep the legacy representation first when a rollout also contains its
  // completed-item equivalent. Existing imports then retain their timestamp.
  for (const completed of [false, true]) {
    for (const { value: entry, line } of lines) {
      if (entry.type !== "event_msg") continue;
      const payload = object(entry.payload);
      const item = completed ? object(payload?.item) : undefined;
      if (completed ? payload?.type !== "item_completed" || item?.type !== "UserMessage" : payload?.type !== "user_message") continue;
      const boundaries = [entry, payload!, ...(item ? [item] : [])];
      if (isGeneratedSession || unknownThreadSource || unknownInternalSource || boundaries.some(isSynthetic)) {
        reportExcludedPrompt(context, line, isGeneratedSession || boundaries.some(knownGeneratedMetadata));
        continue;
      }

      let text: unknown = payload!.message;
      if (completed) {
        if (!Array.isArray(item!.content)) {
          reportExcludedPrompt(context, line, false);
          continue;
        }
        const parts: string[] = [];
        let unsupported = false;
        let generated = false;
        for (const value of item!.content) {
          const block = object(value);
          if (!block) { unsupported = true; break; }
          if (isSynthetic(block)) {
            generated = knownGeneratedMetadata(block);
            unsupported = true;
            break;
          }
          if (block.type === "text") {
            if (typeof block.text !== "string") { unsupported = true; break; }
            if (isGeneratedText(block.text)) { generated = true; unsupported = true; break; }
            parts.push(block.text);
          } else if (!["image", "local_image", "audio", "local_audio", "skill", "mention"].includes(String(block.type))) {
            // Do not guess how to extract future/unknown text-bearing blocks.
            unsupported = true;
            break;
          }
        }
        if (unsupported) {
          reportExcludedPrompt(context, line, generated);
          continue;
        }
        // Matches Codex's UserMessageItem::message; attachment payloads and
        // local paths never enter normalized human prompt text.
        text = parts.join("");
      }
      if (typeof text !== "string" || !text.trim() || isGeneratedText(text)) {
        reportExcludedPrompt(context, line, typeof text === "string" && isGeneratedText(text));
        continue;
      }
      const timestamp = context.timestamp(entry.timestamp, line);
      if (!timestamp) continue;
      const sessionId = context.session(completed ? payload!.thread_id ?? fileSession : fileSession, line);
      const clientId = identifier(completed ? item!.client_id : payload!.client_id);
      const itemId = completed ? identifier(item!.id) : undefined;
      const ordinal = typeof entry.ordinal === "number" && Number.isSafeInteger(entry.ordinal) && entry.ordinal >= 0 ? entry.ordinal : undefined;
      const id = clientId ? `codex-prompt-${hash(sessionId, clientId)}`
        : itemId ? `codex-prompt-${hash(sessionId, "item", itemId)}`
          : ordinal !== undefined ? `codex-prompt-${hash(sessionId, "ordinal", ordinal)}`
            : context.fallbackId("codex-prompt", [sessionId, timestamp, text], true, line);
      context.addPrompt({ id, machineId: context.options.machine.id, provider: "codex", sessionId, timestamp, text }, line);
    }
  }
}

export function parseCodex(lines: SourceLine[], context: ParseContext): void {
  const meta = object(lines.find(({ value }) => value.type === "session_meta")?.value.payload);
  const fileSession = meta?.id ?? meta?.session_id;
  const modern = lines.some(({ value }) => value.type === "token_usage_record");
  const hasLegacy = lines.some(({ value }) => value.type === "event_msg" && object(value.payload)?.type === "token_count");
  if (modern && hasLegacy) context.report("modern_precedence", "Modern response records take precedence; legacy token counts were omitted. Partial or invalid modern records can leave coverage gaps.");
  const models = new Map<string, unknown>();
  for (const { value } of lines) {
    const payload = object(value.payload);
    if (value.type === "turn_context" && typeof payload?.turn_id === "string") models.set(payload.turn_id, payload.model);
  }
  let currentModel: unknown = meta?.model;
  let cumulative: RawTokens = { input: 0, read: 0, write: 0, output: 0, reasoning: 0 };
  let reset = 0;
  let seenCumulative = false;
  const keys = Object.keys(cumulative) as (keyof RawTokens)[];

  collectPrompts(lines, context, meta);

  for (const { value: entry, line } of lines) {
    const payload = object(entry.payload);
    if (entry.type === "turn_context") {
      currentModel = payload?.model;
      continue;
    }
    if (entry.type === "event_msg" && payload?.type === "thread_settings_applied") {
      currentModel = object(payload.thread_settings)?.model;
      continue;
    }
    if (entry.type === "token_usage_record" || (entry.type === "event_msg" && payload?.type === "token_count" && !modern)) {
      const isModern = entry.type === "token_usage_record";
      const raw = readCounts(isModern ? payload?.usage : object(payload?.info)?.total_token_usage);
      if (!raw) {
        context.report("invalid_usage", "A usage record has missing or invalid counts; accounting coverage is incomplete.", line);
        continue;
      }
      let increment = raw;
      if (!isModern) {
        if (seenCumulative && keys.some((key) => raw[key] < cumulative[key])) {
          cumulative = raw;
          reset++;
          context.report("cumulative_reset", "Cumulative counters decreased. This ambiguous interval was skipped and the baseline was reset.", line);
          continue;
        }
        increment = Object.fromEntries(keys.map((key) => [key, raw[key] - cumulative[key]])) as RawTokens;
        cumulative = raw;
        if (!seenCumulative) context.reportOnce("legacy_snapshot_coverage", "Legacy usage before the first available snapshot is attributed to that snapshot time; history coverage may be partial.", line);
        seenCumulative = true;
        if (keys.every((key) => increment[key] === 0)) continue;
        if (increment.read + increment.write > increment.input || increment.reasoning > increment.output) {
          context.report("invalid_usage_delta", "Cumulative differences cannot form disjoint token counts; this interval was skipped and rebaselined.", line);
          continue;
        }
      }
      const timestamp = context.timestamp(entry.timestamp, line);
      if (!timestamp) continue;
      const sessionId = context.session(isModern ? payload?.thread_id ?? fileSession ?? payload?.session_id : fileSession, line);
      const model = context.model(typeof payload?.turn_id === "string" ? models.get(payload.turn_id) ?? currentModel : currentModel, line);
      const responseId = identifier(payload?.response_id);
      const id = isModern
        ? responseId ? `codex-${hash(sessionId, responseId)}` : context.fallbackId("codex", [sessionId, timestamp, raw, payload?.turn_id], false, line)
        : `codex-legacy-${hash(sessionId, reset, raw)}`;
      context.addUsage({ id, machineId: context.options.machine.id, provider: "codex", sessionId, timestamp, model, tokens: normalize(increment) }, line);
      if (raw.write) context.reportOnce("unpriced_cache_writes", "Codex cache writes are retained separately; unsupported write rates leave these records unpriced.", line);
    } else if (!["session_meta", "response_item", "event_msg", "compacted", "world_state", "retained_context", "realtime_item", "inter_agent_communication", "inter_agent_communication_metadata", "security_risk_score"].includes(String(entry.type))) {
      context.reportOnce("unsupported_records", "Unrecognized transcript records were ignored; supported usage and prompts were retained.", line);
    }
  }
}
