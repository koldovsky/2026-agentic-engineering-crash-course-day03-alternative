## 1. Orchestrator prepares the common checkpoint

- [ ] 1.1 Review proposal, design and E/U scenarios with a human; record actual decisions and pass strict change validation.
- [ ] 1.2 Create src/lib/export-contract.ts and src/lib/export-fixtures.ts, record the dependency graph and file owners, and commit the common revision; verify workers can read that exact revision.
- [ ] 1.3 Have the independent checker define adversarial cases from the spec; verify expected record IDs manually before coding.

## 2. Independent worker assignments after 1.2

- [ ] 2.1 Worker A implements the pure selector and tests in export-scope.ts/export-scope.test.ts; show failing then passing assertions for intersections, privacy, empty selection and machine closure without source mutation.
- [ ] 2.2 Worker B implements the controlled scope component in export-scope-fields.tsx and focused markup tests; verify labeled choices, filter summary, empty-filter explanation and no server imports.

## 3. Orchestrator integrates the joined result

- [ ] 3.1 Integrate A/B against their recorded base without silent shared-contract changes; inspect the combined diff for ownership and type agreement.
- [ ] 3.2 Extend strict request validation and wire the selector into export route; resolve visible member aliases to canonical machine IDs without exporting aliases; verify E12, legacy/default, bad fields/dates and limits with API tests.
- [ ] 3.3 Wire current filters/source into export controls and replace outdated scope text; verify live filter changes, opt-in prompts and error handling in the browser.
- [ ] 3.4 Add the checker's held-out cross-machine/provider session-collision fixture; prove the assertion fails for a controlled weak sessionId-only match and passes for the repaired selector, restoring production code afterward.

## 4. Verify and review the integrated revision

- [ ] 4.1 Run npm run check and npm run build on the integrated tree; record command, revision, actual exit/result and uncommitted state.
- [ ] 4.2 Run targeted browser acceptance plus baseline transfer journeys with synthetic data; inspect downloaded JSON, empty/no-leak cases, repeated import, keyboard and 375px layout.
- [ ] 4.3 Checker reviews final implementation and fresh evidence without editing it; resolve concrete findings and rerun affected checks plus required gates after fixes.
- [ ] 4.4 Update docs/data-contract.md and workshop verification notes for scope semantics; record worker budgets versus observed usage, unavailable measurements, review outcome and final diff.
- [ ] 4.5 Only after all prior tasks are evidenced, obtain the workshop human review and archive this change; verify main specs and archived artifacts agree and strict validation passes.
