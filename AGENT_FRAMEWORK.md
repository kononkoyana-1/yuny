# **Agent Framework — Yuny**

> **Статус:** Фаза 0 (`TZ.md §19`) пройдена. `frontend-builder` и
> `design-system-agent` формализованы (§9, §14 Шаг 2) с реальными Boundaries и
> Knowledge References, выведенными из того, что действительно произошло в
> Фазе 0 — не абстрактно. `supabase-engineer` и `qa-agent` пока не созданы —
> формализуются перед Фазой 6 и Фазой 9 соответственно (§14 Шаг 5).
> **Утверждённые решения:**
> 1. Domain-check выполняется встроенным `code-review` skill вручную перед handoff —
>    отдельный постоянный агент `spec-guardian` **не создаётся**.
> 2. Ростер зафиксирован на **4 агентах** (§9): `frontend-builder`, `supabase-engineer`,
>    `design-system-agent`, `qa-agent`. Отдельный `i18n-agent` не нужен — i18n покрыт
>    Skill'ом `screen-scaffold`.
> 3. Skills создаются по мере первой реальной необходимости (§14 Шаг 4), не
>    пакетом заранее — на конец Фазы 0 ни один Skill ещё не понадобился как
>    отдельный `.claude/skills/*/SKILL.md` (нарезка маскота была разовым
>    скриптом, не оформленным как Skill).
>
> **Среда:** Claude Code. Модель из задания маппится на его реальные примитивы,
> а не реализуется абстрактно.
> **Приоритет:** `TZ.md` остаётся Knowledge (source of truth продукта).
> Этот файл — Knowledge о том, **как работает сама система агентов**.

---

## **0. Маппинг: абстрактная модель → Claude Code**

| Концепция задания | Механизм Claude Code |
| ----- | ----- |
| Agent | `.claude/agents/<name>.md` — frontmatter (`name`, `description`, `tools`) + системный промт. Вызывается через `Agent` tool с `subagent_type: <name>` |
| Skill | `.claude/skills/<name>/SKILL.md` — frontmatter (`name`, `description`) + процедура. Вызывается через `Skill` tool |
| Knowledge | `docs/*.md`, `TZ.md`, `techical_core.md` — уже существуют, версионируются в git |
| Memory (per-agent, project-specific) | `.claude/memory/<agent-slug>/*.md` — **новый слой**, версионируется в git. Не путать с личной auto-memory системой Claude Code (та — про пользователя, не про проект) |
| Context assembly | Промт, который Orchestrator составляет перед `Agent` tool call — вручную, по правилам §5 |
| Orchestrator | Основная сессия Claude Code (я) — использует `Agent`, задачи-трекер, `ToolSearch`, `Skill` |
| Fork | `subagent_type: "fork"` — наследует полный контекст, для расследований, не для специализированной работы |
| Handoff | Финальное сообщение субагента + структурированный отчёт по шаблону §8 |
| Validation | Комбинация: `tsc`/`eslint`/тесты (Rule-check) + `code-review` skill (Domain-check) + запуск на платформах (Integration-check) |

**Важное следствие:** субагент, запущенный не как `fork`, стартует **без памяти**. Поэтому Memory для специализированных агентов не может жить «в голове» агента между вызовами — она должна быть файлом, который Orchestrator явно читает и подкладывает в промт при следующем вызове того же агента. Это прямое архитектурное требование, а не опция.

---

## **1. Core Model — как выглядит один Agent**

Каждый `.claude/agents/<slug>.md` в финальной реализации будет состоять из:

```markdown
---
name: <slug>
description: <когда Orchestrator должен его выбрать>
tools: <список или *>
model: <опционально>
---

# Identity
Роль, цель, принципы. 2-4 предложения.

# Responsibilities
Что именно делает. Список.

# Boundaries
Что НЕ делает. Явный список — не домысливается.

# Knowledge References
Какие разделы Knowledge читать перед работой (не всё, см. §5).

# Validation
Какому Validation Pipeline (§7) подчиняется результат.
```

**Skills и Memory не пишутся внутрь агента.** Skills подключаются по необходимости через `Skill` tool изнутри задачи; Memory подгружается Orchestrator-ом в промт при спавне (§5). Это разделение — прямое следствие принципа 10: *«Reuse Skills before creating new Agents»* и принципа 11: *«Do not duplicate knowledge between agents»*.

