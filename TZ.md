# **ТЗ — Yuny. Кросс-платформенное приложение (iOS · Android · Web)**

> **Статус:** финальная версия для передачи AI-агенту разработки.
> **Заменяет:** `promt.md` и `techical_core.md` (обе версии описывали native iOS / SwiftUI).
> **Источники:** `docs/PRD V2.md`, `docs/MVP Product Specification.md`, `promt.md`, `techical_core.md`, `assets/image/mascot.png`.
> **Приоритет при конфликте:** этот документ → `MVP Product Specification.md` → `PRD V2.md` → `promt.md`.

---

## **0. Что изменилось относительно предыдущей версии**

| Было | Стало | Причина |
| ----- | ----- | ----- |
| Native iOS: Swift / SwiftUI / Xcode | Expo (React Native) + React Native Web + TypeScript | Требование: iOS + Android + Web из одной кодовой базы, быстрая упаковка |
| Backend «не создавать, пока не нужен» | TypeScript + Supabase, определён с первого дня как контракт | Backend-стек зафиксирован заказчиком |
| Mock data навсегда локально | Mock-first через Repository-интерфейс, переключаемый на Supabase одним флагом | Сохраняет скорость frontend-разработки, убирает переписывание |
| Tab Bar: Home / Learn / Goals / Profile | **Home / Goal / Library / Profile** | `MVP-3.01`; «Learn» отклонён — противоречит принципу *one best next action* |
| Маскот — placeholder (SF Symbols / шейпы) | Реальный ассет `assets/image/mascot.png`, 4 mood-состояния | Ассет получен |
| 31 экран в промте / 19 в MVP Spec | **19 screen states**, остальное — состояния внутри них | `MVP-4.01`, `MVP-4.12` |

Продуктовые решения (`MVP-3.xx`, `MVP-4.xx`, `NAV-28.xx`, `IA-27.xx`, `TECH-42.xx`) **не меняются**. Меняется только исполнение.

---

## **1. Продукт за 60 секунд**

Yuny — **Learning Operating System** для изучения языка.

Пользователь называет жизненную цель («получить работу в международной компании»), дедлайн и сколько времени реально готов уделять. Система превращает это в **языковые требования**, оценивает текущий уровень, строит стратегию и на каждом шаге выдаёт **одно следующее наиболее полезное действие** с объяснением, почему именно оно.

```
Goal + Deadline + Available Time
   ↓
AI Feasibility Analysis → Goal Adjustment
   ↓
Initial Assessment → Learning State
   ↓
Learning Strategy
   ↓
Dashboard + Mascot
   ↓
Recommendation → Mission → Activities
   ↓
Evidence → Learning State Update → Mascot Growth
   ↓
Next Recommendation
```

**Ключевой продуктовый принцип.** Приложение не ставит пользователю жизненные цели. Оно развивает языковые навыки, необходимые для их достижения.

> ❌ «Снять квартиру»
> ✅ «Развить языковые навыки, необходимые для поиска и аренды жилья»

Язык остаётся центральным объектом продукта.

**Это не** курс, **не** чат-бот, **не** тамагочи с языком, **не** каталог уроков.

---

## **2. Технологический стек — зафиксирован**

### **Frontend**

| Слой | Технология |
| ----- | ----- |
| Язык | TypeScript, `strict: true` |
| Платформа | Expo (последний стабильный SDK) + React Native + React Native Web |
| Роутинг | `expo-router` (file-based, typed routes) |
| Server state | TanStack Query |
| Client state | Zustand — только эфемерный UI-стейт |
| Стилизация | NativeWind v4 |
| Формы | react-hook-form + zod resolver |
| Анимация | react-native-reanimated + moti |
| Аудио | `expo-audio` + web-адаптер на `MediaRecorder` |
| Медиа/файлы | `expo-document-picker`, `expo-image-picker`, `expo-camera`, `expo-file-system` |
| Push | `expo-notifications` |
| Хранилище | `expo-secure-store` (native), MMKV/AsyncStorage (кэш) |
| i18n | i18next + `expo-localization` |
| Ошибки | `@sentry/react-native` |
| Аналитика | PostHog |
| Тесты | Jest + React Native Testing Library · Maestro (E2E) · Playwright (web) |
| Сборка | EAS Build / Submit / Update |

### **Backend**

| Слой | Технология |
| ----- | ----- |
| Платформа | Supabase |
| БД | Postgres + Row Level Security |
| Аутентификация | Supabase Auth |
| Файлы | Supabase Storage (buckets `materials`, `recordings`) |
| Серверная логика | Supabase Edge Functions (Deno, TypeScript) |
| Асинхронные статусы | Supabase Realtime (таблица `jobs`) |
| Типы | `supabase gen types typescript` → `packages/shared/database.types.ts` |

### **Инструменты**

pnpm workspaces + Turborepo · ESLint + Prettier · `tsc --noEmit` в pre-commit · GitHub Actions.

**Перед установкой пакетов проверь актуальные версии.** Не полагайся на версии из памяти. Ставь через `npx expo install`, а не `npm install`, чтобы версии совпадали с SDK.

**Запрещено без явного разрешения:** UI-киты (NativeBase, Tamagui, gluestack, RN Paper), state-менеджеры сверх Zustand, ORM поверх Supabase, навигационные библиотеки помимо expo-router, любые пакеты, ломающие web-таргет.

