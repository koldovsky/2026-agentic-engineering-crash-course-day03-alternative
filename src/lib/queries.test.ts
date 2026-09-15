import { describe, expect, it } from "vitest";
import { summarize } from "./aggregate";
import { getBundle, parseQuery, queryMachines, queryPrompts } from "./queries";
import type { Bundle } from "./schema";
import { sample } from "./test-fixtures";

describe("validated local queries", () => {
  it("defaults to local and rejects unsupported sources, filters, invalid dates and pagination", () => {
    expect(parseQuery(new URLSearchParams("view=prompts"))).toMatchObject({ source: "local", q: "", page: 1 });
    expect(parseQuery(new URLSearchParams("from=2024-02-29&to=2024-02-29&provider=codex&page=1000"))).toMatchObject({ filters: { from: "2024-02-29", to: "2024-02-29", provider: "codex" }, page: 1000 });
    for (const invalid of [
      "source=remote", "provider=other", "from=2026-02-29", "from=2026-09-31", "from=2026-9-01",
      "from=2026-09-10&to=2026-09-09", "page=0", "page=1.5", "page=1001", "page=NaN",
      `member=${"x".repeat(101)}`, `model=${"x".repeat(121)}`, `q=${"x".repeat(201)}`,
    ]) expect(() => parseQuery(new URLSearchParams(invalid))).toThrow();
  });

  it("searches case-insensitively with combined provider/member/UTC filters and machine context", () => {
    const bundle: Bundle = structuredClone(sample);
    bundle.machines.push({ id: "m2", label: "Desktop", member: "Maya" });
    bundle.prompts = [
      { ...sample.prompts[0], id: "first", text: "Review the PRICING scenario", timestamp: "2026-09-10T00:00:00.000Z" },
      { ...sample.prompts[0], id: "last", text: "Implement pricing", timestamp: "2026-09-12T23:59:59.999Z" },
      { ...sample.prompts[0], id: "wrong-member", machineId: "m2", text: "pricing", timestamp: "2026-09-11T00:00:00.000Z" },
      { ...sample.prompts[0], id: "wrong-provider", provider: "claude-code", text: "pricing", timestamp: "2026-09-11T00:00:00.000Z" },
      { ...sample.prompts[0], id: "too-late", text: "pricing", timestamp: "2026-09-13T00:00:00.000Z" },
      { ...sample.prompts[0], id: "wrong-text", text: "Layout", timestamp: "2026-09-11T00:00:00.000Z" },
    ];
    const query = parseQuery(new URLSearchParams("q=pricing&provider=codex&member=Alex&from=2026-09-10&to=2026-09-12"));
    const result = queryPrompts(bundle, query);
    expect(result.total).toBe(2);
    expect(result.items.map(({ id }) => id)).toEqual(["last", "first"]);
    expect(result.items[0]).toMatchObject({ member: "Alex", machineLabel: "Laptop", sessionId: "s1" });
    expect(JSON.stringify(summarize(bundle))).not.toContain("PRICING scenario");
  });

  it("limits pages to twenty and clamps stale page numbers, including empty results", () => {
    const bundle = structuredClone(sample);
    bundle.prompts = Array.from({ length: 45 }, (_, index) => ({
      ...sample.prompts[0], id: `prompt-${index}`, timestamp: new Date(Date.UTC(2026, 8, 1, index)).toISOString(),
    }));
    const first = queryPrompts(bundle, parseQuery(new URLSearchParams()));
    expect(first.items).toHaveLength(20);
    expect(first).toMatchObject({ total: 45, page: 1, pageSize: 20, totalPages: 3 });
    const last = queryPrompts(bundle, parseQuery(new URLSearchParams("page=99")));
    expect(last).toMatchObject({ total: 45, page: 3, totalPages: 3 });
    expect(last.items).toHaveLength(5);
    expect(queryPrompts(bundle, parseQuery(new URLSearchParams("q=absent&page=99")))).toMatchObject({ items: [], total: 0, page: 1, totalPages: 1 });
  });

  it("matches model filters by machine/provider/session and counts machine sessions correctly", () => {
    const bundle = structuredClone(sample);
    bundle.machines.push({ id: "m2", label: "Desktop", member: "Maya" });
    bundle.usage.push({ ...sample.usage[0], id: "u2", provider: "claude-code", model: "claude-sonnet-4-6" });
    bundle.prompts.push(
      { ...sample.prompts[0], id: "other-machine", machineId: "m2" },
      { ...sample.prompts[0], id: "other-provider", provider: "claude-code" },
    );
    expect(queryPrompts(bundle, parseQuery(new URLSearchParams("model=gpt-5.4"))).items.map(({ id }) => id)).toEqual(["p1"]);
    const machines = queryMachines(bundle);
    expect(machines[0]).toMatchObject({ id: "m1", usage: 2, sessions: 2, providers: ["claude-code", "codex"], lastAt: sample.usage[0].timestamp });
    expect(machines[1]).toMatchObject({ id: "m2", usage: 0, sessions: 0, lastAt: null });
    expect(machines[0]).not.toHaveProperty("prompts");
  });

  it("keeps demo prompt inclusion explicit and does not mutate future demo reads", () => {
    expect(getBundle("demo").prompts).toEqual([]);
    expect(getBundle("demo", true).prompts).toHaveLength(84);
    expect(getBundle("demo").usage).toHaveLength(84);
  });
});
