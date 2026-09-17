# Домашнє завдання · День 04 «Workflow паралельних subagents»

> Самодостатній текст для LMS. Джерела правди: day04 workshop guide/prompts
> і `openspec/changes/06-scoped-export/` у репозиторії Token Atlas.
> Вони доступні у стартовому тегу та source-bundle ZIP; цей текст не потребує переходів
> за відносними посиланнями, коли його копіюють у LMS.

**Мета:** довести, що ви вмієте розділити одну зміну між виконавцями, зібрати її
за контрактом і перевірити незалежно від автора. Кількість агентів сама по собі
не є результатом. Рекомендований термін для обговорення — до заняття 05,
**22.09.2026**; офіційний дедлайн у LMS має пріоритет.
Це окреме домашнє завдання, не здача capstone.

## Що зробити

Оберіть один варіант:

- Продовжіть Token Atlas зі стану `workshop-day04-start` і виконайте
  `06-scoped-export` за файлами guide.md і prompts.md із переданого day04-пакета.
- У власному репозиторії візьміть одну малу зміну з двома роботами, які стають
  незалежними **після** погодження спільного контракту. Запишіть сценарії до коду.

Спочатку опишіть один корисний outcome і вертикальний capability slice.
Класифікуйте вимоги FR/NFR/TC/BC: для кожної категорії дайте релевантний приклад
або поясніть, чому нового пункту немає. Побудуйте таблицю requirement ID → slice
→ scenario → task → expected evidence. Не називайте frontend/backend двома slices.

Підготуйте context packet: джерела/revision, погоджені рішення, припущення,
відкриті питання, критерій і межі worker. Не копіюйте сирий приватний чат.
Розділіть сталі testing rules, feature acceptance та фактичні результати.
Приклади є у requirements.md, context-packet.md і quality.md day04-пакета.

До запуску workers створіть `DAG.md`: залежності, власник кожного вузла, дозволені
файли, переданий контекст, критерій завершення, місце join. Граф повинен мати
реальну залежність, наприклад contract → A/B → integration → verification,
а не просто два прямокутники «frontend» і «backend».

Запишіть модель, бюджет часу й доступний бюджет usage для кожної ролі. Якщо
інструмент не показує worker tokens або не дозволяє різні моделі, назвіть це
обмеження. Після виконання запишіть факт із джерелом; не підставляйте оцінку
замість недоступної метрики.

Виконайте два workers із непересічним ownership. Продемонструйте розуміння
різниці між окремим контекстом subagent і файловою ізоляцією worktree. Інтегруйте
результати; зелений unit test одного worker не є доказом готовності цілого.

Попросіть окремого checker спочатку прочитати сценарії, потім integrated diff.
Checker може бути іншим агентом у новому контексті або іншим учасником.
Той, хто написав код, не є незалежним checker цього ж коду. Інша модель
не обов'язкова, але джерело незалежності потрібно назвати.

## Якщо обрали Token Atlas

Клон і базова гілка:

```text
git clone https://github.com/koldovsky/2026-agentic-engineering-crash-course-day03-alternative.git token-atlas-day04
cd token-atlas-day04
git switch -c codex/day04-homework workshop-day04-start
npm ci
```