---

## **2. Knowledge — источник истины**

Knowledge **не меняется автоматически**. Иерархия приоритета зафиксирована уже в `TZ.md`:

```
TZ.md → MVP Product Specification.md → PRD V2.md → promt.md (архивный)
```

Этот документ (`AGENT_FRAMEWORK.md`) добавляется на тот же уровень, что `TZ.md`, но для другого домена — не продукта, а самой системы агентов.

**Правило записи в Knowledge.** Ни один агент не редактирует `TZ.md`, `techical_core.md` или этот файл напрямую. Изменение Knowledge — это **предложение** (см. Memory Promotion, §11), которое Orchestrator показывает пользователю как diff и применяет только после явного подтверждения. Это механическая реализация принципа 12: *«Do not allow agents to silently override project decisions»*.

**Индекс Knowledge** (что где искать):

| Домен | Файл |
| ----- | ----- |
| Продуктовая модель, Learning Loop, принципы | `docs/PRD V2.md` |
| Экраны, screen states, UX-детали | `docs/MVP Product Specification.md` |
| Финальный стек, архитектура клиента, DoD, план фаз | `TZ.md` |
| Обоснование выбора стека (историческое) | `techical_core.md` |
| Как устроена сама система агентов | `AGENT_FRAMEWORK.md` (этот файл) |
| Система агентов учебного контента | `docs/CONTENT_AGENTS.md` |
| Реестр решений (после реализации) | `.claude/knowledge/decisions.md` — новый файл, накопительный лог `FE-xx`/`AGT-xx` |

---

## **3. Memory — структура**

```
.claude/memory/
├── frontend-builder/
│   ├── working.md      # текущая фаза, что в процессе
│   ├── episodic.md     # «делал экран X, столкнулся с Y, решил Z»
│   ├── semantic.md     # обобщения: «Activity-рендереры лучше начинать с Zod-схемы»
│   ├── decision.md     # локальные технические решения агента + причины
│   └── feedback.md     # правки, полученные от code-review / пользователя
├── supabase-engineer/
│   └── (та же структура)
├── design-system-agent/
│   └── (та же структура)
├── qa-agent/
│   └── (та же структура)
└── shared/
    └── cross-agent.md  # Shared Memory — то, что нужно нескольким агентам сразу
```

**Правило.** Каждый файл — не журнал всего подряд, а отфильтрованный список того, что реально пригодится в будущей задаче (принцип 9: *relevant, не maximum*). Целевой размер `episodic.md` на агента — не более ~50 записей, дальше старое уходит в `semantic.md` (обобщение) или архивируется.

**Private vs Shared.** По умолчанию память приватна агенту. В `shared/cross-agent.md` попадает только то, что явно промотировано (§11) — например, «маскот-компонент принимает `stage: 1-5`, ассетов на стадии пока нет» нужно и `frontend-builder`, и `design-system-agent`.

---

## **4. Skills — переиспользуемые способности**

Skill ≠ Agent. Skill — процедура, которую вызывает любой агент. Планируемый каталог для Yuny (создаются по мере необходимости, не все сразу):

| Skill | Purpose | Кто использует |
| ----- | ----- | ----- |
| `screen-scaffold` | Создать экран по шаблону TZ.md §10: primary action, states (loading/empty/error), i18n-ключи | frontend-builder |
| `activity-renderer-scaffold` | Добавить новый тип Activity в реестр (TZ.md §9) — один файл + одна строка | frontend-builder |
| `repository-pair-scaffold` | Создать mock + supabase реализацию репозитория по интерфейсу (TZ.md §6) | frontend-builder, supabase-engineer |
| `edge-function-scaffold` | Создать Edge Function с Zod-валидацией входа/выхода по контракту TZ.md §6 | supabase-engineer |
| `migration-scaffold` | Создать миграцию Postgres с RLS-политикой SELECT-only (TZ.md §5) | supabase-engineer |
| `token-sync-check` | Проверить, что `tokens.ts` и `tailwind.config.js` не разошлись | design-system-agent |
| `dod-check` | Прогнать чек-лист TZ.md §18 (tsc, eslint, платформы, i18n, a11y) | qa-agent, все перед handoff |
| `mascot-asset-export` | Нарезать спрайт-лист на mood-варианты, экспорт @1x/@2x/@3x | design-system-agent (разовый) |

