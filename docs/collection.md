# Collect from another machine

Install Node 24 and this repository's dependencies (`npm ci`) on the contributor's
machine. No provider API key is needed. Pick consistent member/machine labels;
changing attribution for the same machine ID creates a conflict rather than
silently moving another person's usage.

## PowerShell

```powershell
npm run collect -- --machine maya-laptop --member "Maya Chen" --label "Maya laptop" --claude-root "$env:USERPROFILE/.claude/projects" --codex-root "$env:USERPROFILE/.codex/sessions" --out exports/maya-usage.json
```

To include original human prompt text, add `--include-prompts`. For archived Codex
sessions add another `--codex-root` pointing to the chosen archived_sessions
directory. Set roots to smaller date/project folders for large histories.
`CLAUDE_CONFIG_DIR` and `CODEX_HOME` installations require their actual chosen
session directories; the collector does not guess or automatically scan them.

## macOS / Linux

```bash
npm run collect -- --machine maya-laptop --member "Maya Chen" --label "Maya laptop" --claude-root "$HOME/.claude/projects" --codex-root "$HOME/.codex/sessions" --out exports/maya-usage.json
```

The command prints safe diagnostic and record counts. It reads only supplied
roots, skips symlinks, and writes no model outputs. Existing output files are
preserved; use a new filename or explicitly `--force` to replace an export.
Files are local; send the resulting JSON to the team using your own chosen method.
The teammate opens **Data sources**, previews the file, then imports it.

## Coverage and limits

Use completed sessions for repeatable snapshots. Within a Claude file the latest
monotonic observation replaces earlier blocks. A later changed observation can
conflict with previously saved immutable usage; the current importer rejects that
change instead of silently changing accounting. Rescanning growing/live sessions
is a future spec. Do not assume reported usage equals a subscription bill.

Default exports contain usage only. Opt-in human prompts can contain secrets;
the product does not claim automatic redaction. Original prompts are available
only while retained in supported local JSONL; injected context, tool results,
compaction summaries, subagent inputs and model replies are excluded.

Limits: 20 MiB/file, 100 MiB/collection, 2,000 JSONL files, 10,000 visited entries,
20 levels of nesting, 20,000 records of each kind. Diagnostics are capped at 200.
Use `npm run collect -- --help` for actual supported flags. See
[provider coverage](providers.md) and [portable contract](data-contract.md).
