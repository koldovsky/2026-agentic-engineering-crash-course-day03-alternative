// Node-only query services. Keep SQLite and prompt datasets outside client bundles.
import { z } from "zod";
import type { UsageFilters } from "./aggregate";
import { makeDemoBundle } from "./demo";
import { ProviderSchema, type Bundle, type Machine, type PromptEvent, type Provider } from "./schema";
import { withLedger } from "./storage";
import { withDisplayNames, type DisplayBundle, type MachineDisplayDetails } from "./display-names";

export type Source = "local" | "demo";
export type ParsedQuery = { source: Source; filters: UsageFilters; q: string; page: number };
export type PromptItem = PromptEvent & { member: string; machineLabel: string };
export type PromptPage = { items: PromptItem[]; total: number; page: number; pageSize: 20; totalPages: number };
export type MachineSummary = Machine & MachineDisplayDetails & { usage: number; sessions: number; providers: Provider[]; lastAt: string | null };

const QuerySchema = z.object({
  source: z.enum(["local", "demo"]),
  provider: ProviderSchema.optional(),
  member: z.string().max(100).optional(),
  model: z.string().max(120).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  q: z.string().max(200).transform((value) => value.trim()),
  page: z.string().regex(/^[1-9]\d*$/).max(4).transform(Number).pipe(z.number().int().min(1).max(1000)),
}).refine(({ from, to }) => !from || !to || from <= to, {
  message: "The start date must be on or before the end date.", path: ["from"],
});

/** Shared boundary for API routes and server pages. Unrelated navigation keys are ignored. */
export function parseQuery(params: URLSearchParams): ParsedQuery {
  const optional = (key: string) => params.get(key) || undefined;
  const { source, q, page, ...filters } = QuerySchema.parse({
    source: params.get("source") ?? "local",
    provider: optional("provider"),
    member: optional("member"),
    model: optional("model"),
    from: optional("from"),
    to: optional("to"),
    q: params.get("q") ?? "",
    page: params.get("page") ?? "1",
  });
  return { source, filters, q, page };
}

export function getBundle(source: Source, includePrompts = false): Bundle {
  if (source === "local") return withLedger((ledger) => ledger.read(includePrompts));
  const bundle = makeDemoBundle();
  if (!includePrompts) bundle.prompts = [];
  return bundle;
}

/** UI names are local preferences; getBundle remains the canonical transfer source. */
export function getDisplayBundle(source: Source, includePrompts = false): DisplayBundle {
  if (source === "local") return withLedger((ledger) =>
    withDisplayNames(ledger.read(includePrompts), ledger.readDisplayNames()));
  return withDisplayNames(getBundle(source, includePrompts));
}

function sessionKey(record: { machineId: string; provider: Provider; sessionId: string }): string {
  return JSON.stringify([record.machineId, record.provider, record.sessionId]);
}

/** Search only stored human text. Model filters identify sessions, not a prompt's authoring model. */
export function queryPrompts(bundle: Bundle, query: ParsedQuery): PromptPage {
  const { filters, q } = query;
  const needle = q.toLocaleLowerCase();
  const machines = new Map(bundle.machines.map((machine) => [machine.id, machine]));
  const modelSessions = filters.model
    ? new Set(bundle.usage.filter((event) => event.model === filters.model).map(sessionKey))
    : null;
  const matches = bundle.prompts.filter((prompt) => {
    const machine = machines.get(prompt.machineId);
    if (!machine) throw new Error("Prompt references an undeclared machine.");
    const date = prompt.timestamp.slice(0, 10);
    return (
      (!filters.provider || prompt.provider === filters.provider) &&
      (!filters.member || machine.member === filters.member) &&
      (!filters.from || date >= filters.from) &&
      (!filters.to || date <= filters.to) &&
      (!modelSessions || modelSessions.has(sessionKey(prompt))) &&
      (!needle || prompt.text.toLocaleLowerCase().includes(needle))
    );
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp) || a.machineId.localeCompare(b.machineId)
    || a.provider.localeCompare(b.provider) || a.id.localeCompare(b.id));

  const pageSize = 20;
  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(query.page, totalPages));
  const items = matches.slice((page - 1) * pageSize, page * pageSize).map((prompt) => {
    const machine = machines.get(prompt.machineId)!;
    return { ...prompt, member: machine.member, machineLabel: machine.label };
  });
  return { items, total, page, pageSize, totalPages };
}

/** Usage-derived machine summaries deliberately omit prompt counts. */
export function queryMachines(bundle: Bundle & Partial<Pick<DisplayBundle, "machineDisplayDetails">>): MachineSummary[] {
  const machines = new Map(bundle.machines.map((machine) => [machine.id, {
    machine, usage: 0, sessions: new Set<string>(), providers: new Set<Provider>(), lastAt: null as string | null,
  }]));
  for (const event of bundle.usage) {
    const summary = machines.get(event.machineId);
    if (!summary) throw new Error("Usage references an undeclared machine.");
    summary.usage += 1;
    summary.sessions.add(sessionKey(event));
    summary.providers.add(event.provider);
    if (!summary.lastAt || event.timestamp > summary.lastAt) summary.lastAt = event.timestamp;
  }
  return [...machines.values()].map(({ machine, usage, sessions, providers, lastAt }) => ({
    ...machine, usage, sessions: sessions.size, providers: [...providers].sort(), lastAt,
    ...(bundle.machineDisplayDetails?.get(machine.id) ?? {
      importedMember: machine.member, importedLabel: machine.label, hasDisplayOverride: false,
    }),
  })).sort((a, b) => a.member.localeCompare(b.member) || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}
