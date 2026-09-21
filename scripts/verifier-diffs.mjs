// Writes the two inputs for the verifier step, without any shell redirection:
//   exports/day05.diff          the breaker and its spec as committed
//   exports/day05-control.diff  the same diff with the fixtures/openspec guard removed —
//                               a negative control the verifier must flag as "not enforced"
// Usage: node scripts/verifier-diffs.mjs [base=workshop-day04-start]
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.argv[2] || "workshop-day04-start";
const paths = ["docs/run-budget.md", "docs/run-task.md", "scripts/agent-run.mjs"];
const r = spawnSync("git", ["diff", `${base}..HEAD`, "--", ...paths], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
if (r.status !== 0) {
  console.error(r.stderr);
  process.exit(1);
}

const guard = String.raw` || /(^|\/)fixtures?\//.test(f) || /fixtures?\./.test(f) || f.startsWith("openspec/")`;
if (!r.stdout.includes(guard)) {
  console.error("не знайдено рядок захисту в diff — scripts/agent-run.mjs змінено?");
  process.exit(1);
}

mkdirSync("exports", { recursive: true });
writeFileSync("exports/day05.diff", r.stdout);
writeFileSync("exports/day05-control.diff", r.stdout.replace(guard, ""));
console.log(`exports/day05.diff — ${r.stdout.split("\n").length} рядків`);
console.log("exports/day05-control.diff — той самий diff без захисту фікстур і openspec/");