---

## **3. Архитектура системы**

```
┌──────────────────────────────────────────────┐
│                 CLIENT                        │
│        Expo · iOS / Android / Web             │
│                                               │
│  UI · navigation · local UI state             │
│  захват ввода и медиа · рендер рекомендаций   │
└───────────────────┬──────────────────────────┘
                    │  supabase-js
        ┌───────────┴────────────┐
        ↓                        ↓
┌────────────────┐   ┌──────────────────────────┐
│ Postgres + RLS │   │     Edge Functions        │
│                │   │   = LOS Core + AI Gateway │
│ SELECT-only    │   │                           │
│ для клиента    │   │ Goal · Learning State     │
│                │◄──┤ Evidence · Decision       │
│ Realtime: jobs │   │ Strategy · Mission        │
└────────────────┘   │ Recommendation            │
                     └───────────┬──────────────┘
                                 ↓
                     ┌──────────────────────────┐
                     │      AI Providers         │
                     │  LLM · Speech · Embedding │
                     └──────────────────────────┘
```

### **Три правила, которые нельзя нарушать**

**Правило 1 — `TECH-42.03`. Клиент не принимает образовательных решений.**

Клиент **никогда** не вычисляет локально:

* Readiness и прогресс к цели;
* Learning State и уровни навыков;
* приоритет навыков («speaking — твой главный пробел»);
* выбор следующей Activity или Mission;
* оценку ответа пользователя (правильно / неправильно / насколько);
* стадию и настроение Mascot;
* feasibility и любые прогнозы по дедлайну.

Всё это приходит с backend готовым. Если для экрана не хватает поля — **проси добавить поле в контракт**, не считай его на клиенте.

**Правило 2 — `PRD гл. 21 §32`. Никаких прямых вызовов AI-провайдеров с клиента.**

Отклонено явно: «создаёт проблемы безопасности, контроля и архитектурной связности». Ключи AI-провайдеров живут только в секретах Edge Functions. В клиентском бандле их нет и быть не может.

**Правило 3 — записи только через Edge Functions.**

RLS-политика для клиента: **SELECT собственных строк во всех доменных таблицах, INSERT/UPDATE — запрещён**. Исключения: `profiles` (свой профиль) и загрузка файлов в собственные папки Storage.

Любое изменение домена (создать Goal, отправить ответ, обновить Learning State) идёт через Edge Function с service role. Это техническое воплощение Правила 1 — клиент физически не может испортить образовательное состояние.

---

## **4. Структура монорепозитория**

```
yuny/
├── apps/
│   └── mobile/                    # Expo — iOS · Android · Web
│       ├── app/                   # expo-router: только композиция
│       │   ├── (onboarding)/
│       │   │   ├── welcome.tsx
│       │   │   ├── language.tsx
│       │   │   ├── goal-setup.tsx
│       │   │   ├── goal-analysis.tsx
│       │   │   ├── goal-confirm.tsx
│       │   │   ├── assessment.tsx
│       │   │   ├── assessment-result.tsx
│       │   │   └── strategy.tsx
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx    # Home · Goal · Library · Profile
│       │   │   ├── index.tsx      # Home
│       │   │   ├── goal.tsx
│       │   │   ├── library.tsx
│       │   │   └── profile.tsx
│       │   ├── mission/[id]/
│       │   │   ├── index.tsx      # Mission Overview
│       │   │   ├── activity.tsx   # Activity flow — все состояния здесь
│       │   │   └── result.tsx     # Mission Result
│       │   ├── material/add.tsx   # modal
│       │   ├── settings.tsx
│       │   ├── _layout.tsx
│       │   └── +not-found.tsx
│       ├── features/
│       │   ├── onboarding/  goal/  assessment/
│       │   ├── mission/  library/  profile/
│       │   ├── mascot/
│       │   └── activity/
│       │       ├── renderers/     # один файл на тип Activity
│       │       ├── registry.ts
│       │       ├── ActivityShell.tsx
│       │       └── machine.ts
│       ├── shared/
│       │   ├── repositories/      # интерфейсы + mock + supabase
│       │   ├── api/               # supabase client, TanStack Query hooks
│       │   ├── ui/                # примитивы
│       │   ├── platform/          # .ios.ts / .android.ts / .web.ts
│       │   ├── i18n/
│       │   └── config/            # токены дизайна, env
│       └── assets/
│           └── mascot/            # нарезанные спрайты
│
├── packages/
│   └── shared/                    # ЕДИНЫЙ контракт клиента и backend
│       ├── schemas/               # Zod-схемы домена
│       ├── types/                 # выводимые типы
│       └── database.types.ts      # сгенерировано supabase gen types
│
├── supabase/
│   ├── migrations/                # схема БД
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── ai/                # AI Gateway: generate/assess/transcribe/embed
│   │   │   └── los/               # LOS Core: decision, strategy, state
│   │   ├── goal-analyze/
│   │   ├── goal-confirm/
│   │   ├── assessment-next/
│   │   ├── assessment-complete/
│   │   ├── recommendation-get/
│   │   ├── mission-generate/
│   │   ├── activity-submit/
│   │   └── material-ingest/
│   └── seed.sql
│
├── assets/image/mascot.png        # исходный спрайт-лист
├── .maestro/                      # E2E-флоу
└── docs/
```

