## 1. Define the change

- [x] 1.1 Validate the proposal, scenarios, design, and shared response contract for one-click local import.

## 2. Implement local collection and controls

- [x] 2.1 Add safe default settings and a guarded machine-import API; verify defaults do not scan files and invalid requests are rejected.
- [x] 2.2 Collect selected roots with durable partial-result reporting and one atomic ledger merge; verify synthetic missing-root, repeat, conflict, and limit scenarios.
- [x] 2.3 Add the one-click import panel with remembered settings and fresh prompt consent; verify usable defaults, pending states, and actionable results.
- [x] 2.4 Integrate the panel into Data Sources and explain the manual import alternative; verify responsive and accessible controls.

## 3. Verify and document

- [x] 3.1 Run synthetic browser acceptance scenarios for import, repeat import, prompt consent, partial and empty results, and narrow screens.
- [x] 3.2 Run the project checks and production build, review the implementation independently, and resolve material findings.
- [x] 3.3 Document actual results and usage, then restart and verify the local app without importing real machine data automatically.
