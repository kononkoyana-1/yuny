# NEXT — с чего начать новую сессию

Читать этот файл вместо истории. Обновлять в конце каждой сессии (≤ 40 строк).

## Как работаем
- Ветка `feature/vocab-learning-engine`, выкладка — fast-forward в `master` (CI деплоит Pages + все Edge Functions в `ixtfifglohppaimvyvui`).
- Тесты модели: `cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/` (91; deno ставится `curl -fsSL https://deno.land/install.sh | sh`).
- Клиент: `cd apps/mobile && pnpm typecheck && pnpm lint && pnpm test` (137). Проверка глазами — `npx expo export --clear --platform web` + Playwright
  (`/opt/pw-browsers/chromium`); mock-режим по умолчанию. `--clear` обязателен при смене `EXPO_PUBLIC_*`.
- Одна задача — одна сессия; коммиты с двумя строками атрибуции (Co-Authored-By, Claude-Session).

## Готово
- Сервер (#58–#63): модель памяти, `review-submit` (билеты, `request_id`, `pair_start`), дистракторы, `session-build` (preview/start).
- #65 токены и примитивы. Reanimated-обёртки зарегистрированы в NativeWind (`shared/ui/animated.ts`); цвет текста — только `tone`.
- #66 «Словарь» первый, карточка «Сегодня» (`TodayHero`). #67 занятие `/study`: `features/study/{exercise,session}/*`.
- Загрузка файла: лимит на Gemini, запасные модели (`GEMINI_FALLBACK_MODELS`), «Отмена». Логи — Actions → «Function logs».
- #68 окно «Повторим?» (`BudgetSheet`), пауза и итог дня (`PauseScreen`, `DaySummaryScreen`, `session/summary.ts`);
  сервер: `preview` + `today`/`show_daily_prompt`, `review-submit` + `stage_before`/`pair_resolved`.
- #69 учёба по папке: `FolderStudyBlock` (`folder_preview`), `/study?folder=<id>&mode=`, `RoundSummaryScreen`,
  «Ещё 7 новых слов» после «Сегодня» (`start … extra_new`). Сервер — `_shared/learning/folder.ts` (тесты).
- #70 карта папки: `learning-overview` (`folders` / `folder` / `word`, расчёт — `_shared/learning/overview.ts`, тесты),
  полоска стадий, мозаика `WordTile`, «⋯» (переименовать/удалить), прогресс слова в статье + «Убрать из «…»», мини-полоска
  на карточке папки. Вход планировщика — `_shared/studyInput.ts` (общий с `session-build`).
- #85 очередь новых: `_shared/learning/queue.ts` (темп приёма за 7 дней, тесты) → `learning-overview` (`queued`,
  `eta_days`, `per_day`) и `preview.queued_total`; строка очереди (`features/study/queueText.ts`), `QueueHint` после загрузки.
## Дальше по порядку
1. **#71** пары. Не сделано: #69 — счётчик «3 из 7 слов» в раунде, чип «Проверка», «Тогда запомним»;
   #85 — «Отметить, что уже знаю» отдельным действием (подсказка ведёт в раунд папки с «Уже знаю»); #70 — стрелки
   в сетке, карта и папки в 2 колонки на широком, «наливание» плитки, скелет загрузки, порядок слов по `position`.
2. Позже: #64 контексты (откроет C1/C2 на сервере и «Использую»), #73 learning-overview, #74 знаки, словарь 2.0 #75–#84,
   #86 озвучка (CC-CEDICT + Make Me a Hanzi + HSK Sentences Audio + локальный CosyVoice2; сперва решения владельца),
   #87 плитка светлеет без повторений (сроки не решены), #88 значение и пиньинь знаков в знакомстве.

## Известные ограничения
- Занятие: нет анимаций смены задания, раскрытия R2, перелёта в пропуск C1, въезда пары (спека §3.1, §4); иероглифы внутри
  строк разбора — обычный `Text`, не `HanziText`; очередь отправки только в памяти (перезагрузка вкладки теряет недошедшие ответы).
- Карточка «Сегодня»: нет `in_progress` (сервер не хранит начатую сессию), шиммера загрузки, затухания ready → done.
- Таб-бар белый в тёмной теме web (цвета из `useTheme` на первой отрисовке, старое #56).
- `assets/fonts/PlusJakartaSans-*.ttf` не используются — удалить (в сессии #65 удаление не разрешили).
- Разбор ошибки — шаблонные строки; различие в карточке пары — `null` до #71/#74.
