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

| Крок | Тег | Агентів | Хвилин | $ | Результат |
| --- | --- | --- | --- | --- | --- |
| 1 · onboard | `step-07-factory-onboard` | | | | |
| 2 · вимога + план | `step-08-factory-spec` | | | | |
| 3 · спека | `step-08-factory-spec` | | | | |
| 4 · червоне | `step-09-factory-red` | | | | |
| 5 · зелене | `step-10-factory-green` | | | | |
| 6 · evals | `step-11-factory-evals` | | | | |
| 7 · ворота + рев'ю | `step-12-factory-gates` | | | | |
| 8 · archive + ledger | `step-13-factory-archive` | | | | |

## Ворота (три стани)

`npm run qa:verify` — рядки PASS / NOT-EARNED / FAIL:

```text
(вставити вивід)
```

## Рев'ю

`openspec/changes/11-usage-csv-summary/review-findings.json`: знайдено / виправлено / відхилено:

## Eval і baseline

`evals/results/latest.json` → `quality/eval-baseline.json`:

## Ledger

Рядки `trace/ledger.jsonl` для цього прогону (`scope_n` ≠ 0):

## Негативний контроль

Які ворота бачили червоними і чому:

## Чого перевірки не охоплюють

## Один висновок