Это **предложенный каталог**, не финальный список — расширяется по мере работы, но новый Skill создаётся только когда существующий агент реально в нём нуждается (принцип 10), не заранее «про запас».

**Domain-check выполняет встроенный `code-review` skill Claude Code**, не отдельный проектный `spec-compliance-check`. Orchestrator запускает его вручную перед каждым handoff, передавая ему в промпте актуальные разделы `TZ.md` (решения `MVP-x.xx`/`TECH-42.xx`/`FE-01.xx`, затронутые диффом) как критерий проверки — см. §7.

---

## **5. Context Assembly**

Формула контекста для каждого спавна субагента:

```
Context = Task
        + Agent Identity (из .claude/agents/<slug>.md)
        + Relevant Knowledge (конкретные секции TZ.md/PRD, не весь файл)
        + Relevant Memory (working.md текущего агента + relevant записи из episodic/semantic)
        + Skills (список доступных, не их полное содержимое — Skill сам подгрузится при вызове)
        + Constraints (Boundaries агента + затронутые Product Decisions)
```

**Практическое правило для Orchestrator-а:** перед вызовом `Agent` для, скажем, `frontend-builder` на задаче «Speaking activity renderer» — в промт идёт не весь `TZ.md`, а:
- §9 (Activity) и §11 (Mascot, если завязано на reaction) целиком;
- §3 «Три правила» — всегда, это глобальные ограничения;
- содержимое `.claude/memory/frontend-builder/working.md` и релевантные строки `episodic.md` (по grep на «speaking», «activity», «audio»).

Не подкладывать: разделы про Supabase-миграции, Profile, Settings — они не relevant этой задаче.

---

## **6. Execution Cycle**

Каждая задача агента проходит:

```
Understand → Plan → Execute → Validate → Reflect → Handoff
```

| Шаг | Что происходит | Механизм |
| ----- | ----- | ----- |
| Understand | Агент читает Context, при неясности — задаёт вопрос Orchestrator-у, не гадает | явный вопрос в ответе, Orchestrator решает — уточнять у пользователя или нет |
| Plan | Список файлов, которые создаст/изменит — **до** кода (уже требование TZ.md §21.2) | текстовый план в начале ответа |
| Execute | Пишет код | Write/Edit |
| Validate | Проходит Validation Pipeline (§7) | `dod-check`, `spec-compliance-check` |
| Reflect | Обновляет свою Memory: что сработало, что нет, какое решение принял и почему | правка `.claude/memory/<slug>/*.md` |
| Handoff | Отчёт по шаблону §8 | финальное сообщение → Orchestrator |

Значимые изменения (новая таблица БД, новый Edge Function, отклонение от TZ.md) **не выполняются без остановки** — агент обязан явно перечислить цель/ограничения/зависимости/DoD перед выполнением, аналогично правилу TZ.md §21.2.4: если задача противоречит зафиксированному решению — остановиться и назвать, какому именно.

---

## **7. Validation Pipeline**

```
Output → Self-check → Rule-check → Domain-check → Integration-check
```

| Стадия | Что проверяется | Кем |
| ----- | ----- | ----- |
| Self-check | Агент сам сверяет результат со своим Plan | тот же агент |
| Rule-check | `tsc --noEmit`, `eslint`, тесты — механическая проверка | `dod-check` skill |
| Domain-check | Соответствие продуктовым решениям (`MVP-x.xx` и т.д.), архитектурным границам (TZ.md §4, §17) | встроенный `code-review` skill, запущенный Orchestrator-ом |
| Integration-check | Реальный запуск на iOS/Android/Web (или относящихся платформах для backend-задачи) | `run` skill / ручная проверка Orchestrator-ом |

**Независимый reviewer.** Для критичных изменений (новая таблица с RLS, изменение контракта Edge Function, что-либо в `_shared/los`) Domain-check выполняет **не тот же агент**, а Orchestrator, вызывая `code-review` skill отдельным проходом — принцип 7 требует не полагаться на самооценку автора для критичных вещей. Отдельный постоянный `spec-guardian`-агент решено не создавать (§14, решение 1) — ручной вызов `code-review` перед handoff достаточен на текущем масштабе проекта; вернуться к вопросу, если ручной шаг начнёт пропускаться на практике.

