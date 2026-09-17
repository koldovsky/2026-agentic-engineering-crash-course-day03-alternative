# Day04: журнал orchestration

Це порожній шаблон. Значення `не виконано` не означає успіх.

## Вимоги, зріз і переданий контекст

- Outcome / capability / S1:
- Reviewed sources і їхні revisions:
- Прийняті рішення / припущення / відкриті питання:
- Де лежать сталі testing rules; як перевірили, що роль їх прочитала:
- Context packet A / B / checker:

| Requirement ID | Slice / change | Scenario | Task | Очікуваний доказ | Actual / revision |
| --- | --- | --- | --- | --- | --- |
| FR-EXPORT-01 | S1 / 06-scoped-export | E2/U1 | 2.1/2.2/3.2/3.3 | Точні usage IDs у download | не виконано |
| BC-PRIVACY-01 | S1 / 06-scoped-export | E8/E10 | 2.1/3.4 | No leak; weak-key red → restore green | не виконано |
| NFR-ACCESS-01 | S1 / 06-scoped-export | U3 | 2.2/3.3/4.2 | Клавіатура й 375 px | не виконано |

Повний registry: requirements.md. Значення U1 після слова scenario — номер
UI-сценарію; U1 у collision fixture нижче — ID synthetic usage record.

## Контракт і DAG

- Базовий commit / tag:
- Commit контракту:
- Обрана модель orchestrator / фактично використана:
- Режим: shared directory з окремими файлами / окремі worktrees:
- Рішення людського review:

```text
O: spec + DTO + fixtures + checkpoint
  ├── A: pure selector + unit tests ───┐
  ├── B: controlled UI + UI checks ──┤
  └── C: counterexamples (read-only) ─┤
                                     ↓
O: integration + API/browser checks → C: final review → human review
```

| Worker | Дозволені файли | Залежить від | Бюджет часу / tokens | Stop condition |
| ------ | --------------- | ------------ | -------------------- | -------------- |
| A      |                 |              |                      |                |
| B      |                 |              |                      |                |
| C      | без змін        |              |                      |                |

## Перевірки

| Scenario                                     | Commit + dirty diff | Команда / ручна дія | Реальний результат | Файл доказу |
| -------------------------------------------- | ------------------- | ------------------- | ------------------ | ----------- |
| E1 legacy export                             |                     |                     | не виконано        |             |
| E2 intersection / UTC / unknown              |                     |                     | не виконано        |             |
| E3 invalid request                           |                     |                     | не виконано        |             |
| E4 all ignores valid filters                 |                     |                     | не виконано        |             |
| E5 empty result                              |                     |                     | не виконано        |             |
| E6 machine closure / repeat                  |                     |                     | не виконано        |             |
| E7 empty filters                             |                     |                     | не виконано        |             |
| E8 tuple collision                           |                     |                     | не виконано        |             |
| Task 3.4 public fixture weak key red / restore green        |                     |                     | не виконано        |             |
| E9/E10 prompt exclusion                      |                     |                     | не виконано        |             |
| E11 legacy opt-in / prompt-only / round trip |                     |                     | не виконано        |             |
| U1/U2 request matches UI                     |                     |                     | не виконано        |             |
| U3 keyboard / mobile                         |                     |                     | не виконано        |             |
| U4 clear filters / all                       |                     |                     | не виконано        |             |
| U5 failed export / retry                     |                     |                     | не виконано        |             |
| npm run check                                |                     |                     | не виконано        |             |
| npm run build                                |                     |                     | не виконано        |             |
| npm run test:e2e                             |                     |                     | не виконано        |             |

## Окремий held-out випадок для задачі 3.4

- Dataset і expected set (зафіксовано до запуску selector):
- Хто його створив / хто мав доступ до завершення worker-коду:
- Revision і результати weak-key red / restore green:
- Доказ відрізняється від публічного U1/U2/U3 прикладу:
- Статус: не виконано.

Після розкриття цей case є regression test. Для нової незалежної оцінки
потрібен новий прихований case; не називаємо повторний прогін held-out.

## Review якості тестів

- Стан і дані ізольовані між тестами:
- User-facing locators та очікування подій без hard waits:
- Expected values незалежні від функції під тестом:
- Assertions перевіряють результат і відсутність зайвих даних:
- Негативний контроль ловить потрібну поведінкову помилку:
- Якщо є coverage/mutation: revision, config, denominator, exclusions, actual:
- Відкритий борг: належить цьому scope / нова пов'язана зміна, причина:

## Checker report

### Окреме візуальне прийняття

- Перевірена revision + dirty diff, браузер/ОС:
- Skill або checklist; source/revision; як підтвердили завантаження (чи не використовувався):
- Погоджений review scope; дозволені browser actions/artifacts; source edits заборонені:
- Вид оцінки: design critique / reference fidelity / visual regression:
- Oracle/reference та хто схвалив baseline; якщо reference недоступний — fidelity не заявляємо:
- View/state і viewport (desktop/375px):
- Для image comparison: DPR, zoom, fonts, theme, synthetic data/clock/scroll і стабільність стану:
- Видимі критерії: alignment / spacing / typography / icons / clipping / contrast / focus:
- Репрезентативні споживачі змінених спільних компонентів:
- Page context screenshots і crops у масштабі 1:1, які справді оглянули:
- Хто оглядав; конкретні знахідки й виправлення:
- Для вимірюваного дефекту: геометричний assertion і контрольований failing case:
- Screenshot diff: погоджені tolerances/masks, пояснення різниці; чи не замасковано предмет перевірки:
- Зрозумілість labels; окремо перевірене походження provider та непідтверджені гіпотези:
- Що не оглядали; що залишається суб'єктивним або залежним від середовища:
- Рішення: не виконано / changes requested / accepted:

Збережений screenshot не означає виконаний review. Новий baseline потребує
оцінки правильності; «збігається з реалізацією» недостатньо.

Для кожної знахідки: severity, сценарій, файл/рядок, конкретний контрприклад,
очікуване/фактичне, команда відтворення. Окремо: підтверджені дефекти, відсутні
докази, питання до контракту. «Не знайшов дефектів» не заповнює відсутні докази.

## Вартість спроби

| Role / session ID     | Actual model | Input | Cached input | Output | API-equivalent USD | Wall time | Retries |
| --------------------- | ------------ | ----- | ------------ | ------ | ------------------ | --------- | ------- |
| Orchestrator          |              |       |              |        |                    |           |         |
| A                     |              |       |              |        |                    |           |         |
| B                     |              |       |              |        |                    |           |         |
| C                     |              |       |              |        |                    |           |         |
| Integration / repairs |              |       |              |        |                    |           |         |

Вкажіть джерело кожної метрики. Недоступне поле: `unknown`, не `0`.
Не додавайте parent totals до вже включених у них child totals. Фіксуйте,
чи звіт inclusive або exclusive. Token Atlas зараз не обіцяє автоматичне дерево
сабагентів: attribution записуємо тут вручну; жодних реальних prompt/log файлів
у навчальному репозиторії. Не виводьте з цього рахунок за підписку.

## Handoff після ліміту

- Мета та прийняті рішення:
- Branch, HEAD, worktree paths, незакомічені файли:
- Завершено з доказом:
- Не завершено / failing scenario:
- Наступна одна дія і команда перевірки:
- Не повторювати / не змінювати:
- Потрібне рішення людини:

## Review

- Рішення: accepted / changes requested / incomplete:
- Дата, reviewed revision:
- Що лишилось неперевіреним:
- Archive: не виконано:
