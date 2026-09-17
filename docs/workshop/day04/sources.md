# Day04: походження та межі матеріалів

Підготовлено 16.09.2026; доповнено 17.09.2026. Навчальна мова — українська, основний інструмент —
Codex. Формат 150 хвилин береться з плану всього курсу. Теоретичний блок
day04 займає за планом 80 хвилин, від 05 до 85 хвилини. Це навчальний
таймінг, не хронометраж виконаного заняття. Окремий 90-хвилинний варіант у
day04 guide є скороченим проходженням для підготовлених практиків.

## Навчальний контекст

- План курсу та матеріали попередніх занять: clickable links, copyable commands,
  browser handout, українська мова та фактичні verification results.
  Приватні чати й ідентифікатори робочих сесій не входять у публічний пакет.
- Sibling slides repo `2026-agentic-engineering-crash-course`: `README.md`,
  `AGENTS.md`, `docs/authoring-kit.md`, `docs/plans/day03-05-usage-dashboard.md`,
  `pages/day01/01-course.md`, day03 closing і LMS homework.
- Поточні [PRD](../../PRD.md), [architecture](../../architecture.md),
  [data contract](../../data-contract.md), [day03 guide](../guide.md),
  [living specs](../../../openspec/specs) та реальний export route/controls.

## Як план адаптовано

Старий day04 outline пропонував паралельно додати Codex ingest і pricing.
У Token Atlas обидві можливості вже реалізовані. Зберігаємо теми курсу:
DAG, orchestrator-worker, model routing, вартість сабагентів, worktrees,
false parallelism і maker/checker. Практична зміна тепер `06-scoped-export`.
Новий номер не оголошує завершеним pending `05-reference-design`.

