# День 04 — prompts для оркестрації

Це інструкції до [уроку](guide.md), не transcript виконаної роботи. Вставляйте
текстові блоки в **Codex chat**, а terminal-блоки — в термінал. Імена моделей,
ліміти, ревізії й actual results заповнюйте фактами свого прогону.

Усі ролі працюють над **однією** зміною `06-scoped-export`. Зміна
`05-reference-design` не входить у завдання. Workers не архівують OpenSpec,
не комітять чужі файли і не редагують один спільний `tasks.md`.

## 0. Із чату до погодженого зрізу

До propose прочитайте requirements.md, context-packet.md і quality.md із пакета.
Якщо контекст уже погоджений, звірте його з repo і не створюйте повторний review.

```text
Звір наданий чат із PRD, architecture та чинними specs. Розділи факти,
прийняті рішення, припущення й відкриті питання; вкажи джерело та ревізію.
Суперечності не вирішуй мовчки. Не копіюй приватний transcript у repo.
Використай registry FR/NFR/TC/BC у docs/workshop/day04/requirements.md;
збережи чинні P/E/U IDs. Покажи S1 як UI→API→selector→JSON→acceptance.
Selector і UI — задачі одного slice, не дві незалежні capabilities.
Пов'яжи вимогу зі scenario, task і конкретним доказом. Статус без прогону
залишається planned/not run. Сформуй короткий context packet для кожної ролі.
```

## 1. Планування однієї зміни

Якщо підготовлена зміна вже є, прочитайте та перевірте її, не створюйте дубль.
Клон зі стартового тегу `workshop-day04-start` уже містить
`docs/workshop/day04/` і `openspec/changes/06-scoped-export/`, а не реалізацію.
Якщо підготовлений пакет недоступний, використайте цей prompt:

```text
$openspec-propose Створи 06-scoped-export як продовження Token Atlas зі стану
workshop-day04-start. Спочатку прочитай AGENTS.md, docs/PRD.md,
docs/architecture.md, чинні team-exchange/dashboard specs, src/lib/transfer.ts,
src/app/api/export/route.ts, src/components/transfer-controls.tsx і фільтри.

Мета: явний вибір all або filtered при експорті. Default scope=all зберігає
наявну поведінку; source=local та includePrompts=false залишаються defaults.
Filtered usage: AND provider/member/exact model/from/to, включні UTC-дні.
Поточний member у UI може бути local display name: orchestrator резолвить його
в machine IDs до pure selector, зберігаючи оригінальні machine payloads у JSON.
Це інтеграційний сценарій E12; storage/alias lookup не належить Worker A.
Невідомі моделі не відкидаємо. q/page і невідомі поля не підтримуються.
Запит {source, includePrompts, scope, filters}; filters у all валідовані,
але не обмежують дані. Невірні дати/from>to відхиляються в будь-якому scope.

Filtered prompts: лише за includePrompts=true, власні provider/member/date
і членство у сесіях вибраного usage за (machineId, provider, sessionId).
All із includePrompts=true зберігає всі prompts, навіть prompt-only sessions.
Filtered machines: лише посилання із залишених usage/prompts; порожній bundle
валідний. Export serializer зберігає default prompt exclusion як другий захист.

Створи proposal, сценарії, design, tasks. У design зафіксуй type-only контракт
src/lib/export-contract.ts: ExportScope, ExportFilters, ScopeSelection;
selectExportBundle(bundle, selection, includePrompts=false): Bundle.
ExportScopeFields props: value:ExportScope, onChange:(scope:ExportScope)=>void,
filters:ExportFilters, disabled?:boolean.

DAG: human review → orchestrator freeze DTO + synthetic fixtures + DAG
→ worker A selector/tests
паралельно worker B controlled UI → orchestrator integration → independent
checker → integrated gates → рішення про archive.
A володіє лише src/lib/export-scope.ts і src/lib/export-scope.test.ts.
B володіє лише src/components/export-scope-fields.tsx і
src/components/export-scope-fields.test.ts (Node Vitest, не .test.tsx).
Orchestrator володіє DTO, synthetic src/lib/export-fixtures.ts, DAG,
transfer.ts, export route, parent wiring, integration
tests, specs/tasks/evidence. Не змінюй product code на етапі proposal.
Покажи контракт, невизначеності й сценарії для людського review.
```