Стартовий тег уже містить `docs/workshop/day04/` і
`openspec/changes/06-scoped-export/`, без готової реалізації цієї вправи.
Окремі [browser handout](https://koldovsky.github.io/2026-agentic-engineering-crash-course/day04-lab.html)
і [source-bundle ZIP](https://koldovsky.github.io/2026-agentic-engineering-crash-course/day04-materials.zip)
доступні для читання та перенесення матеріалів. Перед dispatch orchestrator
створює й комітить DTO, `src/lib/export-fixtures.ts`, DAG та OpenSpec-артефакти; обидва
workers стартують від цього prerequisite commit. Зафіксуйте його фактичний SHA.

Worker B володіє компонентом `src/components/export-scope-fields.tsx` і тестом
`src/components/export-scope-fields.test.ts`. Ізольовані перевірки —
`createElement`/`renderToStaticMarkup` у Node Vitest; `.test.tsx` цей конфіг не
знаходить. UI labels: «All data» / «Current filters». Browser interactions
перевіряємо окремо після parent wiring.

Мінімальний acceptance contract:

1. Старий запит без scope експортує all; prompts виключені за замовчуванням.
2. `filtered` застосовує provider/member/exact model і включні UTC-дати.
   Unknown models лишаються даними, навіть коли ціни немає.
   Member відповідає видимому local display name; exported machine attribution
   залишається оригінальною (E12).
3. Prompts вмикаються явно. Для `filtered` вони відповідають власним
   provider/member/date і сесіям вибраного usage за
   `(machineId, provider, sessionId)`; для `all` зберігається старий повний набір.
4. У filtered bundle немає зайвих machines; порожній зріз — валідний bundle.
5. `q`/`page` і зайві поля відхиляються API. Невірні dates/from>to — помилка
   також у `all`; валідні filters при `all` не обмежують результат.
6. Browser flow завантажує JSON із правильними записами. Сам напис «exported»
   без перевірки файлу недостатній.

Використовуйте лише synthetic fixtures. Не читайте приватні home directories,
не додавайте prompts чи raw logs у публічні докази. Команди фінальної перевірки:

```text
npm test -- src/lib/export-scope.test.ts
npm test -- src/components/export-scope-fields.test.ts
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Встановлення Chromium зробіть завчасно. Test runner використовує port 3100 й
окрему тимчасову БД. Якщо перевірка не виконана, пишіть `not run` із причиною.
Архівуйте OpenSpec лише після виконання сценаріїв і перевірок.

## Що здати — докази

| Артефакт                  | Що має бути видно                                                   |
| ------------------------- | ------------------------------------------------------------------- |
| Registry + context packet | FR/NFR/TC/BC → сценарій → доказ; джерела та прийняті рішення |
| DAG + контракт            | Записані до worker edits; реальний порядок, ownership і join        |
| Два worker handoffs       | Змінені файли, команда/результат, ревізія, незавершене              |
| Незалежний checker report | Хто перевіряв, які сценарії, findings або межі review               |
| Visual review зміненого UI | Loaded desktop/375px, page context і crops 1:1, критерії, findings, повторний огляд |
| Інтегровані перевірки     | Ревізія/dirty state, actual exit codes, тестування поведінки        |
| Бюджет проти факту        | Модель, час/usage, джерело виміру, unavailable/unpriced де потрібно |

Перевірте якість щонайменше одного тесту: звідки взяті expected values,
як ізольовані дані, чому locator стійкий, що assertion доводить і якої помилки
не помітить. Для browser export перевірте JSON після download. Coverage без
аналізу assertions недостатній; не змінюйте пороги автоматичним «+5%».

Для UI окремий checker може застосувати `web-design-reviewer` або checklist із
quality.md. Skill встановлювати необов'язково. Вкажіть, що він справді оглянув,
який oracle використав і які states лишилися неперевіреними. Не заявляйте
pixel-perfect без доступного погодженого reference. Якщо додали screenshot
baseline, назвіть, хто його оглянув і схвалив; не оновлюйте expected до дефекту.

Якщо власний проєкт має недетерміновану AI-функцію, додайте versioned eval cases,
rubric, погоджені до запуску N/R/threshold, model/tool config, всі trials і tool
trace. Поведінкові оцінки та жорсткі permission checks перевіряйте окремо.
Це умовна вимога для таких проєктів; додавати AI-функцію в Token Atlas не треба.

Додайте один негативний контроль: тест або перевірка справді відхиляє відому
помилку. Для Token Atlas задача 3.4 вимагає конкретний контроль: usage
U1=(A,codex,shared,unknown-lab), U2=(B,codex,shared,other),
U3=(A,claude-code,shared,other); machines A/B мають member Ada й усі записи
однієї дати. Prompts PA/PB/PC належать відповідним сесіям. При filtered,
opt-in prompts і **лише** model=unknown-lab очікувані IDs: usage `[U1]`,
prompts `[PA]`, machines `[A]`. Provider/member/date filters порожні.
Тимчасова мутація ключа до sessionId-only має зламати exact-set assertion;
відновлення composite key повертає green. Запишіть обидва outputs і приберіть
мутацію. Цей публічний приклад не є held-out. Для 3.4 checker також створює
окремий collision dataset із ручним expected, не показаний maker до завершення
реалізації. На join повторіть негативний контроль на ньому і збережіть докази
обох наборів. Без цих вимірів не закривайте 3.4. Import/syntax failure не підходить.

## Шаблон звіту

Створіть у своєму репозиторії `docs/day04-orchestration-log.md`:

```markdown
# Day04 orchestration log

- Capability / vertical slice / change:
- Requirement IDs and scenario/evidence mapping:
- Context sources, revision, accepted decisions / assumptions:
- Test-quality review and remaining gaps:
- Contract revision (before workers):
- Topology: shared subagents / worktrees / serial
- Why these tasks can run independently:
- Shared dependency and join:
- Checker identity/context and independence:
- Integrated revision / dirty state:

| Role         | Allowed files | Model | Planned time/usage | Actual | Source |
| ------------ | ------------- | ----- | ------------------ | ------ | ------ |
| Orchestrator |               |       |                    |        |        |
| A            |               |       |                    |        |        |
| B            |               |       |                    |        |        |
| Checker      | read-only     |       |                    |        |        |

| Scenario              | Command or evidence | Expected | Actual / exit code | Revision |
| --------------------- | ------------------- | -------- | ------------------ | -------- |
| Negative control      |                     |          |                    |          |
| Integrated acceptance |                     |          |                    |          |

- Checker findings and disposition:
- What remains unverified:
- Next exact step if unfinished:
- One thing changed in the DAG after learning from the run:
```

Дайте посилання на свою гілку/PR та звіт у чаті курсу або принесіть на заняття 05. Публікуйте лише навчальні synthetic artifacts. Для висновку про speedup
потрібен порівнянний serial-run; якщо його немає, напишіть лише виміряний час.

Вичерпані ліміти, знайдений дефект чи перевищення бюджету — валідний результат
із чесним handoff. Серійний fallback також приймається, якщо ви зберегли ролі,
незалежний checker й описали причину. Не зараховуються: screenshot «done» без
перевірки, self-review під назвою independent review, або вигадані tokens/tests.
