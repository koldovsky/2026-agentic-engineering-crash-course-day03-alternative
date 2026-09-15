import { describe, expect, it } from "vitest";
import { summarize } from "./aggregate";
import type { Bundle, UsageEvent } from "./schema";

function event(id: string, overrides: Partial<UsageEvent> = {}): UsageEvent {
  return {
    id, machineId: "one", provider: "claude-code", sessionId: "shared-session",
    timestamp: "2026-09-10T00:00:00.000Z", model: "claude-sonnet-4-6",
    tokens: { input: 100, cacheRead: 40, cacheWrite: 10, cacheWrite1h: 5, output: 20, reasoning: 12 },
    ...overrides,
  };
}

function bundle(usage: UsageEvent[]): Bundle {
  return {
    schemaVersion: 1, exportedAt: "2026-09-15T00:00:00.000Z",
    machines: [
      { id: "one", label: "Laptop", member: "Maya" },
      { id: "two", label: "Desktop", member: "Maya" },
      { id: "three", label: "Workstation", member: "Alex" },
    ],
    usage,
    prompts: [{ id: "private-prompt", machineId: "one", provider: "claude-code", sessionId: "shared-session", timestamp: "2026-09-10T00:00:00.000Z", text: "Private synthetic prompt." }],
  };
}

describe("filtered usage summary", () => {
  it("uses every selected filter for totals, trends, models, members, and sessions", () => {
    const source = bundle([
      event("start"),
      event("end", { timestamp: "2026-09-12T23:59:59.999Z" }),
      event("before", { timestamp: "2026-09-09T23:59:59.999Z" }),
      event("after", { timestamp: "2026-09-13T00:00:00.000Z" }),
      event("provider", { provider: "codex" }),
      event("model", { model: "claude-opus-4-6" }),
      event("member", { machineId: "three" }),
    ]);
    const result = summarize(source, { provider: "claude-code", member: "Maya", model: "claude-sonnet-4-6", from: "2026-09-10", to: "2026-09-12" });
    expect(result.totals.events).toBe(2);
    expect(result.totals.totalTokens).toBe(350);
    expect(result.byDay.map(({ date }) => date)).toEqual(["2026-09-10", "2026-09-12"]);
    for (const groups of [result.byDay, result.byModel, result.byMember, result.byProvider]) {
      expect(groups.reduce((sum, group) => sum + group.totalTokens, 0)).toBe(350);
      expect(groups.reduce((sum, group) => sum + group.estimatedCostUsd, 0)).toBeCloseTo(result.totals.estimatedCostUsd);
    }
    expect(result.byMember.map(({ member }) => member)).toEqual(["Maya"]);
    expect(result.byModel.map(({ model }) => model)).toEqual(["claude-sonnet-4-6"]);
    expect(result.recentSessions).toHaveLength(1);
    expect(result.recentSessions[0]).toMatchObject({ firstAt: "2026-09-10T00:00:00.000Z", lastAt: "2026-09-12T23:59:59.999Z", events: 2 });
    expect(result.choices.members).toEqual(["Alex", "Maya"]);
    expect(JSON.stringify(result)).not.toContain("Private synthetic prompt");
  });

  it("keeps unknown usage in totals while reporting the unpriced portion", () => {
    const result = summarize(bundle([event("known"), event("unknown", { model: "future-model" })]));
    expect(result.totals).toMatchObject({ totalTokens: 350, pricedTokens: 175, unpricedTokens: 175, pricedEvents: 1, unpricedEvents: 1, pricingCoverage: 0.5 });
    expect(result.totals.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.byModel.find(({ model }) => model === "future-model")).toMatchObject({ totalTokens: 175, unpricedEvents: 1, pricedEvents: 0 });
  });

  it("identifies sessions by machine and provider and members by attribution", () => {
    const result = summarize(bundle([
      event("a"), event("b"),
      event("c", { machineId: "two" }),
      event("d", { provider: "codex", model: "gpt-5.4" }),
    ]));
    expect(result.totals).toMatchObject({ events: 4, sessions: 3, machines: 2, members: 1 });
    expect(result.recentSessions).toHaveLength(3);
  });

  it("returns honest zero totals and no demo replacement for empty matches", () => {
    const result = summarize(bundle([event("a")]), { member: "Nobody" });
    expect(result.totals).toMatchObject({ events: 0, totalTokens: 0, estimatedCostUsd: 0, sessions: 0, members: 0, pricingCoverage: null });
    expect(result.byDay).toEqual([]);
    expect(result.recentSessions).toEqual([]);
  });

  it("limits recent sessions to the twenty newest without limiting aggregate totals", () => {
    const result = summarize(bundle(Array.from({ length: 25 }, (_, index) => event(`event-${index}`, {
      sessionId: `session-${index}`, timestamp: new Date(Date.UTC(2026, 8, 1, index)).toISOString(),
    }))));
    expect(result.totals.sessions).toBe(25);
    expect(result.recentSessions).toHaveLength(20);
    expect(result.recentSessions[0].sessionId).toBe("session-24");
  });
});
