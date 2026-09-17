# Import from this computer or another machine

## One click on this computer

Open **Data sources → Import from this computer**. Both Claude Code and Codex are
selected with visible suggested folders. Click the button once to collect usage
and save it in the local dashboard; no terminal command or file chooser is needed.
Loading the page only prepares settings and does not scan directories.

The defaults use `CLAUDE_CONFIG_DIR/projects` or `~/.claude/projects`, and
`CODEX_HOME/sessions` or `~/.codex/sessions`. The computer running Token Atlas must
also contain the logs. Under **Names and folders**, adjust attribution or select a
smaller absolute project/date folder. To read archived Codex sessions, change the
Codex folder to the chosen `archived_sessions` directory. Network paths are not
supported. Deselect a provider you do not use.

Non-prompt settings are remembered in this browser. Human prompt text is excluded
unless **Include human prompts from this computer** is checked for this visit;
the consent resets when the page is reopened. No logs or model responses are sent
to a cloud service. The result reports saved records, duplicates and per-provider
coverage. **Partial import** means some selected content was unavailable or skipped;
expand diagnostics and adjust folders before retrying. **Nothing imported** creates
no empty machine. Importing from demo mode still saves to local data; follow
**View imported usage** to see it.

Unchanged records are safe to import again. For changed-session or attribution
conflicts, the whole import is rejected without saving new records. Use completed
sessions and keep the same names for the same machine ID. The importer does not
update live session snapshots automatically.

## Recover missing Codex human prompts

Earlier Token Atlas builds recognized only Codex's legacy prompt events. Current
Codex paginated logs store completed user-message items instead, so usage could
appear while Codex prompts stayed empty. Both formats are now supported.

Open **Data sources**, keep the existing machine identity and select Codex.
Check **Include human prompts from this computer**, then click **Import from this
computer** again. This explicitly backfills supported prompts and deduplicates
unchanged usage. Open **Prompts** and select **Codex**; clear search/date/member
filters if needed. A normal refresh alone does not collect newly supported text.
For partial imports, inspect the result diagnostics and choose a smaller retained
session folder. Missing, oversized or unsupported history cannot be reconstructed.

## Make imported names recognizable

New one-click imports default to **Local user**; the account running the server is
not assumed to be your name. For existing data, open **Data sources → Machines in
this workspace → Edit display names**. Set a member and computer name, then save.
These names are used across local views and filters and survive restarting the app.
Reset restores the imported names (legacy sandbox accounts display as Local user).

Display names stay in this workspace. **Imported attribution** shows the original
values retained by exports, so old files still merge without conflicts. Do not
change the stable machine ID just to rename a person; that creates another identity.
Member means the person assigned to the usage. Provider means the application that
recorded the session; a member name containing Codex can still have Claude Code usage.

Recent sessions show first observed activity in the selected period and member /
computer context. Full session and machine IDs are available under **Session details**.
The portable format does not contain chat titles or project names.

## Collect and share from another machine

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
20 levels of nesting, 20,000 records of each kind. The one-click flow collects each
selected provider separately, so each has its own 100 MiB/traversal budget (at most
200 MiB across two providers). Combined records and the database still have the
20,000-record limit per kind. All selected providers save together or none save on
a merge error. Diagnostics are capped at 200 per provider, but the incomplete
coverage flag remains visible even when diagnostic messages are truncated.
Use `npm run collect -- --help` for actual supported flags. See
[provider coverage](providers.md) and [portable contract](data-contract.md).
