// Seeds one plausible behavioural failure for the breaker demo: a mistyped output rate,
// the kind of slip a real "tariff update" makes. It is not a syntax error, so lint and
// typecheck stay green and only the pricing test turns red.
//   node scripts/seed-failure.mjs            apply
//   node scripts/seed-failure.mjs --revert   undo
import { readFileSync, writeFileSync } from "node:fs";

const file = "src/lib/pricing.ts";
const good = 'claudeRate("claude-sonnet-4-6", 3, 15)';
const bad = 'claudeRate("claude-sonnet-4-6", 3, 16)';
const [from, to] = process.argv.includes("--revert") ? [bad, good] : [good, bad];

const source = readFileSync(file, "utf8");
if (!source.includes(from)) {
  console.error(`${file}: не знайдено ${from} — поломку вже застосовано або файл змінено`);
  process.exit(1);
}
writeFileSync(file, source.replace(from, to));
console.log(`${file}: ${from} → ${to}`);