Terminal-перевірка після планування:

```text
npm run openspec -- status --change 06-scoped-export
npm run openspec -- validate 06-scoped-export --strict --no-interactive
```

Видимий review: поясніть, які саме prompts потраплять у filtered bundle, коли
той самий `sessionId` є на двох machines. Якщо відповідь неоднозначна, workers
ще не стартують. Зафіксуйте рішення в design до apply.

## 2. Orchestrator — freeze і dispatch

Вставляйте після review. У workshop ця межа видима: людина прочитала контракт
і дала команду почати. До dispatch заповніть бюджети з guide.

```text
$openspec-apply-change 06-scoped-export. Реалізуй погоджену зміну через двох
workers з непересічними файлами та незалежного checker. Не застосовуй інші зміни.

Спочатку прочитай усі артефакти зміни, requirements.md, context-packet.md
та quality.md із docs/workshop/day04. Перевір baseline, створи type-only
src/lib/export-contract.ts за design, deterministic src/lib/export-fixtures.ts
і DAG. Перевір і
закоміть ці передумови разом з OpenSpec-артефактами до workers; запиши SHA.
Обидва worktrees мають стартувати від цього commit, не від голого day03 tag.
Назви topology: shared workspace чи окремі worktrees; subagent context сам по
собі не доводить файлову ізоляцію. Якщо native subagents недоступні, використовуй
окремі Codex sessions/worktrees або серійний fallback, чесно позначивши варіант.

Перед dispatch для кожного worker передай: мету, exact base revision, вхідні
файли, ownership, точні signatures, stop conditions, бюджет і форму звіту. Додай requirement IDs, source revision і пов’язані сценарії.
Сталі testing rules не заміняють feature acceptance; тести є задачами apply.
A: тільки selector і його unit tests. B: тільки controlled scope-fields і
export-scope-fields.test.ts з focused markup assertions у Node Vitest.
Не давай workers доручення implement entire change. Вони не змінюють DTO,
transfer-controls.tsx, package/lock/config, OpenSpec/tasks чи файли іншої ролі.

Поки вони працюють, підготуй integration/API test cases і перевір існуюче
wiring; не редагуй їхні файли. На join прийми результати за контрактом, а не
за словом done. Ти один змінюєш ExportRequestSchema, export route, parent
controls і dashboard wiring; selector виконується на сервері. Прочитай локальні
Next.js docs і Vercel React skill перед React/Next edits.

Checker не пише source code і не успадковує maker-висновок як доказ. Попроси
незалежні adversarial cases. Ти додаєш held-out API/e2e tests. На integrated
revision спочатку unit/API checks і npm run check, потім npm run build,
потім npm run test:e2e: browser suite потребує свіжого production build.
У фіналі покажи commands/exit codes/revision, невирішені findings і фактичні
витрати або unavailable. Не став [x] без доказу; archive лише після перевірки.
```

## 3. Worker A — чиста логіка

Coordinator додає перед цим блоком **справжній base revision, модель і бюджет**.
Не надсилайте незаповнений контракт.