### **Правила границ**

* `app/` импортирует только из `features/` и `shared/ui`, бизнес-логики не содержит;
* `features/*` не импортируют друг друга напрямую — только через `packages/shared` и `apps/mobile/shared`;
* `shared/*` не импортирует из `features/` и `app/`;
* **`Platform.OS` запрещён в `features/` и `app/`** — вся платформенная специфика в `shared/platform/`;
* `packages/shared` не импортирует ничего из Expo или Deno — он общий для обеих сторон.

---

## **5. Модель данных (Supabase)**

Все таблицы: `id uuid pk`, `user_id uuid → auth.users`, `created_at timestamptz`, RLS включён.

| Таблица | Ключевые поля | Права клиента |
| ----- | ----- | ----- |
| `profiles` | `native_language`, `ui_language`, `display_name` | SELECT + UPDATE своего |
| `goals` | `raw_input`, `title`, `target_language`, `deadline`, `daily_minutes`, `status` (draft/active/paused/completed), `readiness_label`, `readiness_reason` | SELECT |
| `goal_outcomes` | `goal_id`, `label`, `description`, `position` | SELECT |
| `learning_states` | `goal_id`, `updated_at` | SELECT |
| `skill_states` | `learning_state_id`, `skill` (speaking/listening/vocabulary/grammar/reading/writing), `level`, `confidence`, `trend` | SELECT |
| `evidence` | `goal_id`, `activity_id`, `skill`, `strength`, `payload jsonb` | SELECT |
| `missions` | `goal_id`, `title`, `purpose`, `why`, `primary_skill`, `estimated_minutes`, `status` | SELECT |
| `activities` | `mission_id`, `type`, `payload jsonb`, `position`, `status` | SELECT |
| `activity_responses` | `activity_id`, `payload jsonb`, `submitted_at` | — (через Edge Function) |
| `feedback` | `activity_response_id`, `went_well`, `improve`, `example` | SELECT |
| `recommendations` | `goal_id`, `mission_id`, `reason`, `skills_affected` | SELECT |
| `materials` | `kind` (pdf/image/text/url), `storage_path`, `source_url`, `title`, `status` | SELECT |
| `public_resources` | `title`, `source_url`, `description`, `skills[]`, `language` | SELECT (публичные) |
| `mascot_states` | `stage` (1–5), `mood`, `growth_progress` | SELECT |
| `jobs` | `kind`, `status` (queued/running/done/failed), `result jsonb`, `error_code` | SELECT + **Realtime** |
| `events` | `name`, `payload jsonb` | — (`PRD гл. 42 §14`) |

**Storage**

* `materials/{user_id}/…` — PDF, изображения пользователя;
* `recordings/{user_id}/{activity_id}.m4a` — записи Speaking.

Обе корзины приватные, доступ по RLS-политике на `user_id`.

---

## **6. Контракт клиент ↔ backend**

### **Edge Functions**

| Функция | Вход | Выход |
| ----- | ----- | ----- |
| `goal-analyze` | `raw_input`, `target_language`, `deadline`, `daily_minutes` | `job_id` → outcomes, required skills, feasibility, предложенные корректировки |
| `goal-confirm` | `goal_draft` | активная `goal` + `learning_strategy` |
| `assessment-next` | `goal_id`, предыдущие ответы | следующий вопрос или `{ done: true }` |
| `assessment-complete` | `goal_id` | начальный `learning_state` + `skill_states` |
| `recommendation-get` | `goal_id` | `recommendation` + `reason` + `mission_id` |
| `mission-generate` | `goal_id` | `job_id` → `mission` + `activities` |
| `activity-submit` | `activity_id`, `payload` \| `recording_path` | `feedback` + `evidence` + обновлённые `skill_states` + `mascot_state` |
| `material-ingest` | `kind`, `storage_path` \| `url` | `job_id` → `material` в Library |

### **Асинхронные операции**

`goal-analyze`, `mission-generate`, `material-ingest`, `activity-submit` для Speaking — долгие. Они возвращают `job_id` немедленно (`TECH-42.09`).

Клиент **не опрашивает** статус в цикле. Клиент подписывается через Supabase Realtime:

```ts
supabase.channel(`job:${jobId}`)
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
      onJobUpdate)
  .subscribe();
```

Пока job не завершён — показывается объясняющий loading state (§10). Обязателен таймаут и переход в Error/Recovery.

### **Валидация**

Каждый ответ Edge Function проходит `schema.parse()` Zod-схемой из `packages/shared` **до** попадания в стейт (`PRD гл. 42 §22–23`: AI может вернуть неполный или невалидный результат). Ошибка парсинга → Error/Recovery + лог в Sentry. Пользователь технической ошибки не видит никогда.

### **Mock-first**

Каждый домен описан интерфейсом репозитория с двумя реализациями:

```ts
// shared/repositories/goal.repository.ts
export interface GoalRepository {
  getActive(): Promise<Goal | null>;
  analyze(input: GoalDraftInput): Promise<JobRef>;
  confirm(draft: GoalDraft): Promise<Goal>;
}
```

`MockGoalRepository` — реалистичные данные, без Lorem Ipsum. `SupabaseGoalRepository` — реальные вызовы. Выбор через `EXPO_PUBLIC_DATA_SOURCE=mock|supabase`.

