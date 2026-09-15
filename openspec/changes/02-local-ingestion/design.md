## Context

Ledger schema exists. docs/providers.md records pinned official formats and caveats.

## Goals / Non-Goals

Explicit completed-log snapshots, usage and human text only. No watcher, compressed
archive support, SDK stream adapter, full billing reconciliation or output storage.

## Decisions

- Pure parseTranscript(text, options) returns bundle and safe diagnostics. Options
  include provider, machine and includePrompts. File paths never enter the bundle.
- Claude message IDs dedupe blocks; keep monotonic latest values inside one file.
  Cache creation without duration split assumes 5-minute writes with diagnostic.
- Codex modern response IDs take precedence per file. Legacy cumulative differences
  suppress repeats; on counter reset rebaseline and skip the ambiguous interval.
  IDs derive from source session/identity; reimporting the same snapshot is stable.
- Only original user flags/event types qualify. Unknown/missing identities get
  deterministic content hashes; ambiguous context records are skipped.
- CLI walks explicitly selected roots, skips links, caps files/bytes and catches
  per-file failures. Stable machine/member arguments are required; default output
  path under exports. Refuse overwriting an existing export unless --force is set.

## Risks / Trade-offs

Provider format drift and Claude output placeholders mean observed usage can be
incomplete; surface diagnostics. Reimport of a growing record with changed tokens
can conflict with immutable ledger data; use completed sessions for this MVP.
Legacy partial files can include cumulative usage before the available interval;
the first cumulative snapshot is attributed to its observation time.

## Migration Plan

Adds adapters to v1 without altering ledger storage. CLI tests use temporary
synthetic roots only. Exported files are ignored by Git.
