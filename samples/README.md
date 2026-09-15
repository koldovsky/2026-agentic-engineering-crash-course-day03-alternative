# Synthetic workshop transcripts

These tiny invented transcripts include negative markers for assistant output,
tool results and injected context. Those markers must never appear in a bundle.
They contain no real sessions or personal information.

```bash
npm run collect -- --machine workshop-laptop --member "Workshop" --claude-root samples/claude --codex-root samples/codex --include-prompts --out exports/workshop-sample.json
```

Expected:3 usage records,2 human prompts,5,200 total tokens. Claude repeated
assistant ID counts once; repeated Codex cumulative snapshot adds nothing.
Without --include-prompts, the output contains zero prompts.

Change the output filename between runs, or explicitly use --force for these
disposable samples. Preview/import the resulting file in Data sources.
