# NEXT — с чего начать новую сессию

Читать этот файл вместо истории. Обновлять в конце каждой сессии (≤ 40 строк).

## Как работаем
- Ветка `feature/vocab-learning-engine`, выкладка — fast-forward в `master` (CI деплоит Pages + все Edge Functions в `ixtfifglohppaimvyvui`).
- Тесты модели: `cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/` (126; deno ставится `curl -fsSL https://deno.land/install.sh | sh`).
- Клиент: `cd apps/mobile && pnpm typecheck && pnpm lint && pnpm test` (155). Проверка глазами — `npx expo export --clear --platform web` + Playwright
  (`/opt/pw-browsers/chromium`); mock-режим по умолчанию. `--clear` обязателен при смене `EXPO_PUBLIC_*`.
- Одна задача — одна сессия; коммиты с двумя строками атрибуции (Co-Authored-By, Claude-Session).

## Готово
- Сервер (#58–#63): модель памяти, `review-submit` (билеты, `request_id`, `pair_start`), дистракторы, `session-build` (preview/start).
- #65 токены, примитивы; Reanimated-обёртки — в NativeWind (`shared/ui/animated.ts`); цвет текста — только `tone`.
- #66 «Сегодня» (`TodayHero`), #67 `/study` (`features/study/{exercise,session}/*`). Логи — Actions → «Function logs».
- #68 «Повторим?», пауза, итог дня; #69 папка: `FolderStudyBlock`, `/study?folder=<id>&mode=`, `_shared/learning/folder.ts`.
- #70 карта папки: `learning-overview` (`folders` / `folder` / `word`, расчёт — `_shared/learning/overview.ts`, тесты),
  полоска стадий, мозаика `WordTile`, «⋯» (переименовать/удалить), прогресс слова в статье + «Убрать из «…»», мини-полоска
  на карточке. Вход планировщика — `_shared/studyInput.ts`. Доделки: `position`, 2 колонки, стрелки, скелет, «наливание».
- #85 изучено/осталось: `_shared/learning/queue.ts` (срок — по `max_new`) → `learning-overview` (`learned`, `queued`,
  `total`); сводка `WordStats` в «Моём словаре», строки `features/study/queueText.ts`, `QueueHint` после загрузки.
- #74 знаки: `hanzi_chars` (Make Me a Hanzi, Actions → «Hanzi import», 9536 знаков), «卖 = 十 + 买» в карточке пары.
- #88 чтение и значение знаков в знакомстве; #69 «3 из 7 слов», «Проверка», «Тогда запомним».
- #64 предложения: кэш `context_sentences` (ИИ в фоне, задача `context_generate`; проверка — `learning/context.ts`),
  пример в знакомстве, C1/C2, первые W1/C1 (`openingSkills`) — «Использую»/«Устойчиво» достижимы. #86 шаг 1: голос браузера, черты.
- #71 пары: кэш `contrast_cards` (`_shared/contrastCards.ts`, проверка — `learning/contrast.ts`), коллокации в карточке,
  блок из 4 заданий A/B (`pairBlockSides`), не больше 2 интервенций за занятие (`MODEL.pair.maxInterventions`).
## Дальше по порядку
1. Проверить на проде предложения (логи `context_`, `jobs` `context_generate`), коллокации, «卖 = 十 + 买». Не сделано: #64 T3/T4, повторы
   предложений между сессиями, `contextReady` в `learning-overview`; #85 «Уже знаю» отдельным действием.
2. Дальше: #64 контексты (C1/C2 и «Использую»), #73, словарь 2.0 #75–#84, #86 озвучка (решения владельца), #87 (сроки).

## Известные ограничения
- Занятие: нет анимаций смены задания, раскрытия R2, перелёта в пропуск C1, въезда пары (спека §3.1, §4); иероглифы внутри
  строк разбора — обычный `Text`, не `HanziText`; очередь отправки только в памяти (перезагрузка вкладки теряет недошедшие ответы).
- Карточка «Сегодня»: нет `in_progress` (сервер не хранит начатую сессию), шиммера загрузки, затухания ready → done.
- Таб-бар белый в тёмной теме web (цвета из `useTheme` на первой отрисовке, старое #56).
- `assets/fonts/PlusJakartaSans-*.ttf` не используются — удалить (в сессии #65 удаление не разрешили).
- Разбор ошибки — шаблонные строки. Разбор знаков — один уровень (读 против 买 через 卖 не находит).