**Ни один компонент не обращается к Supabase напрямую** — только через репозиторий, обёрнутый в TanStack Query hook. Это позволяет разрабатывать и демонстрировать весь frontend до готовности backend и не переписать при переключении ни одного экрана.

---

## **7. Навигация**

Четыре таба (`MVP-3.01`, `FE-01.05`):

```
┌──────────────────────────────────┐
│           Current Screen         │
├──────────────────────────────────┤
│  Home   Goal   Library   Profile │
└──────────────────────────────────┘
```

* **Home** — главный экран и главный entry point (`MVP-3.02`).
* **Mission — не таб.** Открывается из Home / Recommendation как full-screen flow с приглушённой навигацией (`MVP-3.03`, `NAV-28.07`, `PRD гл. 28 §20`). Пользователь не должен переключать табы посреди Mission.
* **Progress — не таб.** Встроен в Home и Goal (`MVP Spec гл. 4 §38`).
* **«Learn» — не таб.** Каталог уроков противоречит принципу *one best next action*. Home и есть Learn.
* **Web:** тот же Tab Bar снизу при ширине ≤ 768px, Sidebar при > 768px (`PRD гл. 28 §17`). Роуты и структура идентичны.
* **Во время onboarding основная навигация скрыта** (`PRD гл. 28 §19`) — пользователь не должен видеть четыре пустых раздела до создания первой Goal.
* Возврат из Activity ведёт в Mission, а не на Home (`PRD гл. 28 §14`).

---

## **8. Карта экранов — 19 screen states**

Реализуй ровно эти. Не добавляй экраны без явного запроса (`MVP-4.01`).

### **Onboarding**

| # | Экран | Одна задача | Primary action | Маскот |
| --- | --- | --- | --- | --- |
| 01 | Welcome | Объяснить ценность | Get Started | ✅ large, `neutral` |
| 02 | Target Language | Выбрать изучаемый язык | Continue | — |
| 03 | Goal Setup | Свободный текст цели + Deadline + Available Time | Continue | — |
| 04 | Goal Analysis | Показать, как система поняла цель; дать исправить | Continue | ✅ small, `thinking` |
| 05 | Goal Confirmation | Подтвердить Goal / Deadline / Time / Outcomes | Looks right | — |
| 06 | Initial Assessment | Короткий адаптивный ассессмент | (per-question submit) | — |
| 07 | Assessment Result | Stronger / Needs Work / Priority | Continue | ✅ medium, `neutral` |
| 08 | Learning Strategy | Путь + «план будет адаптироваться» | Start Learning | — |

### **Main App**

| # | Экран | Содержимое | Маскот |
| --- | --- | --- | --- |
| 09 | **Home** | Mascot · Active Goal + Deadline + Readiness · Today's Mission · «Why this?» · **[Start Mission]** | ✅ large, центральный |
| 10 | Goal | Goal · Deadline · Available time · Readiness · Language Outcomes · Current priorities · [Edit Goal] | ✅ small |
| 11 | Library | For Your Goal / Public Resources / My Materials | только в empty state |
| 12 | Profile | account · languages · preferences · notifications · privacy · subscription · help · mascot stage | ✅ small |

### **Learning**