---

## **8. Handoff Template**

Каждый субагент завершает работу структурированным отчётом (это то, что Orchestrator читает и передаёт дальше или показывает пользователю):

```markdown
## Handoff — <agent-slug> · <дата>

**Input:** что было поручено (1 строка)
**Objective:** какую цель это преследовало в продукте

**Decisions:**
- решение 1 + почему
- решение 2 + почему

**Output:**
- файл A — создан/изменён, что делает
- файл B — создан/изменён, что делает

**Assumptions:** что предположил, если контекста не хватило

**Risks:** что может сломаться, что не проверено

**Open Questions:** что требует ответа пользователя или другого агента

**Validation:**
- [ ] Rule-check: tsc/eslint/tests — pass/fail
- [ ] Domain-check: spec-compliance — pass/fail, если fail — что нарушено
- [ ] Integration-check: платформы, на которых реально запускал — список

**Next Action:** что логично делать дальше
```

Это прямая реализация TZ.md §18 (Definition of Done) в форме, которую может прочитать следующий агент без восстановления полного контекста заново.

---

## **9. Предлагаемый ростер агентов**

Это **предложение состава**, не финальные Identity-карточки — они пишутся при реализации (§14). Состав выведен из фаз `TZ.md §19`.

| Agent | Отвечает за | Не делает | Основные Skills |
| ----- | ----- | ----- | ----- |
| **frontend-builder** | Экраны, features, Activity-рендереры, навигация (Фазы 0, 2–5, 7–9 TZ.md) | Не пишет миграции и Edge Functions, не принимает продуктовых решений | `screen-scaffold`, `activity-renderer-scaffold`, `repository-pair-scaffold` (mock-часть) |
| **supabase-engineer** | Миграции, RLS, Edge Functions, AI Gateway (Фаза 6 TZ.md) | Не трогает UI-код | `migration-scaffold`, `edge-function-scaffold`, `repository-pair-scaffold` (supabase-часть) |
| **design-system-agent** | Токены, примитивы `shared/ui`, маскот-компонент и ассеты (Фаза 0, 6 TZ.md) | Не реализует экраны, только примитивы | `token-sync-check`, `mascot-asset-export` |
| **qa-agent** | Maestro/Playwright/Jest флоу, Integration-check | Не пишет продуктовый код | `dod-check` |

**Ростер кода зафиксирован на 4 агентах (§14, решение 2).** С 2026-08-28 рядом
существует второй ростер — три агента учебного контента (`learning-agent`,
`content-agent`, `content-qa-agent`, см. `docs/CONTENT_AGENTS.md`). Это не
пересмотр решения 2: те четыре строят приложение, эти производят материал
внутри него, и ни одна пара Boundaries не пересекается. `content-qa-agent` —
не переименованный `qa-agent`: первый судит педагогику задания, второй
запускает Maestro/Playwright.

**Ростер зафиксирован на 4 агентах (§14, решение 2).** Backend/Frontend разделены, потому что у них не пересекающиеся Boundaries (TZ.md §3 «Правило 3») — это естественная граница, а не искусственное дробление. `qa-agent` — read-only/verification роль, отдельная от «создателей», чтобы соблюсти принцип 7 (не создатель — единственный судья качества). Domain-check (сверка с решениями `MVP-x.xx`/`TECH-42.xx`) выполняет не отдельный агент, а встроенный `code-review` skill, который Orchestrator вызывает вручную перед handoff (§7, §14 решение 1). Отдельного `i18n-agent` нет — i18n покрыт Skill'ом `screen-scaffold`, отдельная роль под него была бы избыточной специализацией, которую принцип 10 фреймворка прямо запрещает.

---

## **10. Orchestrator**

Orchestrator — это основная сессия Claude Code (я), не отдельный `.claude/agents/*.md` файл. Его обязанности 1:1 совпадают с §9 задания:

1. Получает задачу от пользователя;
2. Раскладывает на вертикальные срезы по фазам `TZ.md §19`;
3. Выбирает агента по таблице §9;
4. Проверяет, есть ли готовый Skill (§4), прежде чем разрешать агенту писать ad-hoc код;
5. Собирает Context по правилу §5;
6. Запускает субагента (`Agent` tool);
7. Получает Handoff (§8), прогоняет через Validation, если агент сам не завершил его полностью;
8. При Domain-check fail — возвращает агенту с конкретным указанием, что нарушено;
9. Обновляет Memory агента (`.claude/memory/<slug>/`) фактами из Handoff;
10. Показывает пользователю результат и Open Questions;
11. Решает, нужно ли промотировать что-то из Memory в Knowledge (§11).