```text
Ти worker A у S1 / 06-scoped-export. FR-EXPORT-01, BC-PRIVACY-01,
NFR-INTEGRITY-01 і TC-SERVER-01 дивись у requirements.md. Прочитай AGENTS.md, proposal/specs/design цієї
зміни, src/lib/export-contract.ts, src/lib/schema.ts і src/lib/export-fixtures.ts.
Твоя єдина область запису: src/lib/export-scope.ts і src/lib/export-scope.test.ts.
Не змінюй DTO, спільні fixtures, API, UI, конфігурацію, dependency/lockfile або OpenSpec/tasks.

Реалізуй pure selectExportBundle(bundle, selection, includePrompts=false): Bundle
за frozen contract. Без SQL, filesystem, network, pricing і глобального state.
Не мутуй вхідний bundle; не відкидай unpriced/unknown model usage.
All зберігає всі usage/machines, prompts тільки з явним includePrompts=true.
Filtered бере usage за provider/member/model/включними UTC-датами; prompts
за власними provider/member/date І composite session key вибраного usage.
Ключ: (machineId, provider, sessionId). Залиш machines лише з посиланнями;
порожній зріз повинен проходити BundleSchema. q/page тут не існують.

Напиши змістовні unit tests із ручними expected IDs, включно з collisions
між machines/providers, граничними датами, default prompt exclusion і all
compatibility. Не генеруй expected output через функцію під тестом.
Зафіксуй red/green чесно: import/syntax failure не є доказом поведінкового red.
Запусти npm test -- src/lib/export-scope.test.ts. Поверни команду й actual output.

Коли потрібна зміна shared contract чи файлу поза ownership, зупини цю частину
і надішли coordinator конкретну пропозицію; сам не розширюй scope.
Фінал: файли; покриті scenarios; команда/exit code; uncovered risks;
commit SHA лише якщо ти в окремому worktree; elapsed/usage або unavailable.
```

## 4. Worker B — controlled UI

```text
Ти worker B у S1 / 06-scoped-export. FR-EXPORT-03, NFR-ACCESS-01
і TC-SERVER-01 дивись у requirements.md. Прочитай AGENTS.md, design/specs зміни,
src/lib/export-contract.ts, чинний ExportControl у
src/components/transfer-controls.tsx як read-only reference,
Vercel React skill та релевантні installed Next.js docs.
Твоя область запису: src/components/export-scope-fields.tsx і
src/components/export-scope-fields.test.ts; інших файлів не змінюй.
Не редагуй transfer-controls.tsx, DTO, API, CSS, package/lock/config або tasks.

Створи ExportScopeFields з точними props frozen contract:
value:ExportScope; onChange:(scope:ExportScope)=>void;
filters:ExportFilters; disabled?:boolean.
Використовуй лише type-only imports DTO. Не імпортуй runtime server modules.

Доступна radio group для All data / Current filters; parent визначає
value і передає onChange. Видимий read-only summary provider/member/model/from/to;
коли filters порожні, явно «All usage matches». Поясни UTC-дати. q/page не
показуй як export filters. Disabled блокує зміну scope. Унікальні id і labels;
не додавай локальну копію parent state, fetch, download чи prompt-checkbox.
Використовуй існуючі стилі; це функціональна зміна, не дизайн-редизайн.

У .test.ts використай createElement та renderToStaticMarkup для focused
assertions: labels, selected scope, disabled, filter summary та порожні filters.
Не додавай .test.tsx або нові dependencies: Vitest налаштований на Node і .test.ts.
Запусти npm test -- src/components/export-scope-fields.test.ts і доступні
lint/typecheck команди. Не називай ізольований компонент
перевіреним user flow: browser acceptance можливий після parent wiring.
Якщо для компонента потрібен shared edit, повідом coordinator і зупини цей крок.
Фінал: файли; API компонента; accessibility/disabled states; команди/exit codes;
неперевірене; commit SHA лише у worktree; elapsed/usage або unavailable.
```

## 5. Checker — окремий погляд

На першому проході дайте checker spec/design без maker-звіту. На другому —
інтегровану ревізію й diff. Read-only checker повертає перевірки; orchestrator
записує та запускає тести. Не вимагайте від read-only ролі встановлювати пакети
або запускати команди, що створюють build/test artifacts.

