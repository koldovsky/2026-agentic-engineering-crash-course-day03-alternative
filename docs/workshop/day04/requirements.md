# День 04 — вимоги, capability slicing і простежуваність

Цей реєстр додає навчальні IDs до погодженого змісту Token Atlas. Він не
перейменовує історичні P1…P12 у PRD або E/U у specs та не додає нових features.
Джерела істини: `docs/PRD.md`, `docs/architecture.md` і сценарії
`openspec/changes/06-scoped-export/specs/`. Якщо зміст суперечить їм, спершу
узгодьте рішення й оновіть пов'язані артефакти; worker не обирає версію сам.

## Чотири запитання до вимоги

| Prefix | Значення | На яке запитання відповідає |
| --- | --- | --- |
| FR-* | Functional Requirement — функціональна вимога | Що користувач або система може зробити? |
| NFR-* | Non-Functional Requirement — вимога до якості | Наскільки добре і за яких умов це має працювати? |
| TC-* | Technical Constraint — технічне обмеження | Які технології, формати й архітектурні межі задані? |
| BC-* | Business / UX Constraint — бізнесове або UX-обмеження | Яке продуктове правило або межу згоди не можна порушити? |

Класифікуємо за основним наміром. Це конвенція проєкту, а не універсальна
таксономія: privacy може мати і функціональні сценарії, і вимоги до якості.
Замість дублювати суперечливі формулювання — посилаємося на один стабільний ID.
ID не є тестом: до нього потрібні конкретна умова, очікування й доказ.

## Реєстр для поточного зрізу

| ID | Узгоджена вимога | Сценарії / межі доказу |
| --- | --- | --- |
| FR-EXPORT-01 | У filtered експортувати перетин provider, видимого member, exact model та включних UTC-днів. Невідомі моделі зберігаються; portable attribution залишається оригінальною. | E2, E7, E12; U1, U2. Ручні expected usage IDs, дата на кожній межі, unknown model і local display alias. |
| FR-EXPORT-02 | Завантажений portable v1 bundle валідний, включає лише потрібні machines у filtered і допускає порожній результат. | E5, E6; BundleSchema та точні масиви IDs у реальному файлі. |
| FR-EXPORT-03 | Користувач явно бачить scope і актуальні filters; помилка не імітує успіх і дозволяє повторити дію. | U1, U2, U4, U5; browser interaction + download/error assertions. |
| NFR-ACCESS-01 | Нові controls доступні з клавіатури, мають пов'язані labels і не створюють горизонтального overflow при 375 px. | U3; keyboard, focus і viewport checks. Це не доказ повної accessibility-сертифікації. |
| NFR-INTEGRITY-01 | Зберегти IDs і token counts; selector не мутує вхід; повторний імпорт не дублює записи. | E2, E6 та design selector; точні значення, snapshot входу, повторний import. |
| TC-STACK-01 | Node 24, Next.js App Router, TypeScript strict, npm lockfile. | AGENTS.md, architecture, package/config; check і build на зафіксованій ревізії. |
| TC-SERVER-01 | SQLite, читання файлів, parsing і pricing залишаються server/CLI; selector чистий, UI не імпортує server runtime. | Architecture/design; import review, unit tests, build. |
| TC-FORMAT-01 | Portable v1 і чинні schema limits: 20 MiB на файл, 20 000 записів у кожному usage/prompts, 100 machines; без міграції БД. | Чинний src/lib/schema.ts і transfer; schema/API checks. Не нове підвищення лімітів. |
| BC-PRIVACY-01 | Prompts вимкнені за замовчуванням; лише явний opt-in і лише human prompts. У filtered — власні provider/member/date та повний session tuple вибраного usage. | E8–E10, default-export scenario; exact prompt IDs і відсутність зайвого тексту у файлі. |
| BC-COMPAT-01 | Default all зберігає старий експорт; opt-in all включає й prompt-only sessions. Валідні filters в all ігноруються, невалідний запит відхиляється. | E1, E3, E4, E11 та prompt-inclusive round-trip scenario. |
| BC-LOCAL-01 | Без telemetry, cloud sync та автоматичного сканування домашніх тек; навчальні fixtures синтетичні. | PRD/AGENTS/design review; перевірити нові I/O та dependency зміни. |
| BC-COST-01 | USD — API-equivalent estimate, не рахунок за підписку. Unknown usage зберігається як unpriced. | Чинний PRD/pricing; export не переоцінює і не відкидає unknown usage. |