Orchestrator **не выполняет специализированную работу сам**, когда для неё есть агент — это соответствует принципу «Orchestrator не обязан самостоятельно выполнять специализированную работу». Исключение — быстрые, тривиальные правки (одна строка, опечатка), где спавн агента дороже самой правки.

---

## **11. Memory Lifecycle & Promotion**

```
Capture → Classify → Validate → Store → Retrieve → Use → Update → Archive
```

| Шаг | Правило |
| ----- | ----- |
| Capture | Агент фиксирует наблюдение только на шаге Reflect (§6), не посреди Execute |
| Classify | Working / Episodic / Semantic / Decision / Feedback — агент сам определяет тип по определениям §2 задания |
| Validate | Перед записью — не противоречит ли уже существующей Memory того же агента? Если да — конфликт разрешает Orchestrator, не агент молча |
| Store | Файл в `.claude/memory/<slug>/` |
| Retrieve | Orchestrator при следующем спавне (§5) |
| Update | При повторяющемся паттерне — Episodic обобщается в Semantic |
| Archive | Записи старше ~N задач или явно устаревшие — переносятся в `<file>.archive.md`, не удаляются |

**Promotion — отдельный процесс:**

```
Private Memory → Candidate Insight → Validation → Shared Knowledge
```

Пример: `frontend-builder` три раза в `episodic.md` фиксирует «Rive-стейт-машина требует ручной синхронизации mood после reconnect». Это Candidate Insight. Orchestrator решает, тянет ли это на правило продукта — если да, показывает пользователю предложенный diff в `TZ.md` (новый пункт в §11 или Risk), и **только после подтверждения пользователя** это становится Knowledge (`FE-01.16` и т.п.). Без подтверждения — остаётся частной Memory агента. Это прямая реализация принципа 8: *«Private experience must not automatically become project truth»*.

---

## **12. Workflows — типовой проход по фазе**

Пример: Фаза 5 «Learning loop» из `TZ.md §19`.

```
1. Orchestrator читает TZ.md §9, §19 (Фаза 5), .claude/memory/frontend-builder/working.md
2. Orchestrator формирует Context (§5) для frontend-builder:
   задача = "vocabulary_choice renderer + ActivityShell state machine"
3. Agent(frontend-builder, context) → Plan → Execute → Self-check → Handoff
4. Orchestrator прогоняет dod-check (Rule-check)
5. Orchestrator запускает spec-guardian с диффом → Domain-check
   - если fail: возврат frontend-builder с конкретным пунктом
6. Orchestrator запускает qa-agent → Integration-check на 3 платформах
7. Orchestrator обновляет .claude/memory/frontend-builder/{working,episodic}.md
8. Orchestrator показывает Handoff пользователю, отмечает Open Questions
9. Следующая задача фазы — повтор с п.2
```

Backend-эквивалент (Фаза 6) идёт через `supabase-engineer` + `migration-scaffold`/`edge-function-scaffold`, с тем же Validation Pipeline, но Integration-check — это применение миграции на локальном Supabase и вызов функции, а не запуск на платформах.

---

## **13. Принципы — как они применены здесь**

| Принцип задания | Как реализован в этом документе |
| ----- | ----- |
| Agents perform work | §9 — только исполнительные роли, никаких «менеджерских» агентов |
| Skills define capabilities | §4 — процедуры отделены от агентов, переиспользуются |
| Knowledge defines truth | §2 — иерархия приоритета, запрет прямой правки |
| Memory preserves experience | §3 — per-agent файлы, не общая свалка |
| Context determines what agent sees | §5 — явная формула, не «весь TZ.md» |
| Orchestration determines who acts | §10 |
| Validation determines what can be trusted | §7 — 4-стадийный pipeline, независимый reviewer для критичного |
| Private experience ≠ project truth | §11 — Promotion только через подтверждение пользователя |
| Relevant context > maximum context | §5 |
| Reuse Skills before new Agents | §9 — обоснование, почему ростер минимален |
| No knowledge duplication | §2 — единый индекс, а не копии в каждом агенте |
| No silent override | §2, §6 — агент останавливается при конфликте с решением |

