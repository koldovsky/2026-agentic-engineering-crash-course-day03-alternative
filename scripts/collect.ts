import { parseArgs } from "node:util";
import { join } from "node:path";
import { collect, writeBundle } from "../src/lib/collector";
import { MachineSchema, type Provider } from "../src/lib/schema";

async function main() {
  const { values } = parseArgs({ options: {
    help: { type: "boolean", short: "h" },
    "claude-root": { type: "string", multiple: true },
    "codex-root": { type: "string", multiple: true },
    machine: { type: "string" }, member: { type: "string" }, label: { type: "string" },
    out: { type: "string" }, "include-prompts": { type: "boolean" }, force: { type: "boolean" },
  } });
  if (values.help) {
    console.log(`Token Atlas — explicit local collection (Node24)

npm run collect -- --machine maya-laptop --member "Maya" --label "Maya laptop" \\
  --claude-root <chosen-projects-directory> --codex-root <chosen-sessions-directory>

Required: --machine stable-id --member name, and at least one provider root.
Optional: --label name (defaults to machine ID), --out exports/file.json,
          --include-prompts (human text only; excluded by default), --force.
Roots may be repeated. Use completed sessions; changed records can conflict.
No data is sent over the network. Import the generated JSON file in the dashboard.
Limits: 20 MiB/file, 100 MiB/scan, 2,000 files, 20,000 records of each kind.
Existing export files are preserved unless --force is explicitly supplied.`);
    return;
  }
  const machine = MachineSchema.safeParse({ id: values.machine, member: values.member, label: values.label ?? values.machine });
  if (!machine.success) throw new Error("Provide --machine (stable identifier) and --member. Run --help for usage.");
  const roots: { provider: Provider; path: string }[] = [
    ...(values["claude-root"] ?? []).map((path) => ({ provider: "claude-code" as const, path })),
    ...(values["codex-root"] ?? []).map((path) => ({ provider: "codex" as const, path })),
  ];
  if (!roots.length) throw new Error("Choose --claude-root or --codex-root explicitly. No directories were scanned.");
  const result = await collect({ roots, machine: machine.data, includePrompts: values["include-prompts"] });
  const output = values.out ?? join("exports", `${machine.data.id}-${Date.now()}.json`);
  await writeBundle(output, result.bundle, values.force);
  console.log(`Saved ${result.bundle.usage.length} usage records and ${result.bundle.prompts.length} prompts from ${result.filesRead} files to ${output}.`);
  console.log(`${result.duplicates} duplicates skipped. ${result.diagnostics.length} diagnostics (up to 200 shown).`);
  for (const diagnostic of result.diagnostics) console.log(`- ${diagnostic.code}: ${diagnostic.message}`);
  if (!result.filesRead) process.exitCode = 2;
}

main().catch((error: unknown) => {
  if (error instanceof Error && "code" in error && error.code === "EEXIST") {
    console.error("Export already exists. Choose a different --out path or explicitly pass --force.");
  } else console.error(error instanceof Error ? error.message : "Collection failed.");
  process.exitCode = 1;
});
