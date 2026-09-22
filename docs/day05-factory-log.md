# Day 05 · factory log — one feature through Project Factory

Шаблон звіту для домашнього завдання дня 05 і водночас журнал прогону, який показано на занятті.
Заповнюється у два прийоми: розділ «План» — **до** запуску агентів, розділ «Факт» — після. Числа, яких
інструмент не показує, позначаються `недоступно`, а не оцінкою.

## Зміна

- Репозиторій: `koldovsky/2026-agentic-engineering-crash-course-day03-alternative` (Token Atlas)
- Гілка: `workshop-day05-factory` від `main` (`5e339b9`)
- Зміна: `11-usage-csv-summary` — експорт видимої зведеної таблиці моделей у CSV
- Вимоги: `FR-CSV-01`, `FR-CSV-02`, `FR-CSV-03`, `BC-PRIVACY-02` (`docs/requirements.md`)
- Фабрика: `project-factory` v2.0.0, master `0d7286a`, встановлено `onboard --tools=claude --no-reverse`

## План — записано до запуску (22.09.2026, 16:20)

| Межа | Значення |
| --- | --- |
| Час | ярус A (onboard → spec → red → green) до 17:00; ярус B (evals → gates → archive) до 17:30 |
| Спроби | одна спроба + один раунд виправлень на фазу |
| Агенти | ≈45–60 запусків субагентів разом із workflows |
| Гроші | оцінка $15–40 (єдині виміряні точки до прогону — $0.29 і $0.05 з акту A) |
| Не в обсязі | e2e/Chromium як метод приймання, vision-verify, записи демо, process-auditor |
| Відкат | якщо до 17:15 немає `step-10-factory-green` — ярус B не запускається |

## Факт

Час — за годинником машини (Europe/Kyiv); «агентів» — запуски субагентів і workflow-агентів; «$» —
`недоступно`: прогін вели з інтерактивної сесії, яка не показує вартість по фазах.

| Крок | Тег | Агентів | Хвилин | $ | Результат |
| --- | --- | --- | --- | --- | --- |
| 1 · onboard | `step-07-factory-onboard` | 0 (детермінований скрипт) | 25 (16:20–16:45) | недоступно | 12 агентів, 6 workflows, 16 скриптів, hooks, lock; 6 адаптацій; waivers 0 |
| 2 · вимога + план | `step-08-factory-spec` | 1 (requirements-analyst) | 20 (16:45–17:05) | недоступно | FR-CSV-01..03, BC-PRIVACY-02, TC-STACK-01; план — 1 рядок |
| 3 · спека | `step-08-factory-spec` | 1 (spec-writer — сесія обірвалась після design і spec delta; tasks.md і .openspec.yaml дописано вручну) | у тих самих 20 | недоступно | strict validate 6/6 |
| 4 · червоне | `step-09-factory-red` | 1 (test-engineer) | 10 (17:05–17:15) | недоступно | 16 тестів падають на «not implemented» (typed stubs — pre-commit ганяє tsc) |
| 5 · зелене | `step-10-factory-green` | 1 (capability-implementer) | 12 (17:15–17:27) | недоступно | 17/17, `npm run check` 189/189; hook відмовив без trailers (exit 1); 2 дефекти фікстур виправлено в тесті без послаблення |
| 6 · evals | `step-11-factory-evals` | 4 (collect, 2 судді, writer) | 3 (17:25–17:28) | недоступно | 2/2 pass, usability-clarity 92.5 → baseline 92.5 |
| 7 · ворота + рев'ю | `step-12-factory-gates` | review-gate №1: 61; fixer: 1; review-gate №2: див. «Рев'ю» | рев'ю 16 + виправлення 20 + рев'ю ~16 (17:32–18:25) | недоступно | qa:verify №2: 12 PASS, 2 NOT-EARNED, 0 FAIL; рев'ю №1 — 25 підтверджених → виправлено → рев'ю №2 |
| 8 · archive + ledger | `step-13-factory-archive` | 0 | 5 (18:25–18:30) | недоступно | archive **не виконано**: рев'ю `clean: false`; ledger digest, process-health, gate-status записані; зміна лишається активною |

## Ворота (три стани)