Це не новий performance SLO: приклад TTFB < 300 ms з іншого воркшопу сюди
не переносимо. Нові числові вимоги потребують продуктового рішення, умов виміру
та базової лінії. Вимоги NFR/TC/BC супроводжують зріз від планування до review.

## Capability → вертикальний зріз → задачі

**Capability** — здатність продукту дати користувачу результат. **Вертикальний
зріз** — малий завершений варіант цієї здатності через усі потрібні шари.
**Задача worker** — обмежена частина реалізації; сама може не давати результат
користувачу. Розбиття на frontend/backend не утворює два capability slices.

| Рівень | Наш приклад | Коли готово |
| --- | --- | --- |
| Capability | Поділитися потрібними usage-даними команди | Користувач отримує контрольований переносимий результат. |
| S1 — поточний вертикальний зріз | Вибрати all/filtered, завантажити валідний файл з коректним privacy default | UI → API → selector → JSON → acceptance на одній ревізії. |
| OpenSpec change | 06-scoped-export | Одна погоджена зміна з dashboard і team-exchange spec areas. |
| Worker A | Pure selector + unit tests | Контракт і його сценарії виконані; це ще не готовий S1. |
| Worker B | Controlled scope fields + markup checks | Компонент відповідає props; це ще не browser flow. |
| Orchestrator + checker | Wiring, незалежні cases, final gates, review | Докази стосуються інтегрованого S1. |

`dashboard` і `team-exchange` — наявні області специфікації. Одна вертикальна
зміна може зачіпати обидві. Не створюємо окремі features лише заради паралелізму.
Нинішній lab — один S1; наступні capability slices не запускаємо, поки не
погоджені їхні outcomes і залежності. Спочатку стабільний контракт, потім A/B.

## Мінімальна матриця: намір → доказ

| Requirement | Slice / change | Scenario | Tasks | Очікуваний доказ | Статус |
| --- | --- | --- | --- | --- | --- |
| FR-EXPORT-01 | S1 / 06-scoped-export | E2, U1/U2 | 2.1, 2.2, 3.2, 3.3 | JSON: usage IDs дорівнюють ручному expected set; request відповідає поточним filters. | planned; не виконано |
| BC-PRIVACY-01 | S1 / 06-scoped-export | E8–E10 | 2.1, 3.2, 3.3, 3.4 | Default prompts=[]; opt-in collision [U1]/[PA]/[A]; sessionId-only mutation red → restore green. | planned; не виконано |
| NFR-ACCESS-01 | S1 / 06-scoped-export | U3 | 2.2, 3.3, 4.2 | Клавіатурна взаємодія і download при 375 px без overflow. | planned; не виконано |
| BC-COMPAT-01 | S1 / 06-scoped-export | E1/E3/E4/E11 | 2.1, 3.2, 4.2 | Legacy запити, strict invalid request, round trip з prompt-only session. | planned; не виконано |
| TC-SERVER-01 | S1 / 06-scoped-export | Design boundary | 1.2, 2.1, 2.2, 3.1, 4.1 | Type-only DTO imports, review server boundary, check/build. | planned; не виконано |

Tasks — навігація до чинного `tasks.md`, не заміна читання його формулювань.
Перед dispatch звірте номери з поточною ревізією. Для 3.4 публічний U1/U2/U3 доповнює окремий held-out case checker
(див. guide); обидва потребують спостереженого red/green. Повний scenario ledger є в
[evidence-template.md](evidence-template.md); таблиця вище показує ключові ланцюжки.
Статус `verified` дозволений лише з revision, реальною командою/дією та результатом.
Посилання на test file або зелений worker-звіт самі по собі цього не доводять.

## Вправа

«Додати кнопку export» ще не визначає результат. Переформулюйте як FR,
додайте privacy BC, accessibility NFR і server TC. Проведіть кожен до сценарію
та доказу. Потім назвіть мінімальний slice і лише після цього задачі workers.
Якщо не можете сказати, який файл має завантажитися, декомпозиція ще передчасна.

Підхід адаптовано з Weather Explorer:
[PRD](https://github.com/koldovsky/weather-explorer/blob/master/docs/prd.md),
[capability plan](https://github.com/koldovsky/weather-explorer/blob/master/docs/mvp-capability-plan.md),
[traceability matrix](https://github.com/koldovsky/weather-explorer/blob/master/docs/qa/traceability-matrix.md).
Запозичуємо структуру, а відповідність IDs і фактичні докази перевіряємо тут заново.