```text
Ти незалежний checker для 06-scoped-export. Source edits заборонені.
Не виправляй код і не позначай задачі завершеними. Читай spec/design як джерело
очікувань, код і tests — як предмет перевірки; maker-summary не є доказом.

Спочатку запропонуй невеликий held-out synthetic dataset і вручну виведи expected
IDs для таких випадків: один sessionId на двох machines; той самий sessionId
у двох providers; prompt поза датою при usage всередині; prompt-only session;
невідома model; пустий filtered result; старий запит без scope/filters;
q/page/невідомий nested key; from>to навіть у scope all.
Спільний навчальний collision fixture фільтрується ЛИШЕ model=unknown-lab: цю модель має usage
однієї сесії; інші machines/providers з тим самим sessionId мають іншу модель.
Provider/member/date filters лиши порожніми, щоб вони не маскували баг ключа.
Точний набір: U1=(A,codex,shared,unknown-lab), U2=(B,codex,shared,other),
U3=(A,claude-code,shared,other); machines A/B мають member Ada, усі записи
однієї дати; prompts PA/PB/PC відповідають цим трьом сесіям. Filtered з opt-in
і лише model=unknown-lab має дати usage IDs [U1], prompts [PA], machines [A].
Orchestrator повинен показати controlled sessionId-only mutation: exact-set
assertion падає, після відновлення composite key той самий тест зелений.
Цей U1/U2/U3 приклад відомий maker, тому не називай його held-out.
Для 3.4 підготуй також окремий collision dataset з іншими записами/значеннями
та ручним expected set; збережи потрібну семантику і не маскуй слабкий ключ
іншими filters. Дані та expected не передавай maker до завершення його коду.
Orchestrator на інтеграції виконає контрольовану мутацію також на цьому наборі.
Попроси red/green outputs обох наборів як доказ; невиконане не зараховуй.
Потім перевір integrated diff на відповідність цим сценаріям і server/client
межі. UI має явно показувати all/filtered, summary, default prompt opt-out;
не можна обіцяти export лише видимої сторінки prompt search.

Поверни findings у форматі severity, path:line, порушений scenario, мінімальний
reproduction, expected/actual. Окремо: що перевірено читанням; які executable
checks orchestrator ще має запустити; що неможливо встановити з доступних даних.
Якщо findings немає, скажи «не знайшов» і назви межі review, не «все доведено».
Прозовий verdict не замінює pass/fail тестів. Не давай approval на archive.
```

## 5a. Visual checker — окремий доказ для UI

Після wiring передайте цю задачу іншій ролі. Вона не редагує source, але може
відкривати дозволений synthetic test server і створювати screenshots/report
у погодженій теці доказів. Якщо роль має буквально read-only tools, screenshots
готує orchestrator, а checker чесно вказує відсутність власної browser interaction.
Інсталяція optional skill описана в [quality](quality.md); цей prompt працює і без неї.

```text
Ти незалежний visual checker для UI 06-scoped-export. Прочитай quality.md,
design/specs і видимі acceptance criteria. Якщо web-design-reviewer доступний,
використай його checklist; сам нічого не встановлюй. Source edits, зміна
baseline, розширення feature scope та реальні usage logs заборонені.

Очікуваний результат: All data / Current filters читаються й перемикаються;
summary пояснює scope; prompts off за замовчуванням; disabled/pending/error
стани зрозумілі; focus видно; текст і controls не перекриваються й не обрізані.
Спочатку узгоджені критерії, потім реалізація; maker-summary не є oracle.

Оглянь інтегровану ревізію на synthetic data при 1280x900 і 375x850.
Дочекайся видимих loaded controls, не фотографуй skeleton як готовий UI.
Перевір normal, empty filters, disabled/pending і error/retry states у межах
наявного контракту. Зроби page context та crops controls у масштабі 1:1.
Оглянь самі зображення: alignment, spacing, typography, artwork, clipping,
contrast і focus. Для shared changes оглянь репрезентативних consumers.

Не заявляй pixel-perfect без доступного погодженого reference. Якщо є baseline,
звір viewport, DPR, browser/OS, fonts, data/state/theme; не оновлюй його заради green.
Геометричну вимогу перевіряй видимим рисунком, не лише CSS container.
Для вимірюваного дефекту запропонуй orchestrator controlled bad layout:
той самий assertion має впасти, відновлення має пройти. Сам не мутуй source.

Поверни findings: view/state/viewport, expected/actual, severity, screenshot/crop,
reproduction, inspected revision; окремо функціональні й візуальні висновки.
Розділяй незрозумілий label і недоведене припущення про неправильного provider.
Назви неоглянуті states та потрібні докази. Після fix повтори affected review.
Не давай approval на archive; verdict є входом для людського review.
```

