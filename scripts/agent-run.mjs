// Bounded agent run: a breaker the agent can neither see nor change.
// Limits come only from docs/run-budget.md; "red" means a non-zero exit of `npm run check`.
//
//   node scripts/agent-run.mjs            real run: Claude Code in print mode
//   node scripts/agent-run.mjs --dry-run  the agent is replaced by a no-op, so the breaker
//                                          can be proven without a model or an account
//
// Exit codes: 0 green · 1 a limit stopped the run · 2 the run could not start or was tampered with.
// Every stop appends one line to exports/day05-breaker.log (ignored by git, so it survives a rollback).
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const WIN = process.platform === "win32";
const LOG = "exports/day05-breaker.log";
const DRY = process.argv.includes("--dry-run");
const PROTECTED = ["docs/run-budget.md", "docs/run-task.md", "scripts/agent-run.mjs"];
const IS_TEST = /\.test\.[cm]?[jt]sx?$/;
// What decides "red": the rules, this file, every test, fixture and OpenSpec contract.
const isProtected = (f) => PROTECTED.includes(f) || IS_TEST.test(f) || /(^|\/)fixtures?\//.test(f) || /fixtures?\./.test(f) || f.startsWith("openspec/");

const started = Date.now();
let budget = {};
let attempt = 0;
let spent = 0;

function stop(reason, code) {
  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  const line = `${new Date().toISOString()} stop=${reason} attempt=${attempt}/${budget.attempts ?? "?"} minutes=${minutes} spent=$${spent.toFixed(2)} dry=${DRY} exit=${code}`;
  mkdirSync("exports", { recursive: true });
  appendFileSync(LOG, line + "\n");
  console.log(`breaker: ${line}`);
  process.exit(code);
}

const git = (...args) => spawnSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const lines = (text) => (text ?? "").split(/\r?\n/).filter(Boolean);

// Anything the agent did to the working tree, including new files, but not ignored ones.
function fingerprint() {
  return createHash("sha256")
    .update(git("diff", "HEAD").stdout ?? "")
    .update("\0")
    .update(git("status", "--porcelain", "--untracked-files=all").stdout ?? "")
    .digest("hex");
}

// The definition of "red" must stay the committed one.
const tampered = () => lines(git("diff", "--name-only", "HEAD").stdout).filter(isProtected);

// npm and claude may be .cmd shims on Windows, which Node will not spawn without a shell.
// The command lines below are fixed text from this file; the task text reaches the agent through
// stdin and never passes through the shell.
function checkIsGreen(n) {
  const r = spawnSync("npm run check", { shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  writeFileSync(`exports/day05-check-${n}.log`, `${r.stdout ?? ""}${r.stderr ?? ""}`);
  return r.status === 0;
}

function runAgent(prompt, usdLeft, msLeft) {
  return new Promise((resolve) => {
    const cmd = `claude -p --output-format json --permission-mode acceptEdits --max-budget-usd ${usdLeft.toFixed(2)}`;
    const child = spawn(cmd, { shell: true, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => {
      // On Windows the shell's child would outlive a plain kill, so end the whole process tree.
      if (WIN) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
      else child.kill("SIGTERM");
      resolve({ timedOut: true, out, err });
    }, msLeft);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, out, err });
    });
    child.stdin.end(prompt);
  });
}

function costOf(stdout) {
  try {
    const result = JSON.parse(lines(stdout).at(-1));
    return Number(result.total_cost_usd) || 0;
  } catch {
    return null;
  }
}

// ---- preconditions: the harness itself must be committed and untouched ----
if (git("rev-parse", "--is-inside-work-tree").status !== 0) stop("not-a-git-repo", 2);
budget = Object.fromEntries(
  [...readFileSync("docs/run-budget.md", "utf8").matchAll(/^- (\w+): (\d+(?:\.\d+)?)[ \t]*\r?$/gm)].map(([, k, v]) => [k, Number(v)]),
);
for (const key of ["attempts", "minutes", "usd", "stall"]) if (!(budget[key] > 0)) stop(`bad-budget:${key}`, 2);
const uncommitted = PROTECTED.filter((f) => git("ls-files", "--error-unmatch", f).status !== 0);
if (uncommitted.length) {
  console.log(`спершу закомітьте запобіжник: ${uncommitted.join(", ")}`);
  stop("harness-not-committed", 2);
}
if (tampered().length) {
  console.log(`змінено до старту: ${tampered().join(", ")}`);
  stop("tamper", 2);
}

const task = readFileSync("docs/run-task.md", "utf8");
const deadline = started + budget.minutes * 60_000;
let stalled = 0;
mkdirSync("exports", { recursive: true });
console.log(`budget: attempts=${budget.attempts} minutes=${budget.minutes} usd=${budget.usd} stall=${budget.stall}${DRY ? " · dry-run: агента не викликаємо" : ""}`);

while (true) {
  if (attempt >= budget.attempts) stop("attempts", 1);
  if (Date.now() >= deadline) stop("deadline", 1);
  // Whole cents left; the only numbers here are unit conversions, the limits come from the budget file.
  const usdLeft = Math.floor((budget.usd - spent) * 100) / 100;
  if (!DRY && usdLeft <= 0) stop("usd", 1);
  attempt++;
  const before = fingerprint();

  if (!DRY) {
    const r = await runAgent(task, usdLeft, deadline - Date.now());
    if (r.timedOut) stop("deadline", 1);
    if (/not recognized|command not found|ENOENT/i.test(r.err)) stop("agent-missing", 2);
    const cost = costOf(r.out);
    if (cost === null) console.log(`attempt ${attempt}: агент не повернув JSON-результат (exit ${r.code})`);
    else spent += cost;
  }

  const hit = tampered();
  if (hit.length) {
    console.log(`агент змінив захищене: ${hit.join(", ")}`);
    stop("tamper", 2);
  }
  const changed = fingerprint() !== before;
  const green = checkIsGreen(attempt);
  console.log(`attempt ${attempt}/${budget.attempts}: npm run check → ${green ? "green" : "red"} · зміни агента: ${changed ? "так" : "ні"} · exports/day05-check-${attempt}.log`);
  if (green) stop("green", 0);
  stalled = changed ? 0 : stalled + 1;
  if (stalled >= budget.stall) stop("stall", 1);
}