Day03 baseline: `workshop-05-dashboard`, commit
`48b586606503e126075cec4973e388457e26f247`.
[Публічний стартовий стан](https://github.com/koldovsky/2026-agentic-engineering-crash-course-day03-alternative/tree/workshop-05-dashboard).
Day04 починається з [workshop-day04-start](https://github.com/koldovsky/2026-agentic-engineering-crash-course-day03-alternative/tree/workshop-day04-start):
матеріали, підготовлена зміна `06-scoped-export` і перевірені виправлення продукту.
Це стартовий стан; реалізація вправи та записаний агентний прогін не заявляються.

## Першоджерела теоретичного блоку

Ці сторінки відкрито й перевірено 16.09.2026:

- [NIST Dictionary of Algorithms and Data Structures: directed acyclic graph](https://xlinux.nist.gov/dads/HTML/directAcycGraph.html).
  Джерело визначення DAG як орієнтованого графа без циклів. Позначення вузлів
  як робіт, стрілок як передумов і приклад Token Atlas є застосуванням цього
  поняття в уроці, а не прикладом із NIST.
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).
  Стаття від 19.12.2024 описує workflows та agents, chaining, routing,
  parallelization, orchestrator-workers і evaluator-optimizer. Використовуємо
  її для порівняння архітектурних підходів. Сторінка застерігає, що tooling
  змінився після публікації; актуальні можливості клієнтів перевіряємо за
  технічною документацією нижче. Старі приклади моделей не є рекомендаціями
  для поточного уроку.

Розмежування context/worktree/sandbox пояснює різні механізми ізоляції.
Словник, інваріанти filtered export, oracle з очікуваними IDs, роль read-only
checker і навчальна мутація session key є методикою цього workshop.
Джерело продуктової поведінки — `06-scoped-export`, а не загальна стаття про
агентів. Послідовність теорії, таймінг і кількість слайдів записано в
[guide.md](guide.md#план-на-150-хвилин).

## Офіційна технічна документація

- [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents):
  делегування, standalone custom-agent configuration, успадкування налаштувань.
- [Claude Code subagents](https://code.claude.com/docs/en/subagents):
  capability lists, nesting і project definitions.
- [Claude Code worktrees](https://code.claude.com/docs/en/worktrees):
  starting ref, ізоляція checkout і cleanup.
- [Claude Code permissions](https://code.claude.com/docs/en/permissions):
  фактичні дозволи інструментів.
- [Agent teams](https://code.claude.com/docs/en/agent-teams):
  відмінність від звичайних subagents, optional experimental режим.
- [Costs](https://code.claude.com/docs/en/costs) і
  [CLI reference](https://code.claude.com/docs/en/cli-reference):
  usage versus estimate, print-mode caps.
- [Verification practices](https://code.claude.com/docs/en/best-practices):
  спостережуваний feedback і незалежний review.
- [Git worktree](https://git-scm.com/docs/git-worktree):
  окремі checkout зі спільним Git repository.

Команди agent UI можуть змінитися: [tooling.md](tooling.md) фіксує дату й
перевірку реальних capabilities перед заняттям. Installed OpenSpec 1.13.0
перевірено локальним CLI. Його artifact status не доводить реалізацію.
Фактичні результати підготовки додаються в [build-log](../build-log.md).

## Що не вимірювали

Числа у worked examples часу та вартості є **гіпотетичними навчальними
значеннями**, якщо не наведено окреме джерело вимірювання. Формули критичного
шляху і порівняння serial/parallel ілюструють модель виконання, не доводять
прискорення цього feature. Вони не задають тарифи або ліміти облікового запису.

Тривалість LLM exercise, вартість workers, speedup проти serial baseline,
успішність запропонованого нового export flow і runtime доступність кожної
sample agent configuration. Не видавати ці пункти за перевірений результат.
API-equivalent USD не є subscription invoice. Token Atlas не обіцяє автоматичне
відновлення дерева агентів або коректну attribution без окремого контракту.

## Вимоги, контекст і якість — редакція 17.09.2026

Прочитано публічні матеріали Weather Explorer:
[PRD](https://github.com/koldovsky/weather-explorer/blob/master/docs/prd.md),
[capability plan](https://github.com/koldovsky/weather-explorer/blob/master/docs/mvp-capability-plan.md),
[traceability matrix](https://github.com/koldovsky/weather-explorer/blob/master/docs/qa/traceability-matrix.md).
Адаптовано FR/NFR/TC/BC, вертикальний зріз і зв'язок вимога → scenario → proof.
Статуси й IDs іншого проєкту не перенесено: семантику нашої матриці звірено
з поточними PRD/design/specs/tasks. P/E/U IDs залишаються чинними.

Питання учасників із наданого чату використано як теми пояснень: якість тестів,
їх місце у workflow, передача контексту та acceptance AI-поведінки. Імена,
приватні посилання й transcript не переносяться в навчальні матеріали.

Перевірені першоджерела:

- [Playwright best practices](https://playwright.dev/docs/best-practices),
  [downloads](https://playwright.dev/docs/downloads),
  [waitForTimeout](https://playwright.dev/docs/api/class-page#page-wait-for-timeout):
  locators, ізоляція, web-first assertions, download-before-click і hard waits.
- [OpenSpec schema 1.13.0](https://github.com/Fission-AI/OpenSpec/blob/v1.13.0/schemas/spec-driven/schema.yaml)
  і [archive](https://github.com/Fission-AI/OpenSpec/blob/v1.13.0/src/core/archive.ts):
  звірено також локальні CLI/skills. Artifact validation не є запуском suite;
  evidence-before-archive — політика нашого AGENTS.md.
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md):
  правила інструмента не означають, що довільний rules-файл завантажиться сам.
- [ISTQB CTFL](https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf)
  і [Stryker metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/):
  значення coverage/mutation та межі інтерпретації.
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents):
  cases/trials/graders/outcomes. Навчальний приклад агента підтримки є окремим
  від Token Atlas; його нова AI-функція або виміряні evals не заявляються.

Нові handouts: requirements.md, context-packet.md, quality.md. Приклади порогів,
timebox і протоколів є навчальними домовленостями, не результатами прогону.

## Готові visual-review skills — редакція 17.09.2026

- [web-design-reviewer: оригінальний SKILL.md](https://github.com/github/awesome-copilot/blob/main/skills/web-design-reviewer/SKILL.md)
  у community collection GitHub: прочитано процедуру огляду, потрібні browser
  capabilities, checklist і повторну перевірку після fixes. Команда встановлення
  є також у [каталозі skills.sh](https://www.skills.sh/github/awesome-copilot/web-design-reviewer).
  У нашій вправі роль checker обмежена review без source edits; це адаптація
  ролі, бо upstream skill також дозволяє виправлення. Встановлення не виконувалося.
- [Playwright: visual comparisons](https://playwright.dev/docs/test-snapshots):
  screenshot expectations, baseline та залежність знімків від середовища.
  Розрізнення critique/fidelity/regression, review baseline, контрольована
  геометрична помилка та інформаційна якість labels — методика цього workshop.

Ці джерела перевірено 17.09.2026. Популярність skill і його інструкції не є
benchmark якості на Token Atlas. Новий clone, інсталяція skill або screenshot
regression suite не оголошуються виконаними. Практичний scope лишається
`06-scoped-export`; іконки та неоднозначні identities — окремі case studies.
