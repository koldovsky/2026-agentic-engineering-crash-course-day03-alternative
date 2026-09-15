import type { Bundle } from "./schema";
export const sample: Bundle = {
  schemaVersion: 1, exportedAt: "2026-09-15T00:00:00.000Z",
  machines: [{ id: "m1", label: "Laptop", member: "Alex" }],
  usage: [{ id: "u1", machineId: "m1", provider: "codex", sessionId: "s1", timestamp: "2026-09-14T12:00:00.000Z", model: "gpt-5.4", tokens: { input: 100, cacheRead: 40, cacheWrite: 10, cacheWrite1h: 5, output: 20, reasoning: 12 } }],
  prompts: [{ id: "p1", machineId: "m1", provider: "codex", sessionId: "s1", timestamp: "2026-09-14T12:00:00.000Z", text: "Test human prompt" }],
};