---

## **14. Утверждённые решения и порядок реализации**

Три открытых вопроса закрыты:

1. **spec-guardian не создаётся.** Domain-check выполняет встроенный `code-review` skill, который Orchestrator запускает вручную перед каждым handoff, подкладывая ему релевантные разделы `TZ.md` (затронутые решения `MVP-x.xx`/`TECH-42.xx`/`FE-01.xx`) как критерий проверки. Меньше движущихся частей на масштабе одного разработчика + Orchestrator. Возврат к отдельному агенту — если ручной шаг на практике начнёт пропускаться.
2. **Ростер зафиксирован на 4 агентах:** `frontend-builder`, `supabase-engineer`, `design-system-agent`, `qa-agent` (§9). Отдельный `i18n-agent` не нужен — i18n покрыт Skill'ом `screen-scaffold` (каждый экран сразу требует i18n-ключей по TZ.md §10, отдельной роли под это не нужно).
3. **Реализация начинается не с `.claude/agents/*.md`, а с Фазы 0 `TZ.md §19`** — каркас Expo-проекта (монорепо, токены, примитивы `shared/ui`, нарезка `mascot.png`, EAS) без агентской обвязки. Причина: `frontend-builder` должен получить настоящий код для работы, прежде чем его Identity-карточка будет формализована — иначе Boundaries и Knowledge References в `.claude/agents/frontend-builder.md` пишутся вслепую, без единой реальной задачи, на которой их можно проверить.

### **Порядок:**

```
Шаг 1 — Фаза 0 (TZ.md §19), обычный режим работы, без .claude/agents         ✅ done 2026-08-26
   ↓
Шаг 2 — по итогам Фазы 0 формализовать .claude/agents/frontend-builder.md
         и .claude/agents/design-system-agent.md (оба уже проявили себя      ✅ done 2026-08-26
         на Фазе 0)
   ↓
Шаг 3 — .claude/memory/<slug>/ создаются рядом с первым агентом              ✅ done 2026-08-26
   ↓
Шаг 4 — Skills создаются по мере первой реальной необходимости (§4),         ⏳ pending
         не пакетом заранее
   ↓
Шаг 5 — supabase-engineer и qa-agent формализуются перед Фазой 6 и Фазой 9   ⏳ pending
         соответственно (TZ.md §19) — когда для них появится работа
```

**Что фактически создано на Шаге 2/3:**

- `.claude/agents/frontend-builder.md`, `.claude/agents/design-system-agent.md` —
  Identity/Responsibilities/Boundaries/Knowledge References/Validation,
  выведенные из реальных решений Фазы 0 (не абстрактно — см. §14 Шаг 3 ниже
  для примеров), с явными `tools:` (без `Agent`, без `Artifact` — эти агенты
  не спавнят субагентов и не публикуют артефакты).
- `.claude/memory/frontend-builder/{working,episodic,semantic,decision,feedback}.md`
  и `.claude/memory/design-system-agent/{...}.md` — структура из §3.
  `episodic.md` и `decision.md` **не пустые**: Фаза 0 была реальной
  завершённой задачей, поэтому Reflect (§6) применён сразу — записан опыт
  version-pinning (TS/Tailwind/ESLint `latest` не подошли трижды),
  pnpm+Metro resolution issue с `react-native-css-interop`, и техника
  flood-fill для удаления фона маскота. `working.md`, `semantic.md`,
  `feedback.md` пустые по правилу — соответствующих событий (текущая задача
  в процессе / повторившийся паттерн / полученная правка) ещё не было.
- `.claude/memory/shared/cross-agent.md` — пока пуст, ничего ещё не
  промотировано (§11 применяется только когда факт нужен двум и более
  агентам).

**Что осталось (Шаг 4/5):** ни один Skill из каталога §4 ещё не оформлен как
отдельный `.claude/skills/*/SKILL.md` — нарезка маскота была одноразовым
скриптом `scripts/slice-mascot.mjs`, не Skill'ом; `token-sync-check` и
`mascot-asset-export` оформляются в Skill, когда возникнет вторая реальная
потребность в них (принцип «reuse before creating», §12). `supabase-engineer`
и `qa-agent` — не раньше Фазы 6/9.