## 6. Інтеграція та докази

```text
Обидва workers повернули результат. Перевір ownership і відповідність frozen DTO.
Інтегруй одну зміну 06-scoped-export; не додавай нові features.
Застосуй checker cases як окремі API/browser tests. Називай held-out тільки
ті дані й expected, яких maker не бачив до завершення реалізації. Expected IDs задавай
вручну. API strict validation перевір окремо від чистого selector. Browser test
має реально завантажити JSON і перевірити його вміст, а не лише напис success.

Для нового сценарію покажи поведінковий red на baseline та green після wiring,
якщо це можливо відтворити без втрати роботи. Якщо red не знято, так і запиши.
Окремо обов'язково виконай задачу 3.4: на fixture U1/U2/U3 і PA/PB/PC з одним
member Ada та датою, filter лише model=unknown-lab має повернути [U1]/[PA]/[A].
Тимчасово мутуй matching до sessionId-only; exact-set assertion мусить впасти.
Віднови composite key і повтори той самий тест до green. Збережи обидва results
у evidence table/build log. Повтори негативний контроль на окремому dataset,
який checker утримував від maker; зафіксуй його expected до запуску selector.
Не лишай мутацію у diff, не закривай 3.4 без обох red/green доказів.
Оціни якість тестів: synthetic isolated state, user-facing locators,
очікування події без hard waits, незалежні expected values і business assertions.
Не послаблюй threshold, scope або exclusions для green.
Не переписуй історію прогону. Запусти npm run check, npm run build,
npm run test:e2e на інтегрованому дереві; зафіксуй revision і dirty status.
Після виправлення findings повторно перевір зачеплені сценарії та final gates.
Попроси окремий visual review за prompt 5a: page context + crops, desktop/375px,
loaded states, конкретні findings. passing download не доводить візуальну якість.
Якщо checker не бачив потрібний UI-стан, познач його not inspected.

Онови docs/workshop/build-log.md фактичними командами, exit codes, counts,
обмеженнями, витратами/джерелом або unavailable. Tasks закривай тільки після
доказу. Підготуй self-contained handoff: completed, pending, last failure,
next command, точна ревізія. Не архівуй неперевірену зміну.
```

## 7. Серійний fallback або вичерпані ліміти

```text
Паралельне виконання зараз недоступне. Зберігаємо той самий 06-scoped-export
і frozen contract. Виконай A, потім B, потім інтеграцію. Для checker створи
окремий контекст або передай іншому учаснику; не називай self-review незалежним.
Запиши topology=serial і фактичну причину. Не вигадуй worker token breakdown,
parallel speedup або test results.

При вичерпанні ліміту передай: revision, змінені файли, завершені сценарії,
невиконані перевірки, останню команду/помилку, наступний конкретний крок.
Не починай ту саму роботу з нуля і не запускай нескінченні retries.
```

## Terminal: короткий набір команд

```text
git status --short
git rev-parse HEAD
npm run openspec -- status --change 06-scoped-export
npm run openspec -- validate 06-scoped-export --strict --no-interactive
npm test -- src/lib/export-scope.test.ts
npm test -- src/components/export-scope-fields.test.ts
npm run check
npm run build
npm run test:e2e
```

Selector test команда має сенс після створення тесту. Нові API/e2e scenarios
додаються в ході apply; на старті їх немає. Для targeted browser check спочатку
подивіться фактичні назви через `npm run test:e2e -- --list`, потім оберіть
наявний test. Повний final gate не підміняється grep, що не знайшов жодного тесту.
Архів після готовності — chat-команда `$openspec-archive-change 06-scoped-export`,
потім terminal `npm run spec:validate`.
