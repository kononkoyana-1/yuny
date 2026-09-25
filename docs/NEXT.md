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
- #67 занятие `/study` (вне таб-бара): `features/study/exercise/*`, логика `features/study/session/*` (очередь, итог по
  ключу, очередь отправки, блок пары). Mock: `EXPO_PUBLIC_MOCK_STUDY`; R1 «продавать» на 买 → карточка пары.
- Загрузка файла: лимит времени на Gemini, запасные модели (`GEMINI_FALLBACK_MODELS`), мёртвая задача перезапускается,
  «Отмена» при ожидании и на ошибке. Логи функций — Actions → «Function logs (read-only)», фильтр `ai_`.
- #68 окно «Повторим?» (`features/study/BudgetSheet.tsx`: утром само при `show_daily_prompt`, из чипа — смена минут),
  пауза между порциями и итог дня (`PauseScreen`, `DaySummaryScreen`, расчёт — `session/summary.ts`). Сервер: `preview` +
  `today`/`show_daily_prompt`, `review-submit` + `stage_before`/`pair_resolved`; день окна — `learning_settings.last_prompt_on`.
- #69 учёба по папке: `FolderStudyBlock` на экране папки (`folder_preview` → главный режим, «или:», нагрузка),
  `/study?folder=<id>&mode=`, итог раунда (`RoundSummaryScreen`, «Ещё 7 слов»), «Ещё 7 новых слов» после «Сегодня»
  (`start … extra_new`: раунд в папке первого нового слова). Сервер — `_shared/learning/folder.ts` (тесты).

## Дальше по порядку
1. **#70** карта папки + **#85** очередь, **#71** пары. Для #69 не сделано: счётчик «3 из 7 слов» в шапке раунда,
   чип «Проверка» на заданиях «Уже знаю», «Тогда запомним» после непройденной проверки.
2. Позже: #64 контексты (откроет C1/C2 на сервере и «Использую»), #73 learning-overview, #74 знаки, словарь 2.0 #75–#84,
   #86 озвучка (CC-CEDICT + Make Me a Hanzi + HSK Sentences Audio + локальный CosyVoice2; сперва решения владельца).

## Известные ограничения
- Занятие: нет анимаций смены задания, раскрытия R2, перелёта в пропуск C1, въезда пары (спека §3.1, §4); иероглифы внутри
  строк разбора — обычный `Text`, не `HanziText`; очередь отправки только в памяти (перезагрузка вкладки теряет недошедшие ответы).
- Карточка «Сегодня»: нет `in_progress` (сервер не хранит начатую сессию), шиммера загрузки, затухания ready → done.
- Таб-бар белый в тёмной теме web (цвета из `useTheme` на первой отрисовке, старое #56).
- `assets/fonts/PlusJakartaSans-*.ttf` не используются — удалить (в сессии #65 удаление не разрешили).
- Разбор ошибки — шаблонные строки; различие в карточке пары — `null` до #71/#74.