`npm run qa:verify` — двічі. Прогін 1 (до виправлень, 17:27, 47 с): 11 PASS, 3 NOT-EARNED (recordings, visual-fidelity, process-ratchet без baseline), 0 FAIL. Прогін 2 (після виправлень рев'ю, 18:07): 

```text
- Overall result: NOT-EARNED (2 member(s) unearned)
| traceability | `node scripts/check-traceability.mjs` | PASS | 0 |
| trajectory | `node scripts/check-trajectory.mjs` | PASS | 0 |
| recordings | `node scripts/check-recordings.mjs` | NOT-EARNED | 1 |
| acceptance-artifacts | `node scripts/check-acceptance-methods.mjs --mode=artifact` | PASS | 0 |
| visual-fidelity | `node scripts/check-visual-fidelity.mjs` | NOT-EARNED | 1 |
| process-ratchet | `node scripts/check-process-ratchet.mjs` | PASS | 0 |
| factory-integrity | `node scripts/check-factory-integrity.mjs` | PASS | 0 |
| unit-tests | `npm run test:run` | PASS | 0 |
| production-build | `npm run build` | PASS | 0 |
| browser-e2e-tests | `npm run test:e2e` | PASS | 0 |
| eval-ratchet | `node scripts/check-eval-ratchet.mjs` | PASS | 0 |
| lint | `npm run lint` | PASS | 0 |
| openspec-all | `npm run spec:validate` | PASS | 0 |
| openspec-active-list | `npx openspec list` | PASS | 0 |
```

NOT-EARNED — не провал: recordings і visual-fidelity не оголошені як методи приймання для цієї зміни (немає механізму — немає заробленого PASS). FAIL не було жодного; e2e (22 journeys, з них 1 новий — клавіатура, назва файла, 375 px) зелений.

## Рев'ю

review-gate (4 пошукачі: correctness · security · spec-compliance · visual; кожну знахідку намагаються спростувати два верифікатори; 61 агент, 16 хв).

- **Прогін 1** (`docs/qa/review-findings-run1.json`, diff `step-08-factory-spec..step-11-factory-evals`): підтверджено 25, спірних 0, спростовано 3 — correctness 7, security 7 (з них 6 — звіти «Clean: …», не дефекти), spec-compliance 11. Реальні: formula injection через id моделі (major), три сценарії без тесту (major), стан статусу не скидається при зміні фільтрів, дубль типу Source, мертвий re-export, eval оцінював літерал замість рендеру, розсинхрон tasks.md.
- **Виправлення** — fixer з лімітом 15 хв (див. коміт `step-12-factory-gates`).
- **Прогін 2** (`docs/qa/review-findings-run2.json`, після виправлень, diff `step-08-factory-spec..HEAD`, 57 агентів, 16 хв): підтверджено 24, спірних 1, спростовано 1 — correctness 8, security 6, spec-compliance 10. Серед підтверджених знову звіти «Clean: …» і «Coverage summary» (не дефекти) та нові дрібні зауваження (текст порожнього стану при порожньому джерелі з фільтром; eval-артефакти згенеровані попередньою версією кейсу). **Висновок:** у цій версії фабрики рев'ю не сходиться до `clean: true`, бо інформаційні звіти рахуються як знахідки; `review-findings.json` лишається `clean: false`, і archive за правилом воріт (trajectory: рев'ю має бути чистим до archive) не виконується. Це не обхід — це відповідь воріт.

## Eval і baseline

`evals/results/latest.json` → `quality/eval-baseline.json`: csv-empty-filtered 93/100 (pass, суддів 1), csv-empty-source 92/100 (pass, суддів 1); вимір usability-clarity 92.5 → baseline 92.5; `check-eval-ratchet`: OK, Result PASS. Поріг 70; CRITICAL-критерій обмежує оцінку 49.

## Ledger

`trace/ledger.jsonl`: 29 подій цього прогону (hook-run, check-run, battery-run), кожна з `exitCode`, `scope_n`, `gitHead`; digest `docs/qa/process-health.md`: вакуумних pass 0, NOT-EARNED подій 3, waivers 0, відкритих корекцій 0. Приклад рядка:

```text
{"ts": "2026-09-22T14:28:57.579Z", "event": "gate-status-run", "check": "gate-status", "exitCode": 1, "failures": null, "warnings": null, "warningsByClass": {}, "scope_n": 9, "phase": "4", "gitHead": "16aafece3e07ddd09c4824fd981260bd11265fa5", "dirty": true, "durationMs": null, "meta": {"frontier": …
```

## Негативний контроль

Коміт продуктового коду без trailers → `commit-msg` hook: «this commit touches feature code but has no trace trailer», exit 1 (крок 5). Acceptance-join у режимі артефактів → FAIL на `TC-STACK-01` (оголошено `local-verifiable`, тесту з `@trace TC-STACK-01` не було) → додано `src/lib/stack-constraint.test.ts` → PASS. Ворота, що жодного разу не були червоними, нічого не доводять — тут червоними були двоє.

## Чого перевірки не охоплюють

- Порядок test-first детерміновано не доведено: `check-trajectory` бачить лише чисте рев'ю, trailers і межі модуля; те, що тести були раніше за код, тримається на тегах `step-09` → `step-10` і на LLM-судді trajectory-eval, якого сьогодні не запускали.
- Vision-verify і записи демо — не запускались: візуально нову кнопку в картці ніхто, крім e2e-перевірки overflow на 375 px, не дивився.
- Eval — 2 кейси, 1 суддя на кожен (оцінки не потрапили в зону ±10 від порога, другого судді не було); негативного контролю для судді (навмисно поганий текст) не робили.
- process-auditor (LLM-половина reflection) не запускався: process-defects.json містить лише детерміновані дефекти (0).
- Вартість у доларах не виміряна — прогін вели з інтерактивної сесії.

## Один висновок

Бюджет часу поїхав рівно там, де прогнозувалось найменше: не на коді, а на рев'ю (25 знахідок, з них 6 — «чисто», і 19 — реальні, від formula-injection до розсинхрону tasks.md). Наступного разу межа «одна спроба + один раунд виправлень» має стояти на review-gate окремо, а не на фазі в цілому.