| # | Экран | Содержимое | Маскот |
| --- | --- | --- | --- |
| 13 | Mission Overview | Название · Purpose · Why · Estimated time · N activities · [Start Mission] | ✅ small, `neutral` |
| 14 | **Activity** | Универсальная оболочка. Все состояния — здесь | ❌ не отвлекает |
| 15 | Activity Feedback | What went well / Improve / Example · [Continue] | — |
| 16 | Mission Result | You practiced / We learned / Still needs work / Mascot progress · [See what's next] | ✅ large, `celebrating` |
| 17 | Add Material | PDF / image / text / URL → upload → processing → Library | — |
| 18 | Settings | notifications · language · account · privacy · subscription · data | — |
| 19 | Error / Recovery | «Something went wrong» · [Try Again] · [Continue with another activity] | ✅ small, `thinking` |

### **Куда делись экраны из `promt.md`**

| Из промта | Реализация |
| ----- | ----- |
| 0. Launch / Splash | Нативный splash Expo, не экран |
| 3. Goal Introduction | Заголовок и текст экрана 03 |
| 6. Skills Preview | Секция экрана 04 (Goal Analysis) |
| 11. Skills Overview | Секция «Current priorities» экрана 10 (Goal) |
| 13. Mission (контейнер) | Экран 14 — `ActivityShell` владеет прогрессом Mission |
| 14–18. Multiple Choice / Fill in the Blank / Short Answer / Speaking / Listening | Рендереры внутри экрана 14 (§9), не отдельные экраны |
| 19. Activity Result | Экран 15 |
| 21. Learning Progress / Evidence | Секция экрана 16 |
| 22. Goals List | Отложено — одна активная Goal (`MVP-3.08`) |
| 23. Goal Detail | Экран 10 |
| 25. Resource Detail | Modal поверх экрана 11 |
| 28. Empty Goal / 29. No Mission | Empty states экранов 09 и 11 |
| 30. Loading / 31. Error | Состояния экранов + экран 19 как крайний случай |

Причина: `MVP-4.12` — вариация UI не должна становиться отдельным экраном.

---

## **9. Activity — центральное место реализации**

`MVP-4.05`: Activity — универсальная оболочка, тип задания варьируется.

### **Разделение ответственности**

**`ActivityShell` владеет:** прогрессом по Mission, таймером, кнопкой submit, обработкой сети и ошибок, переходами состояний, отправкой ответа, приёмом feedback.

**Рендерер владеет:** только вёрсткой конкретного задания и формой ответа. Ничего больше.

### **Реестр**

```ts
// features/activity/registry.ts
export const ACTIVITY_RENDERERS = {
  vocabulary_choice:       VocabularyChoice,     // multiple choice
  vocabulary_recall:       VocabularyRecall,     // fill in the blank
  grammar_practice:        GrammarPractice,
  reading_comprehension:   ReadingComprehension,
  listening_comprehension: ListeningComprehension,
  speaking_response:       SpeakingResponse,
  speaking_roleplay:       SpeakingRoleplay,
  writing_response:        WritingResponse,      // short answer
} satisfies Record<ActivityType, ActivityRenderer>;
```

Backend отдаёт `activity.type` + `payload`. Клиент выбирает рендерер по типу.

**Добавление нового типа = один новый файл + одна строка в реестре.** Навигация, API-слой и машина состояний не меняются. Это правило нарушать нельзя — оно определяет стоимость развития продукта.

### **Состояния — одна discriminated union, не отдельные экраны**

```ts
type ActivityState =
  | { status: 'loading' }
  | { status: 'ready';       activity: Activity }
  | { status: 'in_progress'; activity: Activity; draft: Answer }
  | { status: 'submitting';  activity: Activity; draft: Answer }
  | { status: 'feedback';    activity: Activity; feedback: Feedback }
  | { status: 'error';       reason: UserFacingError; retry: () => void };
```

Плоский reducer поверх этого union. Никаких XState и внешних стейт-машин.

### **Speaking — самый сложный рендерер**

Поток: запись → загрузка в Storage → `activity-submit` → Realtime-статус job → транскрипт → feedback.

| Платформа | Реализация |
| ----- | ----- |
| iOS / Android | `expo-audio` |
| Web | адаптер на `MediaRecorder` + `getUserMedia` в `shared/platform/audio.web.ts` |

Обязательные состояния: `idle` → `permission_request` → `recording` (с индикатором уровня и таймером) → `uploading` → `processing` → `feedback`. Плюс `permission_denied` с внятным объяснением.

### **Listening**

Воспроизведение через `expo-audio`. **Текстовая расшифровка обязательна** — accessibility (§13), не опция.

---

## **10. Универсальные правила экрана**

Каждый экран обязан иметь (`MVP Spec гл. 4 §28`):

1. **Primary Action** — ровно одно главное действие (`MVP-4.03`);
2. **Secondary Action** — если нужно, визуально слабее;
3. **Context** — понятно, почему пользователь здесь;
4. **Exit** — понятный способ вернуться.

И три состояния:

### **Loading (`MVP-4.09`)**

Объясняющий текст, не бесконечный спиннер. Тексты — i18n-ключи, согласованные с backend по `job.kind`:

| Job | Текст |
| ----- | ----- |
| `goal_analyze` | «Analyzing your goal…» |
| `assessment_evaluate` | «Checking your answers…» |
| `mission_generate` | «Building your next mission…» |
| `speaking_assess` | «Listening to your answer…» |
| `material_ingest` | «Processing your material…» |

**Не сочиняй сообщения о процессах, которых система не выполняет.** Маскот может анимироваться в `thinking`.

### **Empty (`PRD гл. 28 §18`)**

Объясняет, что делать дальше:

* Goal → «Create your first language goal»
* Library → «Add a material or create one with AI»
* Progress → «Your progress will appear as the system collects learning evidence»
* No Mission → «Let's figure out what would help you most»

### **Error (`MVP-4.10`)**

Человеческий текст + повтор. **Никаких кодов ошибок, stack trace, сообщений LLM/API, слова "LLM", "API", "token".**

```
Something went wrong.
Let's try again.
[ Try Again ]          [ Continue with another activity ]
```

---

## **11. Маскот**

**Ассет:** `assets/image/mascot.png` — спрайт-лист 2×2, 1254×1254 px, квадранты 627×627 px.

| Позиция | Что изображено | Mood |
| ----- | ----- | ----- |
| Верх-лево | Читает книгу, довольный | `neutral` |
| Верх-право | Задумался, вопросительный знак, буквы | `thinking` |
| Низ-лево | Празднует, лапы вверх, звёзды | `celebrating` |
| Низ-право | Спит на книге, «Zzz» | `resting` |

**Задача агента на первом шаге:** нарезать спрайт-лист на 4 PNG с прозрачным фоном (белый фон удалить), экспортировать в `apps/mobile/assets/mascot/` как `neutral.png`, `thinking.png`, `celebrating.png`, `resting.png` в @1x / @2x / @3x.

### **API компонента**

```ts
type MascotStage = 1 | 2 | 3 | 4 | 5;
type MascotMood  = 'neutral' | 'thinking' | 'celebrating' | 'resting';
type MascotSize  = 'small' | 'medium' | 'large';

interface MascotProps {
  stage: MascotStage;   // приходит с backend
  mood:  MascotMood;    // приходит с backend или задан экраном
  size:  MascotSize;
}
```

* `mood` выбирает спрайт;
* `stage` пока влияет на масштаб и индикатор стадии рядом с фигурой — **отдельных ассетов на стадии нет**. Компонент спроектирован так, чтобы позже подменить источник на per-stage ассеты или Rive без изменения ни одного вызывающего экрана;
* `growth_progress` (0…1) внутри текущей стадии — тонкое кольцо вокруг маскота.

### **Правила**

* `stage`, `mood` и `growth_progress` **приходят с backend** (`mascot_states`). Клиент их не вычисляет.
* Рост связан с реальным Evidence: `Activity → Evidence → Learning State Update → Mascot State Update`. **Никогда** `Tap → XP → Growth` (`PRD гл. 46 §14`).
* Маскот на Home — центральный визуальный элемент, но **не занимает весь экран** и **никогда не конкурирует с primary CTA**. Если анимация перетягивает внимание с «Start Mission» — это баг.
* Присутствует на: Home, Mission Result, Mission Overview, Assessment Result, Welcome, Goal Analysis, Profile, empty states, Error. **Не на каждом экране** — он companion, а не обои.
* Анимация: мягкий idle-float (translateY ±4px, 3 с, easeInOut), плавный кроссфейд при смене mood, короткий bounce+scale при росте стадии. Через Reanimated. `prefers-reduced-motion` уважается — анимации отключаются.
* Запрещено: XP, валюта, кормление, покупки, наказания за пропуски, streak как основная механика (`PRD гл. 46 §28`).

> Принцип: **learning app with a mascot**, а не mascot game with language learning.

---

## **12. Дизайн-система**

### **Визуальное направление**

Современно, тепло, premium. **Не копировать Duolingo.**

❌ детский интерфейс · кислотные цвета · перегруженный gamification · много бейджей · cartoon UI везде
✅ clean · calm · modern · spacious · readable · mobile-first

Маскот может быть playful. Остальной интерфейс — спокойный.

### **Палитра — выведена из ассета маскота**

```ts
// shared/config/tokens.ts
export const colors = {
  light: {
    primary:      '#7B6BD6',  // фиолетовый — уши/худи маскота
    primarySoft:  '#EFECFB',
    accent:       '#FFD764',  // жёлтая звезда
    accentSoft:   '#FFF6DC',
    info:         '#6BC0EC',  // голубой кончик хвоста
    success:      '#4A9B6E',
    warning:      '#E8A54B',
    danger:       '#D96A6A',
    background:   '#FAF7F2',  // тёплый кремовый
    surface:      '#FFFFFF',
    surfaceAlt:   '#F3EFE8',
    border:       '#E6E0D6',
    text:         '#2A2440',
    textMuted:    '#7A7391',
    textInverse:  '#FFFFFF',
  },
  dark: {
    primary:      '#9B8FE3',
    primarySoft:  '#2B2547',
    accent:       '#FFD764',
    accentSoft:   '#3A3320',
    info:         '#6BC0EC',
    success:      '#5FB584',
    warning:      '#E8A54B',
    danger:       '#E58585',
    background:   '#17142A',
    surface:      '#221E3B',
    surfaceAlt:   '#2B2547',
    border:       '#332D52',
    text:         '#F2EFF8',
    textMuted:    '#A9A2C4',
    textInverse:  '#17142A',
  },
} as const;

export const spacing     = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius      = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
export const typography  = {
  display: { size: 32, weight: '700', lineHeight: 40 },
  title:   { size: 24, weight: '700', lineHeight: 32 },
  heading: { size: 18, weight: '600', lineHeight: 26 },
  body:    { size: 16, weight: '400', lineHeight: 24 },
  caption: { size: 13, weight: '400', lineHeight: 18 },
};
```

Токены дублируются в `tailwind.config.js` для NativeWind. **Магических значений hex/px в компонентах нет.** Тёмная тема обязательна с первого экрана — доделывать её потом дороже.

### **Примитивы `shared/ui`**

| Компонент | Назначение |
| ----- | ----- |
| `Button` | варианты `primary` / `secondary` / `ghost`, состояния loading и disabled |
| `Card` | контейнер для Goal, Mission preview, Resource |
| `Text` | типографические варианты из токенов |
| `Input` / `TextArea` | ввод цели, ответов |
| `ProgressBar` / `ProgressRing` | прогресс Mission, рост маскота |
| `SkillPill` | бейдж «Speaking · Developing» |
| `FeedbackBanner` | тёплый фидбэк, см. §14 |
| `LoadingState` | объясняющее состояние + анимация маскота |
| `EmptyState` | параметризуемый, с маскотом |
| `ErrorState` | спокойный recovery |
| `Mascot` | см. §11 |

Больше ничего заранее не строить (`MVP Spec гл. 4 §34`). Design System расширяется после первых пользовательских тестов.

---

## **13. Accessibility — обязательно в MVP (`MVP-4.11`)**

Требования из MVP Spec были сформулированы для iOS. Кросс-платформенные эквиваленты:

| iOS-формулировка | Реализация |
| ----- | ----- |
| Dynamic Type | `allowFontScaling`, относительные размеры, без фиксированных высот текстовых блоков |
| VoiceOver | `accessibilityRole` / `accessibilityLabel` / `accessibilityState` — маппятся в VoiceOver, TalkBack и ARIA |
| Tap targets | ≥ 44×44 на всех платформах |
| Contrast | WCAG AA, проверяется для обеих тем |
| Captions for audio | текстовая расшифровка для каждой Listening-активности — обязательна |
| Не зависеть от цвета | статус дублируется иконкой и текстом |

Дополнительно: `prefers-reduced-motion` отключает idle-анимации маскота и переходы.

---

## **14. Тон и копирайт**

Copy: **warm · encouraging · intelligent · concise.**

| ❌ Никогда | ✅ Вместо этого |
| ----- | ----- |
| «YOU FAILED» | «Not quite» |
| «WRONG!» | «Let's try another way» |
| «BAD» | «You're getting closer» |
| «Calling LLM…» | «Preparing your next challenge…» |
| «Error 500 / API timeout» | «Something went wrong. Let's try again» |

Ни одна строка UI не хардкодится — всё через i18next (§15). Тексты фидбэка приходят с backend; клиент их **не перефразирует и не генерирует**.

---

## **15. Интернационализация**

`PRD гл. 42 §21` — четыре независимых измерения, не путать:

* **UI language** — язык интерфейса;
* **native language** — родной язык пользователя;
* **target language** — изучаемый язык;
* **content language** — язык конкретного материала.

Не предполагать, что source language = English. На MVP список target-языков может быть коротким, но модель и UI должны быть расширяемыми без переписывания.

---

## **16. Explainability**

`IA-27.06`, `PRD гл. 27 §22` — прогрессивное раскрытие в четыре уровня:

1. **Что делать сейчас** → всегда видно на Home;
2. **Почему** → «Why this?», раскрывается по тапу;
3. **Какие навыки это улучшает** → внутри объяснения;
4. **Какие Evidence повлияли** → самый глубокий уровень, доступен, но не навязан.

Текст объяснения приходит с backend в `recommendations.reason`.

---

## **17. Конвенции кода**

* Файл — одна ответственность, ориентир ≤ 200 строк. Больше — разделяй.
* Компоненты функциональные, пропсы типизированы явно. Без `any`, без `as` кроме `satisfies`.
* Именование: компоненты `PascalCase`, хуки `useX`, файл называется по основному экспорту.
* Стилизация только через NativeWind. Инлайн-стили — только для анимируемых значений Reanimated.
* Никаких `useEffect` + `fetch`. Все запросы — TanStack Query через репозиторий.
* Мутации инвалидируют затронутые ключи. После `activity-submit` инвалидируются `learning_state`, `mascot_state`, `recommendation`.
* Никаких `console.log` в коммитах — `shared/lib/logger`.
* Комментарии только там, где неочевидно «почему». Не комментируй «что».
* Всегда указывай полный путь файла, который создаёшь или меняешь.

---

## **18. Definition of Done**

Задача не завершена, пока не выполнено всё:

- [ ] `tsc --noEmit` — чисто;
- [ ] `eslint` — чисто;
- [ ] работает на **iOS, Android и Web** — проверено запуском, не предположением;
- [ ] реализованы loading, empty и error состояния;
- [ ] ровно один primary action на экране;
- [ ] светлая и тёмная темы;
- [ ] ни одна техническая ошибка не доходит до пользователя;
- [ ] все строки через i18n;
- [ ] accessibility-атрибуты проставлены, тап-таргеты ≥ 44;
- [ ] нет вычисления образовательного состояния на клиенте;
- [ ] нет `Platform.OS` вне `shared/platform/`;
- [ ] нет прямого обращения к Supabase из компонента — только через репозиторий;
- [ ] Maestro-флоу добавлен или обновлён, если задача затрагивает пользовательский путь.

---

## **19. План работ**

Фазы строго последовательны. Не начинай следующую, пока предыдущая не проходит DoD.

### **Фаза 0 — Каркас**
Монорепо (pnpm + Turborepo). Expo + TypeScript + expo-router + NativeWind. Токены дизайна, светлая и тёмная темы. Нарезка `mascot.png` → 4 спрайта. Компонент `Mascot`. Примитивы `shared/ui`. Настройка EAS (три канала).
**Проверка:** пустое приложение с маскотом собирается и запускается на iOS, Android и Web.

### **Фаза 1 — Контракт и данные**
`packages/shared`: Zod-схемы всего домена. Репозитории с mock-реализациями и реалистичными данными («Prepare for English job interviews», настоящие миссии, настоящие фразы фидбэка). TanStack Query. Централизованная обработка ошибок. Экран 19.
**Проверка:** `EXPO_PUBLIC_DATA_SOURCE=mock` отдаёт полный набор данных для всех экранов.

### **Фаза 2 — Навигация и оболочки**
Tab Bar из 4 табов + web Sidebar. Пустые экраны 09–12 с empty states. Mission как отдельный flow. Скрытие навигации во время onboarding.

### **Фаза 3 — Onboarding**
Экраны 01–08. Goal Setup с Deadline и Available Time, Feasibility-результат, возможность скорректировать Goal / Deadline / Time.
**Проверка:** пользователь доходит до Home с активной Goal.

### **Фаза 4 — Home**
Экран 09 целиком: Goal + Readiness + Today's Mission + «Why this?» + primary CTA + маскот.

### **Фаза 5 — Learning loop**
Экраны 13–16. `ActivityShell` + машина состояний + реестр. Начни с двух рендереров: `vocabulary_choice` (простейший) и `speaking_response` (самый сложный — запись на трёх платформах). Остальные добавляются только после того, как эти два работают.
**Проверка:** сквозной проходимый путь от первого запуска до завершения первой Mission.

### **Фаза 6 — Supabase**
Миграции, RLS, Storage, Auth. Edge Functions по §6. AI Gateway. `SupabaseRepository` для каждого домена. Realtime на `jobs`.
**Проверка:** `EXPO_PUBLIC_DATA_SOURCE=supabase` даёт тот же сквозной путь без изменений в UI-коде.

### **Фаза 7 — Library и Materials**
Экраны 11 и 17. Загрузка PDF / image / text / URL, async processing со статусом.

### **Фаза 8 — Profile, Settings, Notifications**
Экраны 12 и 18. Push через `expo-notifications`.

### **Фаза 9 — Полировка**
Оставшиеся рендереры Activity, анимации переходов, accessibility-аудит, Maestro-покрытие, оптимизация web-бандла.

---

## **20. Чего не делать**

* Не писать код до завершения шага §21.1.
* Не реализовывать несколько экранов за одну итерацию.
* Не строить design system заранее — только примитивы из §12.
* Не превращать вариацию UI в отдельный экран (`MVP-4.12`).
* Не делать чат главным интерфейсом (`MVP Spec гл. 4 §38`).
* Не давать AI генерировать структуру приложения — только контент (`MVP Spec гл. 4 §38`).
* Не делать Library первой вкладкой и не превращать её в бесконечный feed.
* Не реализовывать offline learning — только корректное no-network состояние с повтором (`MVP Spec гл. 4 §31`).
* Не добавлять XP, streak как основную механику, виртуальную валюту, наказания за пропуски, social features, marketplace (`PRD гл. 46 §28`).
* Не показывать numerical progress как главный показатель (`MVP Spec гл. 4 §40.3`).
* Не откладывать web-таргет «на потом».
* Не вызывать AI-провайдеров с клиента (`PRD гл. 21 §32`).
* Не вычислять на клиенте ничего из списка в §3, Правило 1.

---

## **21. Формат работы с агентом**

### **21.1 Первый шаг — БЕЗ КОДА**

Прежде чем писать хоть строку, верни:

1. Подтверждение прочтения этого ТЗ и списка расхождений, если найдёшь;
2. Финальную структуру монорепозитория;
3. Полный список Zod-схем домена в `packages/shared`;
4. Схему БД Supabase — DDL миграции;
5. Список Edge Functions с сигнатурами входа и выхода;
6. Архитектуру маскота — как нарежешь ассет, как свяжешь stage/mood/growth;
7. Список примитивов `shared/ui` с пропсами;
8. Порядок реализации экранов внутри Фазы 0–1;
9. Риски и технические упрощения, которые предлагаешь принять.

**После этого остановись и жди команды `START PHASE 0`.**

### **21.2 На каждую последующую задачу**

1. Назови фазу и экран/flow.
2. Перечисли файлы, которые создашь или изменишь, — **до** того, как писать код.
3. Если задача требует поля или Edge Function, которых нет в контракте, — **предложи контракт**, не считай на клиенте.
4. Если задача противоречит зафиксированному решению (`MVP-x.xx`, `TECH-42.xx`, `NAV-28.xx`) — **остановись и укажи, какому именно**.
5. Пиши полный код файлов с полными путями, а не фрагменты.
6. После реализации пройди чек-лист §18 и отчитайся честно: что проверено запуском, что нет.

**Не сообщай о готовности того, что не запускал.**

---

## **22. Открытые вопросы**

Не блокируют старт, но должны быть закрыты до Фазы 6:

1. **Аутентификация** — email + magic link, OAuth-провайдеры, или anonymous-first с последующей привязкой? Влияет на экран 01 и Profile.
2. **AI-провайдер** — какой основной, какой fallback? Влияет только на `_shared/ai`, архитектура provider-agnostic (`TECH-42.06`).
3. **Speech-to-text** — Whisper через Edge Function, или облачный STT провайдера?
4. **Target-языки на старте** — сколько и какие?
5. **Latency-бюджеты** AI-эндпоинтов — от них зависит, где Realtime достаточно, а где нужен стриминг.
6. **Стадии маскота 2–5** — будут ли отдельные ассеты, и когда? До этого stage выражается масштабом и кольцом прогресса.
7. **Монетизация** — экран Subscription в Profile нужен на MVP или заглушка?

---

## **Итог**

> Один TypeScript-код → Expo → iOS + Android + Web → EAS → сторы и веб.
> Supabase держит образовательное состояние. Клиент его только показывает.

Главное архитектурное преимущество продукта — не количество экранов, а то, что **образовательное решение является самостоятельной сущностью системы, а LLM остаётся исполнительным инструментом** (`PRD гл. 42, Итоговое архитектурное решение`).

И на уровне клиента то же самое одной строкой:

> **Activity — это данные, а не код.** Backend решает, чему учить. Клиент знает только, как это отрисовать.
