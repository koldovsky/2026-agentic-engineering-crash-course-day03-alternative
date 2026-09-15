import { estimateCost } from "./pricing";
import { tokenTotal, type Bundle, type Machine, type Provider, type Tokens, type UsageEvent } from "./schema";

export type UsageFilters = {
  provider?: Provider;
  member?: string;
  model?: string;
  /** Inclusive UTC calendar dates (YYYY-MM-DD). */
  from?: string;
  to?: string;
};

export type SummaryMetrics = {
  events: number;
  totalTokens: number;
  tokens: Tokens;
  /** Sum of priced records only; display with unpricedEvents/coverage. */
  estimatedCostUsd: number;
  pricedEvents: number;
  unpricedEvents: number;
  pricedTokens: number;
  unpricedTokens: number;
  /** Fraction of observed tokens with known prices; null for zero tokens. */
  pricingCoverage: number | null;
  sessions: number;
  members: number;
  machines: number;
};

export type SessionSummary = SummaryMetrics & {
  sessionId: string;
  machineId: string;
  machineLabel: string;
  member: string;
  provider: Provider;
  models: string[];
  firstAt: string;
  lastAt: string;
};

export type UsageSummary = {
  totals: SummaryMetrics;
  byDay: (SummaryMetrics & { date: string })[];
  byModel: (SummaryMetrics & { provider: Provider; model: string })[];
  byMember: (SummaryMetrics & { member: string })[];
  byProvider: (SummaryMetrics & { provider: Provider })[];
  recentSessions: SessionSummary[];
  /** Choices come from the full bundle so a filter can always be changed. */
  choices: { providers: Provider[]; members: string[]; models: string[] };
  filters: UsageFilters;
};

type Accumulator = Omit<SummaryMetrics, "sessions" | "members" | "machines" | "pricingCoverage"> & {
  sessionKeys: Set<string>;
  memberKeys: Set<string>;
  machineKeys: Set<string>;
};

function createAccumulator(): Accumulator {
  return {
    events: 0,
    totalTokens: 0,
    tokens: { input: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, output: 0, reasoning: 0 },
    estimatedCostUsd: 0,
    pricedEvents: 0,
    unpricedEvents: 0,
    pricedTokens: 0,
    unpricedTokens: 0,
    sessionKeys: new Set(),
    memberKeys: new Set(),
    machineKeys: new Set(),
  };
}

function sessionKey(event: UsageEvent): string {
  return JSON.stringify([event.machineId, event.provider, event.sessionId]);
}

function addEvent(target: Accumulator, event: UsageEvent, member: string, cost: number | null) {
  const total = tokenTotal(event.tokens);
  target.events += 1;
  target.totalTokens += total;
  for (const key of Object.keys(target.tokens) as (keyof Tokens)[]) {
    target.tokens[key] += event.tokens[key];
  }
  if (cost === null) {
    target.unpricedEvents += 1;
    target.unpricedTokens += total;
  } else {
    target.pricedEvents += 1;
    target.pricedTokens += total;
    target.estimatedCostUsd += cost;
  }
  target.sessionKeys.add(sessionKey(event));
  target.memberKeys.add(member);
  target.machineKeys.add(event.machineId);
}

function finish(target: Accumulator): SummaryMetrics {
  const { sessionKeys, memberKeys, machineKeys, ...metrics } = target;
  return {
    ...metrics,
    pricingCoverage: target.totalTokens === 0 ? null : target.pricedTokens / target.totalTokens,
    sessions: sessionKeys.size,
    members: memberKeys.size,
    machines: machineKeys.size,
  };
}

function accumulatorFor(map: Map<string, Accumulator>, key: string): Accumulator {
  let target = map.get(key);
  if (!target) {
    target = createAccumulator();
    map.set(key, target);
  }
  return target;
}

export function matchesUsageFilters(event: UsageEvent, machine: Machine, filters: UsageFilters): boolean {
  const date = event.timestamp.slice(0, 10);
  return (
    (!filters.provider || event.provider === filters.provider) &&
    (!filters.member || machine.member === filters.member) &&
    (!filters.model || event.model === filters.model) &&
    (!filters.from || date >= filters.from) &&
    (!filters.to || date <= filters.to)
  );
}

/** Server/CLI aggregation. Input is a validated, normalized bundle; prompts are never returned. */
export function summarize(bundle: Bundle, filters: UsageFilters = {}): UsageSummary {
  const machines = new Map(bundle.machines.map((machine) => [machine.id, machine]));
  const totals = createAccumulator();
  const days = new Map<string, Accumulator>();
  const models = new Map<string, Accumulator>();
  const members = new Map<string, Accumulator>();
  const providers = new Map<string, Accumulator>();
  const sessions = new Map<string, { metrics: Accumulator; detail: Omit<SessionSummary, keyof SummaryMetrics>; models: Set<string> }>();

  for (const event of bundle.usage) {
    const machine = machines.get(event.machineId);
    if (!machine) throw new Error("Usage references an undeclared machine.");
    if (!matchesUsageFilters(event, machine, filters)) continue;
    const cost = estimateCost(event);
    const key = sessionKey(event);
    let session = sessions.get(key);
    if (!session) {
      session = {
        metrics: createAccumulator(),
        detail: {
          sessionId: event.sessionId,
          machineId: machine.id,
          machineLabel: machine.label,
          member: machine.member,
          provider: event.provider,
          models: [],
          firstAt: event.timestamp,
          lastAt: event.timestamp,
        },
        models: new Set(),
      };
      sessions.set(key, session);
    }
    session.models.add(event.model);
    if (event.timestamp < session.detail.firstAt) session.detail.firstAt = event.timestamp;
    if (event.timestamp > session.detail.lastAt) session.detail.lastAt = event.timestamp;
    for (const target of [
      totals,
      accumulatorFor(days, event.timestamp.slice(0, 10)),
      accumulatorFor(models, JSON.stringify([event.provider, event.model])),
      accumulatorFor(members, machine.member),
      accumulatorFor(providers, event.provider),
      session.metrics,
    ]) {
      addEvent(target, event, machine.member, cost);
    }
  }

  return {
    totals: finish(totals),
    byDay: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, metrics]) => ({ date, ...finish(metrics) })),
    byModel: [...models].map(([key, metrics]) => {
      const [provider, model] = JSON.parse(key) as [Provider, string];
      return { provider, model, ...finish(metrics) };
    }).sort((a, b) => b.totalTokens - a.totalTokens || a.model.localeCompare(b.model)),
    byMember: [...members].map(([member, metrics]) => ({ member, ...finish(metrics) }))
      .sort((a, b) => b.totalTokens - a.totalTokens || a.member.localeCompare(b.member)),
    byProvider: [...providers].map(([provider, metrics]) => ({ provider: provider as Provider, ...finish(metrics) }))
      .sort((a, b) => b.totalTokens - a.totalTokens || a.provider.localeCompare(b.provider)),
    recentSessions: [...sessions.values()].map(({ detail, metrics, models: sessionModels }) => ({
      ...detail, ...finish(metrics), models: [...sessionModels].sort(),
    })).sort((a, b) => b.lastAt.localeCompare(a.lastAt) || a.sessionId.localeCompare(b.sessionId)).slice(0, 20),
    choices: {
      providers: [...new Set(bundle.usage.map((event) => event.provider))].sort(),
      members: [...new Set(bundle.usage.map((event) => machines.get(event.machineId)!.member))].sort(),
      models: [...new Set(bundle.usage.map((event) => event.model))].sort(),
    },
    filters: { ...filters },
  };
}
