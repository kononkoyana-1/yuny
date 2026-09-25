# NEXT — с чего начать новую сессию

Читать этот файл вместо истории. Обновлять в конце каждой сессии (≤ 40 строк).

## Как работаем
- Ветка `feature/vocab-learning-engine`, выкладка — fast-forward в `master` (CI деплоит Pages + все Edge Functions в `ixtfifglohppaimvyvui`).
- Тесты модели: `cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/` (105; deno ставится `curl -fsSL https://deno.land/install.sh | sh`).
- Клиент: `cd apps/mobile && pnpm typecheck && pnpm lint && pnpm test` (154). Проверка глазами — `npx expo export --clear --platform web` + Playwright
  (`/opt/pw-browsers/chromium`); mock-режим по умолчанию. `--clear` обязателен при смене `EXPO_PUBLIC_*`.
- Одна задача — одна сессия; коммиты с двумя строками атрибуции (Co-Authored-By, Claude-Session).

## Готово
- Сервер (#58–#63): модель памяти, `review-submit` (билеты, `request_id`, `pair_start`), дистракторы, `session-build` (preview/start).
- #65 токены, примитивы; Reanimated-обёртки — в NativeWind (`shared/ui/animated.ts`); цвет текста — только `tone`.
- #66 «Сегодня» (`TodayHero`), #67 `/study` (`features/study/{exercise,session}/*`). Логи — Actions → «Function logs».
- #68 окно «Повторим?» (`BudgetSheet`), пауза и итог дня (`PauseScreen`, `DaySummaryScreen`, `session/summary.ts`);
  сервер: `preview` + `today`/`show_daily_prompt`, `review-submit` + `stage_before`/`pair_resolved`.
- #69 учёба по папке: `FolderStudyBlock` (`folder_preview`), `/study?folder=<id>&mode=`, `RoundSummaryScreen`,
  «Ещё 7 новых слов» после «Сегодня» (`start … extra_new`). Сервер — `_shared/learning/folder.ts` (тесты).
- #70 карта папки: `learning-overview` (`folders` / `folder` / `word`, расчёт — `_shared/learning/overview.ts`, тесты),
  полоска стадий, мозаика `WordTile`, «⋯» (переименовать/удалить), прогресс слова в статье + «Убрать из «…»», мини-полоска
  на карточке папки. Вход планировщика — `_shared/studyInput.ts` (общий с `session-build`).
- #85 изучено/осталось: `_shared/learning/queue.ts` (срок — по `max_new`) → `learning-overview` (`learned`, `queued`,
  `total`); сводка `WordStats` в «Моём словаре», строки `features/study/queueText.ts`, `QueueHint` после загрузки.
- #70 доделки: порядок по `position`, 2 колонки на широком, стрелки в сетке, скелет, «наливание» плитки.
- #74 знаки: `hanzi_chars` (Make Me a Hanzi, Actions → «Hanzi import», 9536 знаков), «卖 = 十 + 买» в карточке пары.
- #88 чтение и значение знаков в знакомстве; #69 «3 из 7 слов», «Проверка», «Тогда запомним».
- #71 пары: кэш `contrast_cards` (`_shared/contrastCards.ts`, проверка — `learning/contrast.ts`), коллокации в карточке,
  блок из 4 заданий A/B (`pairBlockSides`), не больше 2 интервенций за занятие (`MODEL.pair.maxInterventions`).
## Дальше по порядку
1. Проверить на проде коллокации и «卖 = 十 + 买» (логи `contrast_`, `hanzi_`). Не сделано: #85 «Уже знаю» отдельным действием.
2. Дальше: #64 контексты (C1/C2 и «Использую»), #73, словарь 2.0 #75–#84, #86 озвучка (решения владельца), #87 (сроки).

## Известные ограничения
- Занятие: нет анимаций смены задания, раскрытия R2, перелёта в пропуск C1, въезда пары (спека §3.1, §4); иероглифы внутри
  строк разбора — обычный `Text`, не `HanziText`; очередь отправки только в памяти (перезагрузка вкладки теряет недошедшие ответы).
- Карточка «Сегодня»: нет `in_progress` (сервер не хранит начатую сессию), шиммера загрузки, затухания ready → done.
- Таб-бар белый в тёмной теме web (цвета из `useTheme` на первой отрисовке, старое #56).
- `assets/fonts/PlusJakartaSans-*.ttf` не используются — удалить (в сессии #65 удаление не разрешили).
- Разбор ошибки — шаблонные строки. Разбор знаков — один уровень (读 против 买 через 卖 не находит).
