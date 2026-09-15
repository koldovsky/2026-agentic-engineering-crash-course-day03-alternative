import { z } from "zod";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_RECORDS = 20_000;
const id = z.string().min(1).max(192).regex(/^[A-Za-z0-9][A-Za-z0-9._:@-]*$/);
const label = z.string().trim().min(1).max(100).regex(/^[^\x00-\x1f\x7f]+$/);
// Keeps worst-case sums across 20,000 records below Number.MAX_SAFE_INTEGER.
const count = z.number().int().min(0).max(1_000_000_000);
export const ProviderSchema = z.enum(["claude-code", "codex"]);
export const TokensSchema = z.strictObject({
  input: count, cacheRead: count, cacheWrite: count, cacheWrite1h: count,
  output: count, reasoning: count,
}).refine((tokens) => tokens.reasoning <= tokens.output, "Reasoning is part of output.");
export const MachineSchema = z.strictObject({ id, label, member: label });
const common = {
  id, machineId: id, provider: ProviderSchema, sessionId: id,
  timestamp: z.iso.datetime(),
};
export const UsageEventSchema = z.strictObject({
  ...common, model: z.string().min(1).max(120), tokens: TokensSchema,
});
export const PromptEventSchema = z.strictObject({
  ...common, text: z.string().min(1).max(100_000),
});
export const BundleSchema = z.strictObject({
  schemaVersion: z.literal(1), exportedAt: z.iso.datetime(),
  machines: z.array(MachineSchema).max(100),
  usage: z.array(UsageEventSchema).max(MAX_RECORDS),
  prompts: z.array(PromptEventSchema).max(MAX_RECORDS),
}).superRefine((bundle, ctx) => {
  const machines = new Set(bundle.machines.map((machine) => machine.id));
  if (machines.size !== bundle.machines.length) {
    ctx.addIssue({ code: "custom", message: "Duplicate machine IDs." });
  }
  for (const record of [...bundle.usage, ...bundle.prompts]) {
    if (!machines.has(record.machineId)) {
      ctx.addIssue({ code: "custom", message: "Record references an undeclared machine." });
      break;
    }
  }
});

export type Provider = z.infer<typeof ProviderSchema>;
export type Tokens = z.infer<typeof TokensSchema>;
export type Machine = z.infer<typeof MachineSchema>;
export type UsageEvent = z.infer<typeof UsageEventSchema>;
export type PromptEvent = z.infer<typeof PromptEventSchema>;
export type Bundle = z.infer<typeof BundleSchema>;

export function tokenTotal(tokens: Tokens): number {
  return tokens.input + tokens.cacheRead + tokens.cacheWrite + tokens.cacheWrite1h + tokens.output;
}

export function emptyBundle(): Bundle {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), machines: [], usage: [], prompts: [] };
}

export function recordKey(record: UsageEvent | PromptEvent): string {
  return JSON.stringify([record.machineId, record.provider, record.id]);
}
