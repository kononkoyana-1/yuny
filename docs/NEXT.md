# NEXT — с чего начать новую сессию

Читать этот файл вместо истории. Обновлять в конце каждой сессии (≤ 40 строк).

## Как работаем
- Ветка `feature/vocab-learning-engine`, выкладка — fast-forward в `master` (CI деплоит Pages + все Edge Functions в `ixtfifglohppaimvyvui`).
- Одна задача — одна сессия. Читать точечно (grep, диапазоны строк); спеки #65 длинные.
- Тесты модели: `cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/` (79; deno ставится `curl -fsSL https://deno.land/install.sh | sh`).
- Клиент: `cd apps/mobile && pnpm typecheck && pnpm lint && pnpm test` (124). Проверка глазами — `npx expo export --clear --platform web` + Playwright
  (`/opt/pw-browsers/chromium`); mock-режим по умолчанию. `--clear` обязателен при смене `EXPO_PUBLIC_*`.
- Коммиты — с двумя строками атрибуции (Co-Authored-By, Claude-Session).

## Готово
- Сервер (#58–#63): модель памяти, `review-submit` (билеты, `request_id`, `pair_start`), дистракторы, `session-build` (preview/start).
- #65 токены и примитивы. Reanimated-обёртки зарегистрированы в NativeWind (`shared/ui/animated.ts`); цвет текста — только `tone`.
- #66 «Словарь» первый; карточка «Сегодня» (`features/study/TodayHero.tsx`) на `preview` (+ `state`, `recall_now`, состав планов).
  На проде (master `bfb6048`, деплой ок). Карточка за флагом `TODAY_ENABLED` (mock — всегда, прод — `EXPO_PUBLIC_TODAY=1`).
- #67 занятие `/study` (вне таб-бара): оболочка `features/study/exercise/ExerciseShell.tsx`, рендереры intro, R1, R2, P1, P2,
  W1/W2, C1, C2, pair_card; лоток с мягким разбором; клавиши 1–6 / Enter / Escape / Backspace (`shared/platform/keyboardShortcuts`).
  Логика — `features/study/session/`: очередь (повтор через 2 задания, блок пары сразу, «Уже знаю» убирает слово),
  итог сразу по ключу (`shared/lib/studyVerdict.ts`), очередь отправки с повтором при обрыве сети (`outbox.ts`), `pair_start`
  после блока пары. `mai3 → mǎi` — `pinyinWithMarks`. Mock: `EXPO_PUBLIC_MOCK_STUDY=start_error|flaky|slow`; R1 «продавать» на 买
  → путаница → карточка пары. Скриншоты: узкий/широкий, светлая/тёмная. «Начать» на карточке ведёт в `/study`.

## Дальше по порядку
1. **#68** окно «Повторим?» (+ `onChangeBudget`), пауза между порциями (`portion` у задания), итог дня → первый сквозной
   прогон на настоящем бэкенде → снять флаг `TODAY_ENABLED`. Сейчас после последнего задания — простой экран «На сегодня всё».
2. **#69** раунд папки (`/study?folder=<id>`, intro с «Запомню / Уже знаю»), **#70** карта папки + **#85** очередь, **#71** пары.
3. Позже: #64 контексты (откроет C1/C2 на сервере и «Использую»), #73 learning-overview, #74 знаки, словарь 2.0 #75–#84.

## Известные ограничения
- Занятие: нет анимаций смены задания, раскрытия R2, перелёта в пропуск C1, въезда пары (спека §3.1, §4); иероглифы внутри
  строк разбора — обычный `Text`, не `HanziText`; очередь отправки только в памяти (перезагрузка вкладки теряет недошедшие ответы).
- Карточка «Сегодня»: нет `in_progress` (сервер не хранит начатую сессию), шиммера загрузки, затухания ready → done.
- Таб-бар белый в тёмной теме web (цвета из `useTheme` на первой отрисовке, старое #56).
- `assets/fonts/PlusJakartaSans-*.ttf` не используются — удалить (в сессии #65 удаление не разрешили).
- Разбор ошибки — шаблонные строки; различие в карточке пары — `null` до #71/#74.
