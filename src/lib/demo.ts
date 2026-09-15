import type { Bundle, Machine, PromptEvent, Provider, UsageEvent } from "./schema";

export const DEMO_LABEL = "Synthetic demo";
export const DEMO_END_DATE = "2026-09-15";

const promptExamples = [
  "Write acceptance scenarios for importing a teammate's token usage file.",
  "Implement the dashboard date filter using inclusive UTC days.",
  "Review the pricing calculation and ensure reasoning is counted once.",
  "Add a keyboard-accessible empty state with an import action.",
  "Explain how the current OpenSpec change maps to our product requirements.",
  "Refactor the export flow so prompt sharing is an explicit choice.",
  "Create synthetic fixtures for a Codex session with cached input tokens.",
  "Check the mobile layout and fix any horizontal page overflow.",
  "Add a regression test for an unknown model that retains its usage.",
  "Summarize the verified implementation steps for our workshop guide.",
  "Improve the member breakdown table while keeping data on the server.",
  "Verify that importing an identical bundle does not duplicate records.",
];

/** Reproducible fictional records. Calling this function never opens or seeds a database. */
export function makeDemoBundle(): Bundle {
  const machines: Machine[] = [
    { id: "demo-maya-laptop", label: "Maya · MacBook", member: "Maya Chen" },
    { id: "demo-alex-desktop", label: "Alex · Desktop", member: "Alex Rivera" },
    { id: "demo-noah-laptop", label: "Noah · ThinkPad", member: "Noah Williams" },
    { id: "demo-sofia-laptop", label: "Sofia · MacBook", member: "Sofia Kovalenko" },
    { id: "demo-maya-desktop", label: "Maya · Studio", member: "Maya Chen" },
  ];
  const usage: UsageEvent[] = [];
  const prompts: PromptEvent[] = [];
  const claudeModels = ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5"];
  const codexModels = ["gpt-5.3-codex", "gpt-5.4", "gpt-5.5"];
  const firstDay = Date.UTC(2026, 8, 2);

  for (let day = 0; day < 14; day += 1) {
    for (let sessionIndex = 0; sessionIndex < 3; sessionIndex += 1) {
      const machine = machines[(day + sessionIndex) % machines.length];
      const provider: Provider = (day + sessionIndex) % 2 === 0 ? "claude-code" : "codex";
      const sessionId = `demo-session-${day + 1}-${sessionIndex + 1}`;
      const models = provider === "claude-code" ? claudeModels : codexModels;
      const model = day === 12 && sessionIndex === 1 ? "experimental-unpriced-model" : models[(day + sessionIndex * 2) % models.length];

      for (let turn = 0; turn < 2; turn += 1) {
        const sequence = day * 6 + sessionIndex * 2 + turn;
        const timestamp = new Date(firstDay + day * 86_400_000 + (9 + sessionIndex * 3) * 3_600_000 + turn * 11 * 60_000).toISOString();
        const scale = 1 + ((sequence * 13) % 17) / 10;
        const output = Math.round((1_100 + (sequence % 5) * 420) * scale);
        usage.push({
          id: `demo-usage-${sequence + 1}`,
          machineId: machine.id,
          provider,
          sessionId,
          timestamp,
          model,
          tokens: {
            input: Math.round((5_000 + (sequence % 7) * 2_300) * scale),
            cacheRead: Math.round((18_000 + (sequence % 9) * 7_600) * scale),
            cacheWrite: provider === "claude-code" ? Math.round((1_200 + (sequence % 4) * 800) * scale) : 0,
            cacheWrite1h: provider === "claude-code" && turn === 0 ? 2_000 + day * 100 : 0,
            output,
            reasoning: provider === "codex" ? Math.round(output * 0.55) : 0,
          },
        });
        prompts.push({
          id: `demo-prompt-${sequence + 1}`,
          machineId: machine.id,
          provider,
          sessionId,
          timestamp,
          text: promptExamples[sequence % promptExamples.length],
        });
      }
    }
  }

  return { schemaVersion: 1, exportedAt: "2026-09-15T18:00:00.000Z", machines, usage, prompts };
}
