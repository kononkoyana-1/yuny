# Design Spec — today-session · v1 · 2026-09-24

**Task:** GitHub #65, часть 1. Блок «Сегодня» наверху «Словаря», ежедневное окно «Повторим?», сессия порциями по 8–10 заданий, пауза между порциями, итог дня. «Словарь» становится первой вкладкой и стартовым экраном.
**Screen:** вкладка «Словарь» `apps/mobile/app/(tabs)/dictionary.tsx` (блок и окно) и новый полноэкранный маршрут сессии вне таб-бара (предложение: `apps/mobile/app/study/today.tsx`). Формат одного задания — в `exercise.design.md`.
**Feasibility:** READY_TO_BUILD при предусловиях P1 (контракт, бэкенд) и P2 (токены и примитивы, `design-system-agent`) из §0. Экран можно строить на mock-репозитории параллельно с P1, но не раньше P2.
**Materials used:** `docs/learning/daily-and-folder-study.md` §1–2, §6–9; `docs/learning/vocabulary-engine.md` §3, §9, §11; TZ.md §3 (правило 1), §11 («Универсальные правила экрана»), §15 (ред. 2026-09-24), §17, §19; `apps/mobile/app/(tabs)/{_layout,index,dictionary}.tsx`; `apps/mobile/features/dictionary/MyDictionary.tsx`; `apps/mobile/shared/ui/*`; `apps/mobile/shared/config/tokens.ts`; `apps/mobile/tailwind.config.js`; `apps/mobile/assets/fonts/*` (покрытие проверено через `fc-query`, §V.2); `docs/design/reviews/dictionary.review.md` (R2 OQ4 = #56), `docs/design/reviews/upload-words.review.md` (m1).
**Решения владельца, не пересматриваются:** «Словарь» — первая вкладка и стартовый экран. «Сегодня» — блок в словаре. Вкладки: Словарь, Загрузка, Настройки. Окно «Повторим?» раз в день: 5 / 10 / 15 минут, по умолчанию 10, выбор запоминается, «Позже» — до завтра. Только веб, только русский, 390 и 1280, обе темы. **Визуальное направление (2026-09-24):** текущий вид — не образец. Сочно, современно, по канонам UX/UI. Пустой геймификации (XP, лиги, жёсткий streak) нет.

> Нумерация TZ — по текущей редакции: универсальные правила экрана — §11, дизайн-система — §15, DoD — §17.
>
> **Эта спека — ещё и основа визуального языка для всех четырёх спек #65** (`today-session`, `exercise`, `folder-study`, `folder-map`). Раздел V ниже — общий. Остальные спеки ссылаются на него и объявляют только свои дополнительные токены.

---

## V. Визуальный язык #65 (общий для четырёх спек)

### V.1 Принципы

1. **Один доминирующий акцент на экране.** На «Словаре» это карточка «Сегодня» на градиенте `gradients.hero`. На задании — сам иероглиф крупным кеглем на спокойном фоне. На папке — мозаика плиток, которая заполняется цветом. Всё остальное на экране нейтральное: `surface`, `text`, `textMuted`.
2. **У цвета есть значение, и оно одно на всё приложение.**
   | Цвет | Значит | Где |
   | --- | --- | --- |
   | фиолетовый `primary` и шкала `stage*` | действие и память: чем глубже цвет, тем прочнее слово | кнопки, плитки, полоски стадий, сегменты навыков |
   | мятный `success` | «верно», «вспомнили», «различаете» | ответ, итоги |
   | янтарный `attention` | «пора освежить», мягкий разбор ошибки | пунктир плитки, лоток разбора |
   | малиновый `pair` | пара путаницы | метка пары, карточка «Разберём пару» |
   `danger` в #65 не используется нигде. Ошибка ученика — не авария.
3. **Крупная типографика для иероглифов.** Иероглиф — главный объект на экране. Отдельное семейство `fontFamily.hanzi` и своя шкала `typography.hanzi*` (V.3).
4. **Живые состояния.** Нажатие, выбор, ответ и переход имеют микроанимацию из `motion.*` (V.6). При `prefers-reduced-motion` всё движение заменяется мгновенной сменой или затуханием не дольше `motion.fast`. Информация никогда не передаётся одним движением.
5. **Удобно на пальце и с клавиатуры.** Тап-таргет — не меньше `sizing.tapTarget`. У каждого интерактивного элемента видимое кольцо фокуса `focusRing`. У заданий есть клавиатурные сокращения (`exercise.design.md` §7).
6. **WCAG AA.** Контраст текста ≥ 4.5:1, крупного текста и не-текстовых элементов ≥ 3:1. Значения в V.4 посчитаны.
7. **Без пустой геймификации.** Праздник — только за настоящий результат: слово перешло на стадию выше, пара решена. Очков, уровней и огня серии нет.

### V.2 Шрифты — почему меняются

Проверено `fc-query` по `apps/mobile/assets/fonts/PlusJakartaSans-*.ttf`:

- **Кириллицы в шрифте нет совсем** (блока `0004` нет в charset). Весь русский интерфейс сейчас рисуется запасным шрифтом браузера, а не Plus Jakarta.
- **Нет букв третьего тона пиньиня** `ǎ ǐ ǒ ǔ` и `ǖ ǘ ǚ ǜ` (U+01CE–U+01DC). Остальные тоновые буквы есть. `mǎi` рисовался бы двумя шрифтами в одном слове, а в P1 варианты `mǎi / mài` различаются как раз этой буквой.
- Шрифта с иероглифами не подгружено (#41).

Новые семейства — V.7, `fontFamily.ui` и `fontFamily.hanzi`.

### V.3 Типографика

Существующие `typography.display/title/heading/body/caption` остаются по размерам, но набираются новым `fontFamily.ui`. Добавляются (значения — V.7):

| Токен | Для чего |
| --- | --- |
| `typography.numberHero` | крупное число в карточке «Сегодня» («34») |
| `typography.eyebrow` | надстрочная метка раздела прописными («СЕГОДНЯ», «НОВОЕ СЛОВО») |
| `typography.hanziHero` | иероглиф задания и карточки знакомства, 1–2 знака |
| `typography.hanziHeroLong` | то же для 3+ знаков |
| `typography.hanziOption` | варианты-иероглифы (W1/W2, C1), плитки C2 |
| `typography.hanziSentence` | китайское предложение в C1/C2, примеры, коллокации |
| `typography.hanziTile` | плитка карты слов |
| `typography.hanziInline` | иероглиф внутри русской строки |
| `typography.pinyinHero` | пиньинь под `hanziHero` |

### V.4 Цвет

Имена существующих токенов сохраняются, у части меняются значения (V.7, «Изменённые токены»). Затем Загрузка и Настройки перекрасятся автоматически. Это желаемо: интерфейс один.

### V.5 Поверхности, глубина, радиусы

- Фон страницы — `background`. Карточки — `surface` с тенью `elevation.raised`. В тёмной теме тень не видна, поэтому карточка получает рамку `border` (как сейчас делает `Card`).
- Главная карточка экрана (только одна) — `gradients.hero`, `radius.hero` и цветная тень `elevation.glow`.
- Плитки и варианты ответа — `radius.tile`.

### V.6 Движение

| Токен | Где |
| --- | --- |
| `motion.fast` | нажатие (сжатие до `motion.pressScale`), смена выбора |
| `motion.base` | выезд лотка ответа, смена задания, заполнение полоски |
| `motion.slow` | праздник перехода стадии (плитка «наливается» цветом), появление итога |
| `motion.easeOut` | все входы |
| `motion.spring` | «пружина» верного варианта, раскрытие карточки |

`prefers-reduced-motion` читается через существующий `useReducedMotion`. Тогда масштаб и сдвиги отключаются, остаётся затухание `motion.fast` или мгновенная смена.

### V.7 Новые и изменённые токены (общие для #65)

`design-system-agent` вносит их в `apps/mobile/shared/config/tokens.ts` и `apps/mobile/tailwind.config.js` одновременно. Контраст посчитан по WCAG 2.x.

**Изменённые токены (новые значения у существующих имён)**

| Токен | Светлая | Тёмная | Зачем |
| --- | --- | --- | --- |
| `primary` | `#5B3DF5` | `#8F7BFF` | сочнее прежнего. Белый текст на светлом 6.12:1. Тёмный `textInverse` на тёмном 5.91:1 |
| `primarySoft` | `#ECE8FF` | `#2A2256` | подложка выбранного. `primary` на ней 5.12:1, тёмный `#C4B8FF` 7.97:1 |
| `background` | `#F6F5FB` | `#0F0C1D` | воздух: почти белый, холодный. Тёмный глубже, чтобы градиент и шкала стадий светились |
| `surface` | `#FFFFFF` | `#1A1630` | |
| `surfaceAlt` | `#EEECF6` | `#231E3D` | «утопленная» поверхность: банк плиток C2, дорожка полосок |
| `border` | `#E3E0F0` | `#2E2850` | |
| `text` | `#1A1433` | `#F4F1FF` | 16.26:1 на `background` |
| `textMuted` | `#5F5A7A` | `#ABA4C9` | ≥ 5.56:1 на `surfaceAlt` / ≥ 6.71:1 в тёмной |
| `textInverse` | `#FFFFFF` | `#0F0C1D` | |
| `success` | `#0F9D6B` | `#34D399` | заливка и иконки, ≥ 3.2:1 к фону. Текстом не используется, для текста — `successInk` |
| `gradients.primary` | `["#5B3DF5", "#7B2FE0"]` | `["#9D8BFF", "#B79CFF"]` | кнопка primary. Белый 6.12 / 6.32. Тёмный текст 6.94 / 8.45 |

**Новые токены — цвет**

| Токен | Светлая | Тёмная | Зачем |
| --- | --- | --- | --- |
| `successInk` | `#0B7A53` | `#6EE7B7` | текст «Верно» на `successSoft`, 4.79:1 / 9.57:1 |
| `successSoft` | `#E3F7EE` | `#0F2E26` | лоток верного ответа, фон верного варианта |
| `attention` | `#C2620A` | `#FFB547` | пунктир «пора освежить», рамка варианта в разборе. 3.84:1 к `background` / 9.95:1 к `surface` |
| `attentionInk` | `#B45309` | `#FFC46B` | текст на `attentionSoft`, 4.51:1 / 9.04:1 |
| `attentionSoft` | `#FFF1DC` | `#3A2710` | лоток мягкого разбора, подложка «долга» |
| `pair` | `#D6336C` | `#FF6B9E` | метка пары путаницы, акцент карточки пары. 4.62:1 к `surface` / 6.53:1 |
| `pairInk` | `#B4235A` | `#FF8FB8` | текст на `pairSoft`, 5.25:1 / 7.42:1 |
| `pairSoft` | `#FFE3EE` | `#3A1530` | подложка метки пары |
| `heroInk` | `#FFFFFF` | `#FFFFFF` | текст на `gradients.hero`, ≥ 5.9:1 на каждой точке |
| `heroInkMuted` | `#E9E4FF` | `#EDE9FF` | второстепенный текст на герое, ≥ 4.78:1 / ≥ 5.78:1 |
| `heroAction` | `#FFFFFF` | `#F4F1FF` | кнопка на герое (инверсная) |
| `heroActionInk` | `#5B3DF5` | `#4A2DDB` | её подпись, 6.12:1 / 7.02:1 |
| `focusRing` | `#5B3DF5` | `#C4B8FF` | кольцо фокуса. На героe — `heroInk` |
| `stageNew` | `#FFFFFF` | `#1A1630` | шкала стадий, шаг 1 «Новое» — пустая плитка |
| `stageMeeting` | `#EEE9FF` | `#2A2350` | шаг 2 «Знакомлюсь» |
| `stageRecognize` | `#D6CCFF` | `#3D3278` | шаг 3 «Узнаю» |
| `stageRecall` | `#A391FF` | `#5A48B8` | шаг 4 «Вспоминаю» |
| `stageUse` | `#6A4DF2` | `#8C7AF5` | шаг 5 «Использую» |
| `stageStable` | `#4A2BD6` | `#C4B8FF` | шаг 6 «Устойчиво». В тёмной теме самый светлый: папка «наливается светом» |
| `onStageLight` | `#1A1433` | `#F4F1FF` | текст на шагах 1–4. Худший случай 6.76:1 (светлая, `stageRecall`) / 6.18:1 (тёмная, `stageRecall`) |
| `onStageDeep` | `#FFFFFF` | `#0F0C1D` | текст на шагах 5–6. Худший случай 5.31:1 (`stageUse`) / 5.70:1 (`stageUse`) |
| `stageEdge` | `#C9C3E0` | `#4A4270` | рамка плиток шагов 1–3. Без неё они сливаются с фоном: 1.09–1.39:1 |
| `stageStableMark` | `#FFC53D` | `#0F0C1D` | звёздочка на «Устойчиво». 5.1:1 к `stageStable` / 10.68:1 |

**Новые токены — градиенты, тени, радиусы**

| Токен | Светлая | Тёмная | Зачем |
| --- | --- | --- | --- |
| `gradients.hero` | `["#5B3DF5", "#8E2FD9", "#AD2F86"]`, угол 135° | `["#4F2FD0", "#7A2AB8", "#9A2F7A"]` | главная карточка экрана. `heroInk` ≥ 5.9:1 на каждой точке |
| `gradients.heroSheen` | `["#FFFFFF33", "#FFFFFF00"]`, радиальный, из верхнего правого угла | `["#FFFFFF1F", "#FFFFFF00"]` | блик на герое, декор |
| `elevation.raised` | тень `shadowColor`, y 2, blur 8, alpha 0.08 | нет, вместо тени рамка `border` | карточки, плитки |
| `elevation.glow` | тень `#5B3DF5`, y 16, blur 40, alpha 0.28 | тень `#8F7BFF`, y 16, blur 48, alpha 0.22 | цветная тень героя и лотка ответа |
| `radius.tile` | 18 | 18 | плитки, варианты ответа |
| `radius.hero` | 32 | 32 | главная карточка, лоток ответа |

**Новые токены — типографика и шрифты**

| Токен | Значение (обе темы) | Зачем |
| --- | --- | --- |
| `fontFamily.ui` | Inter, начертания 400 / 500 / 600 / 700 / 800, файлы `Inter-{Regular,Medium,SemiBold,Bold,ExtraBold}` | заменяет Plus Jakarta: есть кириллица и все тоновые буквы пиньиня. Перед заменой DS проверяет `fc-query` на блоки `0004` и U+01CD–U+01DC |
| `fontFamily.hanzi` | Noto Sans SC, 400 / 500 / 700. На web — `@font-face` с `unicode-range: U+4E00-9FFF, U+3000-303F, U+FF00-FFEF`, `font-display: swap`. Запасные: `"PingFang SC", "Microsoft YaHei", sans-serif` | иероглифы (#41). Лицензия OFL |
| `typography.numberHero` | 56 / 60, 800, tracking −1.5, tabular-nums | число заданий |
| `typography.eyebrow` | 12 / 16, 700, tracking +1.2, прописные | метки разделов |
| `typography.hanziHero` | 96 / 116, 500 | 1–2 знака |
| `typography.hanziHeroLong` | 64 / 80, 500 | 3+ знака, перенос по знакам разрешён |
| `typography.hanziOption` | 40 / 52, 500 | варианты-иероглифы, плитки C2 |
| `typography.hanziSentence` | 28 / 44, 400 | предложения. Межстрочный ×1.57 по TZ §15 |
| `typography.hanziTile` | 30 / 38, 500 | плитка карты |
| `typography.hanziInline` | 20 / 28, 500 | иероглиф в русской строке |
| `typography.pinyinHero` | 24 / 30, 500, `fontFamily.ui` | пиньинь под героем |

**Новые токены — движение и размеры**

| Токен | Значение | Зачем |
| --- | --- | --- |
| `motion.fast` | 120 ms | нажатие, выбор |
| `motion.base` | 220 ms | лоток, смена задания |
| `motion.slow` | 420 ms | переход стадии, итог |
| `motion.easeOut` | cubic-bezier(0.2, 0.8, 0.2, 1) | входы |
| `motion.spring` | damping 16, stiffness 240, mass 1 | пружина верного варианта |
| `motion.pressScale` | 0.97 | сжатие при нажатии |
| `sizing.tapTarget` | 44 | минимальный тап-таргет TZ §11. Заменяет литерал `min-h-[44px]`, класс `min-h-tap` |
| `sizing.todayRing` | 64 | кольцо в карточке «Сегодня» |
| `sizing.readingColumn` | 560 | колонка паузы и итога на широком экране |
| `sizing.heroColumn` | 400 | ширина левой колонки «Сегодня» на широком экране |
| `sizing.focusRingWidth` | 3 | толщина кольца фокуса, отступ от элемента 2 |

---

## 0. Предусловия

| # | Что | Кто | Почему |
| --- | --- | --- | --- |
| P1 | Контракт «Сегодня» (§1) — Zod-схемы в `packages/shared` и функции на сервере. Mock-репозиторий с фикстурами на каждое состояние из §5. | Владелец бэкенда (схема), `frontend-builder` (mock) | Число заданий, минуты, прогноз, «вспомните ~N», повышения стадий — учебное состояние. Его считает сервер (TZ §3, правило 1). Клиент выводит. |
| P2 | Токены V.7 и примитивы §9. | `design-system-agent`, до экрана | |
| P3 | Порядок вкладок и стартовый маршрут (§3.1). | `frontend-builder`, в этой задаче | Решение владельца |

> **Расхождение в источниках.** В `vocabulary-engine.md`, приложение A, сказано: «Расчёты FSRS — в клиенте … и повторно на сервере». TZ §3 (правило 1) и DoD §17 это запрещают. Спека написана под TZ: клиент не считает ничего из §1 (Open Question 1).

---

## 1. Контракт (форма данных, не имена функций)

**`TodaySummary`** — карточка «Сегодня» и окно:

| Поле | Тип | Где |
| --- | --- | --- |
| `state` | `"no_words" \| "ready" \| "in_progress" \| "done" \| "nothing_due"` | состояние карточки (§5) |
| `budget_minutes` | `5 \| 10 \| 15` | запомненный выбор |
| `plans` | для `5`, `10`, `15`: `{ tasks, minutes, review_count, new_count, new_sources: {folder_id, folder_name, count}[], pairs: {a, b}[], debt: { deferred_tasks } \| null }` | окно и карточка переключаются без запроса |
| `progress` | `{ done, total } \| null` | `in_progress` |
| `recall_now` | `{ recalled, total }` | «Сейчас вы вспомните ~212 из 347 слов» |
| `tomorrow_tasks` | `number` | прогноз |
| `show_daily_prompt` | `boolean` | сервер решает: новые ли сутки, отвечал ли сегодня, есть ли что повторять |

**Действия:** `setBudget(minutes)`, `dismissDailyPrompt()`, `startToday(minutes)` → `StudySession`.

**`StudySession`** (общая с папкой): `{ session_id, kind: "today" \| "folder_review" \| "folder_new" \| "folder_practice" \| "extra_new", portion: { index, count }, tasks: Exercise[] }`. `Exercise` — `exercise.design.md` §1.

**`PortionResult`**: `{ portion: { index, count }, recalled, answered, stage_ups: { headword, reading, from_stage, to_stage }[] (≤ 3), is_last }`.

**`DaySummary`**: `{ advanced: { headword, reading, from_stage, to_stage }[], advanced_total, pairs_resolved: {a, b}[], tomorrow_tasks, extra_new: { count, tomorrow_delta } \| null }`.

Стадия всегда приходит кодом: `new`, `meeting`, `recognize`, `recall`, `use`, `stable`. Подпись даёт i18n, цвет — `stage*`.

---

## 2. Frame (TZ §11)

| Состояние | Primary Action | Secondary Action | Context | Exit |
| --- | --- | --- | --- | --- |
| Словарь, `ready` | «Начать» на герое (`HeroButton`) | «10 минут ▾» — чип на герое, открывает окно выбора | число заданий, минуты, состав, прогноз | таб-бар |
| Словарь, `in_progress` | «Продолжить» (`HeroButton`) | нет | кольцо прогресса, «осталось N» | таб-бар |
| Словарь, `done` / `nothing_due` | нет на карточке. Primary экрана — «Новая папка» | «Можно поучить папку →» (ghost) — фокус на «Мой словарь» | итог, прогноз | таб-бар |
| Окно «Повторим?» | «Начать · 10 минут» (`Button primary`) | «Позже» (`Button ghost`) | «26 пора освежить · 5 новых» | «Позже», Escape, затемнение = «Позже» |
| Сессия, задание | `exercise.design.md` | — | прогресс порции | крестик — выход без потерь |
| Пауза | «Дальше» (`Button primary`) | «Хватит» (`Button ghost`) | итог порции | «Хватит» |
| Итог дня | «Готово» (`Button primary`) | «Ещё 7 новых слов» (`Button secondary`) + цена на завтра | продвинулись, пары, прогноз | «Готово» |

**Один primary на экране словаря.** Сейчас у «Новой папки» вариант `primary` (`MyDictionary.tsx:79-84`). При `ready` и `in_progress` она становится `secondary`: главный акцент — герой. В остальных состояниях остаётся `primary`. Вариант передаётся в `MyDictionary` пропом.

**Почему в итоге дня «Готово» — primary.** Выбранный бюджет исчерпан. «Ещё» — осознанный выбор сверх плана с ценой на завтра (daily-and-folder-study §2.4, §6). Интерфейс не подталкивает к перегрузу.

---

## 3. Layout

### 3.1 Навигация

- `(tabs)/_layout.tsx`: `TAB_ITEMS` в порядке **Словарь, Загрузка, Настройки**.
- `(tabs)/index.tsx`: `Redirect` на `/dictionary`.
- Сессия — маршрут вне `(tabs)`. Таб-бара нет. «Назад» браузера = крестик (выход без потерь). Перезагрузка — продолжение с того же места через `startToday`.

### 3.2 «Словарь», поле пустое — раскладка

**Узкий экран (< `breakpoints.wide`)**, одна колонка, `px-lg`:

1. Строка заголовка: `title` «Словарь».
2. Поле поиска (без изменений по поведению), отступ сверху `spacing.md`.
3. **Герой «Сегодня»**, отступ сверху `spacing.lg`, во всю ширину колонки.
4. «Мой словарь», отступ сверху `spacing.xl`.

**Широкий экран (≥ `breakpoints.wide`)**, две колонки под общей шапкой (заголовок + поле во всю ширину):

```
┌──────────────── Словарь ─────────── [ поиск ................ ] ┐
│ ┌── герой «Сегодня» ──┐   Мой словарь                           │
│ │  sizing.heroColumn  │   ┌ папка ┐ ┌ папка ┐ ┌ папка ┐          │
│ │  sticky сверху      │   └───────┘ └───────┘ └───────┘          │
│ └─────────────────────┘   ┌ папка ┐ …                            │
└──────────────────────────────────────────────────────────────────┘
```

- Левая колонка шириной `sizing.heroColumn` прилипает к верху при прокрутке (`position: sticky` на web). Правая тянется, между колонками `spacing.xl`.
- Раскладка переключается по `onLayout` ширины контейнера, а не по `useWindowDimensions`. В статической web-сборке `useWindowDimensions` не дал правильной ширины при первой отрисовке (`dictionary.review.md` R2 OQ4, #56).

Как только в поле появился запрос, герой и «Мой словарь» скрываются, и видна выдача, как сейчас.

### 3.3 Герой «Сегодня», состояние `ready`

`TodayHero`: `gradients.hero` + `gradients.heroSheen`, `radius.hero`, `elevation.glow`, внутренний отступ `spacing.lg`, весь текст `heroInk` / `heroInkMuted`.

```
СЕГОДНЯ                                     [ 10 минут ▾ ]   eyebrow heroInkMuted · BudgetChip
34                                                            numberHero heroInk
заданий · ~8 минут                                            body heroInkMuted
───────────────────────────────────────────────────────────  разделитель heroInk 20% alpha
↻  Повторить            26                                    строки StatLine, body heroInk
✦  Новые слова           5   из «Покупки»                     + caption heroInkMuted
⇄  Разобрать пару       买 / 卖                               HanziText inline heroInk
[                 Начать                  ]                   HeroButton, во всю ширину
Сейчас вы вспомните ~212 из 347 слов · Завтра ~30             caption heroInkMuted
```

- Число `34` — главный элемент карточки. При первом появлении оно отсчитывается от 0 за `motion.slow`. При reduced motion сразу стоит итоговое число.
- Иконки строк (`review`, `sparkle`, `pair`) — новые глифы, декоративные. Смысл несёт подпись.
- «Новые слова» показываются только при `new_count > 0`. При `new_sources.length > 1` подпись — «из «Покупки» и ещё 2».
- «Разобрать пару» — только при `pairs.length > 0`, «и ещё N» при нескольких.
- **Долг** (`debt !== null`): строки «Новые слова» нет. Под строками — плашка `attentionSoft` / `attentionInk`, `radius.md`: «Сначала освежим 40 слов, новые — завтра».
- `BudgetChip` «10 минут ▾» — пилюля `heroInk` 16% alpha, текст `heroInk`, `radius.pill`, высота ≥ `sizing.tapTarget`. Открывает то же окно, что утром (§3.7).
- `HeroButton`: фон `heroAction`, подпись `heroActionInk`, `typography.heading`, `radius.pill`. Нажатие — `motion.pressScale`.

### 3.4 Герой, состояние `in_progress`

Слева от числа — `ProgressRing` `sizing.todayRing`: дорожка `heroInk` 24% alpha, дуга `heroInk`. Число — `left` («18»), подпись — «осталось из 34». Строк состава нет. Кнопка — «Продолжить». Чипа бюджета нет.

### 3.5 Герой, состояния `done` и `nothing_due`

Карточка перестаёт быть героем: фон `surface`, рамка `border`, `radius.hero`, без тени. Главный акцент экрана уходит к «Новой папке» или к папкам. Внутри:

```
СЕГОДНЯ                                    eyebrow textMuted
✓ Готово на сегодня                        title; Icon check success в кружке successSoft
Завтра ~30 заданий · вспомните ~212 из 347  body textMuted
Можно поучить папку →                      Button ghost
```

`nothing_due` — заголовок «На сегодня всё», строка «Следующее повторение — завтра.». «Можно поучить папку →» прокручивает к заголовку «Мой словарь» и ставит на него фокус. Кнопки «Начать» нет: раньше срока повторять почти бесполезно (daily-and-folder-study §2.4).

Переход `ready → done` при возвращении из сессии: карточка меняется затуханием за `motion.base`, галочка появляется с `motion.spring`.

### 3.6 Состояние `no_words`

Карточка не рендерится. Пустое состояние «Моего словаря» зовёт создать папку или загрузить файл.

### 3.7 Окно «Повторим?»

`Sheet`, внутри `gap-lg`:

```
[Mascot small neutral, decorative]
Повторим слова?                             title
26 пора освежить · 5 новых                  body textMuted — из plans[selected]
┌ 5 ┐ ┌ 10 ┐ ┌ 15 ┐                         BudgetPicker: три крупные плитки
│мин│ │мин │ │мин │                         число title, «мин» caption
└───┘ └────┘ └────┘
[        Начать · 10 минут        ]         Button primary
              Позже                          Button ghost
```

- `BudgetPicker` — три плитки равной ширины, `radius.tile`, высота ≥ 2 × `sizing.tapTarget`. Выбранная: фон `primary`, текст `textInverse`, пружина `motion.spring` при выборе. Остальные: `surfaceAlt`, текст `text`.
- При открытии выбран `budget_minutes`. Переключение сразу меняет строку и подпись кнопки из `plans`, без сети.
- «Начать» — `setBudget` + `startToday` одним действием. На время запроса у кнопки `loading`.
- «Позже», Escape, затемнение, «назад» браузера → `dismissDailyPrompt`. Карточка остаётся.
- Показывается только на вкладке «Словарь», при `show_daily_prompt === true`, не больше раза за монтирование. Deep link на папку или загрузку окно не открывает.
- **Из чипа бюджета** открывается то же окно с заголовком «Сколько времени сегодня?», primary «Готово», ghost «Отмена». Сессия не стартует, меняется только бюджет.

### 3.8 Сессия

Оболочка задания — `exercise.design.md`. Переходы:

```
startToday → задания порции → пауза → … → последнее задание → итог дня
       └── крестик / «назад» / «Хватит» → словарь (карточка in_progress)
```

### 3.9 Пауза между порциями

Полный экран, фон `background`, колонка `sizing.readingColumn` по центру, контент по вертикальному центру, `gap-lg`.

```
        ◔ ◕ ●  ○                            PortionDots: сделанные — primary, текущая пульсирует
ПОРЦИЯ 2 ИЗ 4                               eyebrow textMuted
9 из 10 вспомнили                           display; «9» цветом success
┌─────────────────────────────────┐
│ 便宜   ● Узнаю  →  ● Вспоминаю  │         StageUpRow ×(0–3), Card
└─────────────────────────────────┘
[            Дальше            ]            Button primary
             Хватит                          Button ghost
```

- `StageUpRow`: `HanziText inline`, две `StageDot` со словами стадий и стрелкой. При появлении точка «до» перетекает в цвет «после» за `motion.slow`.
- При `is_last` паузы нет, сразу итог дня.

### 3.10 Итог дня

Полный экран, колонка `sizing.readingColumn`, скролл, `gap-lg`.

```
[Mascot medium celebrating, decorative] + Sparkles
Готово на сегодня                           display
┌ Продвинулись · 7 слов ───────────────┐    Card
│ 袋子   ● Узнаю → ● Вспоминаю         │    StageUpRow ×(≤5)
│ 小票   ● Вспоминаю → ● Использую     │
│ … и ещё 2                            │    caption textMuted
└──────────────────────────────────────┘
┌ ⇄ 买 / 卖 — различаете ──────────────┐    PairResolvedRow: pairSoft, иероглифы pairInk
└──────────────────────────────────────┘
Завтра ~28 заданий                          body textMuted
[             Готово             ]          Button primary
[       Ещё 7 новых слов         ]          Button secondary (если extra_new)
Завтра прибавится ~12 заданий               caption textMuted, = accessibilityHint кнопки
```

- `Sparkles` играет один раз и только при `advanced_total > 0` или `pairs_resolved.length > 0`. При reduced motion не играет. Праздник — только за настоящий результат (V.1 п. 7).
- При `advanced_total === 0` маскот `neutral`, блока «Продвинулись» нет.
- «Ещё 7 новых слов» запускает раунд знакомства из очереди приёма — тот же поток, что в `folder-study.design.md` §4, с `kind: "extra_new"`.

---

## 4. Composition

| Элемент | Примитив `shared/ui` | Токены | Примечание |
| --- | --- | --- | --- |
| Герой «Сегодня» | `HeroCard` (новый) | `gradients.hero`, `gradients.heroSheen`, `radius.hero`, `elevation.glow` | компонент фичи `features/study/TodayHero.tsx` поверх `HeroCard` |
| Число | `Text` + `CountUp` (новый, внутри `HeroCard` или отдельно) | `typography.numberHero`, `heroInk`, `motion.slow` | |
| Строки состава | `StatLine` (новый) | `body`, `heroInk`, `heroInkMuted` | иконка, подпись, значение |
| Иероглифы | `HanziText` (новый) | `typography.hanzi*`, `fontFamily.hanzi` | `lang="zh-CN"` |
| Кнопка героя | `HeroButton` (новый вариант `Button`: `variant="hero"`) | `heroAction`, `heroActionInk`, `radius.pill` | |
| Чип бюджета | `Chip` (новый) | `heroInk` 16% alpha, `radius.pill` | |
| Кольцо | `ProgressRing` | `sizing.todayRing` | новые пропы цвета дорожки и дуги |
| Карточка done | `Card` | `surface`, `border`, `radius.hero` | |
| Окно | `Sheet` | `scrim`, `sizing.sheetMaxWidth` | `initialFocusRef` → «Начать» |
| Выбор минут | `BudgetPicker` = `SegmentedChoice` (новый), размер `large` | `primary`, `surfaceAlt`, `radius.tile`, `motion.spring` | `radiogroup` |
| Точки порций | `PortionDots` (новый) | `primary`, `border` | декоративны, есть текст |
| Переход стадии | `StageUpRow` (фича) из `HanziText` + `StageDot` (новый) | `stage*`, `stageEdge` | |
| Пара решена | `PairResolvedRow` (фича) | `pairSoft`, `pairInk` | |
| Маскот, блёстки | `Mascot`, `Sparkles` | — | `decorative` |
| Загрузка / ошибка / пусто | `LoadingState`, `ErrorState`, `EmptyState` | — | |

**New primitives needed** → `design-system-agent`, §9.

---

## 5. States

### Карточка «Сегодня» (часть экрана — словарь работает при любом её состоянии)

- **Loading:** `HeroCard` той же высоты, на градиенте — шиммер `heroInk` 12% alpha по месту числа и строк, `motion.slow` по кругу. Вместо текста — `caption heroInkMuted` «Собираем занятие на сегодня», `accessibilityLiveRegion="polite"`. При reduced motion шиммера нет. Фоновый перезапрос держит прежние данные.
- **Empty:** `no_words` — карточки нет (§3.6). `nothing_due` — §3.5.
- **Error:** карточка `surface` с рамкой `border`, `radius.hero`. Внутри `body` «Не получилось собрать занятие на сегодня. Проверьте интернет.» и `Button secondary` «Попробовать ещё раз». Остальной словарь доступен.

### Окно

- **Loading:** окно не открывается, пока нет `TodaySummary`.
- **Error «Начать»:** под кнопками `FeedbackBanner` «Не получилось начать. Проверьте интернет и попробуйте ещё раз.». Окно остаётся открытым.
- **Error «Позже»:** окно закрывается молча. В худшем случае оно откроется ещё раз.

### Сессия

- **Loading первого задания:** `LoadingState` «Собираем задания».
- **Между заданиями:** экрана загрузки нет, задания порции приходят сразу. Если следующая порция не пришла к «Дальше» — у кнопки `loading`.
- **Error:** `ErrorState` «Не получилось собрать задания» / «Проверьте интернет. Ответы, которые вы уже дали, сохранены.», «Попробовать ещё раз», «К словарю».
- **Empty:** заданий нет (всё сделано на другом устройстве) — `EmptyState` «На сегодня всё. Следующее повторение — завтра.» + «К словарю».

### Пауза и итог

- **Loading:** `LoadingState` «Подводим итог».
- **Error:** `ErrorState` «Не получилось показать итог» / «Ответы сохранены.» + retry + «К словарю».

---

## 6. Theming

- Все фоны, рамки и цвета текста — через `className` с парой `dark:`. **`useTheme().colors` для фона и рамки не используется**: в статической web-сборке он дал белый таб-бар в тёмной теме (#56). Исключения — SVG (`ProgressRing`, `Icon`) и градиент героя, у которого значения идут через `shared/platform/gradient`. Для них тема определяется через `prefers-color-scheme` на web (как `darkMode: "media"` в tailwind), а не через хук при первой отрисовке.
- Тёмная тема: герой — тёмная ветка `gradients.hero` с цветной тенью `elevation.glow` (в тёмной теме она видна как свечение). Карточки — `surface` + рамка `border`. Шкала стадий в тёмной теме светлеет к «Устойчиво».
- Фокус на герое — кольцо `heroInk`, вне героя — `focusRing`.

---

## 7. Accessibility, клавиатура, фокус

| Элемент | Роль и атрибуты |
| --- | --- |
| «СЕГОДНЯ» | `accessibilityRole="header"` (eyebrow визуально, заголовок по смыслу) |
| Число + подпись | одна группа: «34 задания, примерно 8 минут» |
| Строки состава | одна группа, склеенный `accessibilityLabel`: «Повторить: 26. Новые слова: 5, из «Покупки». Разобрать пару: 买 и 卖» |
| `HeroButton` | `accessibilityHint` «Открывает занятие на весь экран» |
| Чип бюджета | `button`, `accessibilityLabel` «Время занятия: 10 минут. Изменить» |
| `BudgetPicker` | `radiogroup` «Время на занятие». Плитки — `radio` + `checked`. Roving tabindex, стрелки ←/→ |
| Окно | фокус при открытии — на «Начать». При закрытии — на поле поиска (утреннее окно) или на чип (окно из чипа) |
| Пауза, итог | при появлении фокус на заголовке (`header`, на web `tabIndex -1`), как в `upload-words.review.md` m1 |
| `StageUpRow` | «便宜, piányi: было «Узнаю», стало «Вспоминаю»» |
| `PortionDots`, иконки строк, маскот, блёстки | `aria-hidden` |

- Тап-таргеты ≥ `sizing.tapTarget`.
- Web: Enter на паузе — «Дальше». Escape на паузе не делает ничего: выход только явной «Хватит».
- Иероглифы — `HanziText` с `lang="zh-CN"`: и голос диктора, и упрощённые формы знаков.

---

## 8. Копирайт (i18n, `apps/mobile/shared/i18n/ru.ts`)

`[док]` — дословно из `docs/learning/*`. `[предл.]` — предложено здесь (Open Question 3).

| Ключ | Текст | Источник |
| --- | --- | --- |
| `learn.today.eyebrow` | Сегодня | док |
| `learn.today.tasks_one/few/many` | задание / задания / заданий (число отдельно, `numberHero`) | док |
| `learn.today.minutes_one/few/many` | ~{{count}} минута / минуты / минут | док |
| `learn.today.countA11y` | {{tasks}}, примерно {{minutes}} | предл. |
| `learn.today.review` | Повторить | док |
| `learn.today.new` | Новые слова | док |
| `learn.today.newFrom` | из «{{folder}}» | док |
| `learn.today.newFromMore` | из «{{folder}}» и ещё {{count}} | предл. |
| `learn.today.pair` | Разобрать пару | док |
| `learn.today.pairMore` | и ещё {{count}} | предл. |
| `learn.today.debt` | Сначала освежим {{count}} слов, новые — завтра | док |
| `learn.today.start` | Начать | док |
| `learn.today.startHint` | Открывает занятие на весь экран | предл. |
| `learn.today.continue` | Продолжить | предл. |
| `learn.today.leftOf` | осталось из {{total}} | предл. |
| `learn.today.budgetChip` | {{count}} минут | предл. |
| `learn.today.budgetChipA11y` | Время занятия: {{count}} минут. Изменить | предл. |
| `learn.today.footer` | Сейчас вы вспомните ~{{recalled}} из {{total}} слов · Завтра ~{{tomorrow}} | док (две строки документа в одну) |
| `learn.today.done` | Готово на сегодня | док |
| `learn.today.nothingDue` | На сегодня всё | док |
| `learn.today.nothingDueDetail` | Следующее повторение — завтра. | док |
| `learn.today.doneDetail` | Завтра ~{{tomorrow}} заданий · вспомните ~{{recalled}} из {{total}} | предл. |
| `learn.today.toFolders` | Можно поучить папку → | док |
| `learn.today.loading` | Собираем занятие на сегодня | предл. |
| `learn.today.error` | Не получилось собрать занятие на сегодня. Проверьте интернет. | предл. |
| `learn.today.retry` | Попробовать ещё раз | как `dictionary.mine.retry` |
| `learn.prompt.title` | Повторим слова? | док |
| `learn.prompt.changeTitle` | Сколько времени сегодня? | предл. |
| `learn.prompt.line` | {{review}} пора освежить · {{new}} новых | док |
| `learn.prompt.lineNoNew` | {{review}} пора освежить | предл. |
| `learn.prompt.unit` | мин | док |
| `learn.prompt.optionA11y` | {{count}} минут | предл. |
| `learn.prompt.groupA11y` | Время на занятие | предл. |
| `learn.prompt.start` | Начать · {{count}} минут | док |
| `learn.prompt.later` | Позже | док |
| `learn.prompt.save` | Готово | предл. |
| `learn.prompt.cancel` | Отмена | как `dictionary.folder.cancel` |
| `learn.prompt.startError` | Не получилось начать. Проверьте интернет и попробуйте ещё раз. | предл. |
| `learn.session.loading` | Собираем задания | предл. |
| `learn.session.error.title` | Не получилось собрать задания | предл. |
| `learn.session.error.detail` | Проверьте интернет. Ответы, которые вы уже дали, сохранены. | предл. |
| `learn.session.toDictionary` | К словарю | предл. |
| `learn.session.summaryLoading` | Подводим итог | предл. |
| `learn.session.summaryError` | Не получилось показать итог | предл. |
| `learn.session.summaryErrorDetail` | Ответы сохранены. | предл. |
| `learn.pause.eyebrow` | Порция {{index}} из {{count}} | док |
| `learn.pause.recalled` | {{recalled}} из {{answered}} вспомнили | док |
| `learn.pause.next` | Дальше | док |
| `learn.pause.stop` | Хватит | док |
| `learn.stageUp.a11y` | {{word}}, {{reading}}: было «{{from}}», стало «{{to}}» | предл. |
| `learn.day.title` | Готово на сегодня | док |
| `learn.day.advanced_one/few/many` | Продвинулись · {{count}} слово / слова / слов | док |
| `learn.day.more` | … и ещё {{count}} | предл. |
| `learn.day.pairResolved` | {{a}} / {{b}} — различаете | док |
| `learn.day.tomorrow` | Завтра ~{{count}} заданий | док |
| `learn.day.done` | Готово | предл. (в документе «Закрыть») |
| `learn.day.extraNew` | Ещё 7 новых слов | док |
| `learn.day.extraNewCost` | Завтра прибавится ~{{count}} заданий | предл. (в документе «+~12 заданий завтра») |
| `learn.stage.new / meeting / recognize / recall / use / stable` | Новое / Знакомлюсь / Узнаю / Вспоминаю / Использую / Устойчиво | док |

Все числа с существительными — `_one/_few/_many`, как `dictionary.mine.words`.

---

## 9. Для `design-system-agent` — примитивы (токены — V.7)

| # | Примитив | Требования |
| --- | --- | --- |
| DS1 | **`HeroCard`** | контейнер `gradients.hero` + `gradients.heroSheen`, `radius.hero`, `elevation.glow`. Текст внутри по умолчанию `heroInk`. Кольцо фокуса у детей — `heroInk` |
| DS2 | **`Button variant="hero"`** | `heroAction` / `heroActionInk`, `radius.pill`, `motion.pressScale` |
| DS3 | **`Chip`** | пилюля-кнопка, варианты `onHero` / `neutral` / `pair` / `attention`. Высота ≥ `sizing.tapTarget` у интерактивного, у декоративного меньше |
| DS4 | **`SegmentedChoice`** | `radiogroup`, roving tabindex, стрелки. Размеры `large` (плитки окна) и `compact`. Выбранный — `primary` / `textInverse`, пружина `motion.spring` |
| DS5 | **`HanziText`** | `fontFamily.hanzi`, `lang="zh-CN"`, варианты `hero` / `heroLong` / `option` / `sentence` / `tile` / `inline` по V.7. `hero` сам выбирает `heroLong` при длине ≥ 3 знаков |
| DS6 | **`StageDot`** | кружок цвета `stage*`, у шагов 1–3 рамка `stageEdge`. Декоративен |
| DS7 | **`StatLine`** | иконка, подпись, значение справа (tabular-nums), опционально подпись под значением |
| DS8 | **`CountUp`** | число, которое отсчитывается за `motion.slow`. При reduced motion — сразу итог. Для диктора — только итоговое значение |
| DS9 | **`PortionDots`** | ряд точек: сделано / текущая (пульс) / впереди |
| DS10 | **`ProgressRing`: пропы цвета** | `trackColor`, `arcColor` — для героя |
| DS11 | **Глифы `Icon`** | `check`, `review` (круговая стрелка), `sparkle`, `pair` (две встречные стрелки), `chevronDown`, `chevronRight`, `arrowRight` |
| DS12 | **Фокус-кольцо** | единый стиль `focusRing` + `sizing.focusRingWidth` во всех интерактивных примитивах (`:focus-visible` на web) |
| DS13 | **Шрифты** | `fontFamily.ui` (Inter) вместо Plus Jakarta для всего `Text`. `fontFamily.hanzi` (Noto Sans SC) по `unicode-range`. Проверить `fc-query`: кириллица `0400–04FF`, пиньинь `U+01CD–U+01DC` |

---

## 10. Acceptance

1. `apps/mobile/app/(tabs)/_layout.tsx`: `TAB_ITEMS` в порядке `dictionary`, `upload`, `settings`.
2. `apps/mobile/app/(tabs)/index.tsx` перенаправляет на `/dictionary`.
3. Карточка «Сегодня» рендерится в `dictionary.tsx` только при `query === ""`, над «Моим словарём». При `state === "no_words"` её нет.
4. Ни один компонент не вычисляет число заданий, минуты, прогноз, `recall_now`, стадии и повышения. Всё берётся из полей §1. Арифметика на клиенте — только доля `ProgressRing` и `total − done`.
5. Переключение минут в окне меняет строку и подпись кнопки из `plans[selected]`. В обработчике нет вызова репозитория.
6. Окно открывается только на вкладке «Словарь» при `show_daily_prompt === true`, не больше раза за монтирование. «Позже», Escape и затемнение вызывают `dismissDailyPrompt`.
7. При открытии в окне выбран `budget_minutes`. «Начать» передаёт выбор и в `setBudget`, и в `startToday`.
8. На экране словаря не больше одного primary-акцента: при `ready` / `in_progress` — `HeroButton`, а «Новая папка» — `secondary`. В остальных состояниях «Новая папка» — `primary`. Вариант приходит пропом.
9. При `ready` и `in_progress` карточка — `HeroCard` (`gradients.hero`, `radius.hero`, `elevation.glow`). При `done`, `nothing_due` и error — `surface` с рамкой `border`, без градиента.
10. Число заданий набрано `typography.numberHero`, отсчитывается через `CountUp`. При `useReducedMotion() === true` анимации нет.
11. Долг показан плашкой `attentionSoft` / `attentionInk` с `learn.today.debt`. Токены `danger` и `warning` в новых файлах не используются.
12. Широкий экран: две колонки, левая шириной `sizing.heroColumn`, прилипает к верху. Раскладка переключается по `onLayout` контейнера, а не по `useWindowDimensions`.
13. Сессия — маршрут вне `(tabs)`. Крестик, «назад» браузера и «Хватит» ведут в словарь без диалога.
14. Пауза: `PortionDots`, `portion.index / count`, `recalled / answered` (`display`, число `recalled` цветом `success`), до 3 `StageUpRow`. При `is_last` паузы нет.
15. Итог дня: primary «Готово». «Ещё 7 новых слов» — `secondary`, только при `extra_new !== null`. Под ней `learn.day.extraNewCost`, он же `accessibilityHint`.
16. Итог дня: не больше 5 `StageUpRow` и `learn.day.more` при `advanced_total > 5`. `Sparkles` — только при `advanced_total > 0 || pairs_resolved.length > 0` и без reduced motion.
17. Когда открылась пауза или итог, фокус на заголовке.
18. `BudgetPicker` — `SegmentedChoice` с `radiogroup` / `radio` / `checked` и управлением стрелками.
19. Все иероглифы набраны `HanziText` (`lang="zh-CN"`). У строк с иероглифами в `accessibilityLabel` есть пиньинь.
20. Фоны, рамки и цвет текста новых компонентов заданы `className` с `dark:`. `useTheme().colors` — только в пропах SVG и градиента.
21. Все строки — ключи §8 в `ru.ts`, числа через `_one/_few/_many`. Литеральной кириллицы в `.tsx` нет.
22. В новых файлах нет сырых hex и px. Тап-таргеты — `sizing.tapTarget` / `min-h-tap`. Длительности — `motion.*`.
23. Loading / empty / error карточки, окна, сессии, паузы и итога — по §5. У каждого состояния есть фикстура и флаг mock (`EXPO_PUBLIC_MOCK_*`).
24. У всех интерактивных элементов видимое кольцо фокуса (`focusRing`, на герое `heroInk`).
25. `pnpm typecheck` и `pnpm lint` чистые.

---

## 11. Out of scope

- Сцена папки в «Сегодня», проверка папки (SHOULD), цель «К дате» (LATER).
- Напоминания и push.
- «Интенсивность» 0.85 / 0.90 / 0.93.
- Исправление #56 целиком. Спека не опирается на `useTheme` / `useWindowDimensions` для первой отрисовки (Acceptance 12, 20), но сам таб-бар в эту задачу не входит (Open Question 4).
- Перекраска Загрузки и Настроек сверх того, что они получат автоматически от изменённых токенов V.7.
- Недельный итог и воронка навыков.

## 12. Open Questions

1. **К владельцу.** FSRS на клиенте (`vocabulary-engine.md`, прил. A) или только на сервере (TZ §3, правило 1)? Спека — под сервер. На вёрстку не влияет.
2. **К владельцу и `design-system-agent`.** Шрифты: Inter (интерфейс) и Noto Sans SC (иероглифы) — предложение с проверенными причинами (V.2). Альтернатива для иероглифа-героя — LXGW WenKai (OFL, кайшу, ближе к почерку). Минусы: другая форма части знаков, чем в вариантах ответа, и лишний вес.
3. **К владельцу.** Строки `[предл.]` в §8 нужно подтвердить до gate B. Отдельно: «Готово» вместо «Закрыть» и «Завтра прибавится ~12 заданий» вместо «+~12 заданий завтра».
4. **К оркестратору.** #56 (таб-бар в тёмной теме, боковая панель на 1280) — до этой задачи или вместе с ней? «Словарь» теперь стартовый экран.
5. **К владельцу бэкенда.** Когда начинаются новые сутки для окна «раз в день»? Предложение: 04:00 по местному времени, как в Anki.
6. **К владельцу.** Новые значения `primary`, `background` и шрифты (V.7) перекрасят и Загрузку с Настройками. Предполагаю, что так и нужно, раз интерфейс один. Подтвердить.
