# Design Spec — folder-study · v1 · 2026-09-24

**Task:** GitHub #65, часть 3. Главная кнопка на экране папки с режимом («Повторить · N» / «Новые слова · 7 из N» / «Практика») и второстепенная строка. Раунд знакомства из 7 слов с «Уже знаю» / «Запомню». Итог раунда с «Ещё 7 слов» и предупреждением о нагрузке.
**Screen:** экран папки `apps/mobile/app/folder/[id].tsx` (блок «Учить папку»; раскладка остального экрана — `folder-map.design.md`) и полноэкранный маршрут учёбы по папке вне таб-бара (предложение: `apps/mobile/app/study/folder/[id].tsx`). Задания — `exercise.design.md`.
**Feasibility:** READY_TO_BUILD при предусловиях P1 (контракт, бэкенд) и P2 (токены и примитивы, `design-system-agent`).
**Materials used:** `docs/learning/daily-and-folder-study.md` §1, §3.1–3.3, §6, §8, §9 (раунд — 7 слов; «К дате» — позже); `docs/learning/vocabulary-engine.md` §3, §8; TZ.md §3, §11, §15, §17; `apps/mobile/app/folder/[id].tsx`; `today-session.design.md` (раздел V и §1); `exercise.design.md`.
**Визуальный язык и общие токены:** `today-session.design.md`, раздел V.

---

## 0. Предусловия

| # | Что | Кто | Почему |
| --- | --- | --- | --- |
| P1 | Контракт §1 — схемы, серверный выбор режима, раунд, итог. Mock с фикстурами на каждый режим и состояние §6. | Владелец бэкенда, `frontend-builder` (mock) | Какой режим нужнее папке, сколько новых, будет ли перегрузка завтра — решает движок (daily-and-folder-study §3.1, §6). Клиент не выбирает режим сам. |
| P2 | Токены V.7, §8 этой спеки, примитивы. | `design-system-agent` | |

---

## 1. Контракт

**`FolderStudyPlan`** — для экрана папки:

| Поле | Тип | Для чего |
| --- | --- | --- |
| `primary` | `{ mode: "review" \| "new" \| "practice", count: number \| null, total_new: number \| null, minutes: number } \| null` | подпись главной кнопки. `null` — сейчас с папкой делать нечего |
| `alternatives` | `{ mode, count: number \| null }[]` | второстепенная строка. Только из `review`, `new`, `practice`, без режима из `primary` |
| `practice_note` | `boolean` | показать «Эти слова пока держатся…» |
| `load_warning` | `{ tomorrow_tasks } \| null` | предупреждение до старта (сервер решает, когда оно нужно, daily-and-folder-study §6) |

**`startFolder(folder_id, mode)`** → `StudySession` (`today-session` §1) с `kind` `folder_review` / `folder_new` / `folder_practice`.

**`RoundSummary`** — итог раунда знакомства:

| Поле | Тип |
| --- | --- |
| `folder` | `{ id, name, started, total, stage_counts: Record<Stage, number> }` |
| `learned` | `{ headword, reading }[]` — прошли знакомство и два верных вспоминания |
| `known` | `{ headword, reading }[]` — «Уже знаю» с пройденной проверкой |
| `returns_tomorrow` | `boolean` |
| `more_new` | `{ count, tomorrow_delta } \| null` — есть ли ещё новые слова в папке и во что обойдётся следующий раунд |
| `load_warning` | `{ tomorrow_tasks } \| null` — показать нагрузку (после двух раундов подряд, daily-and-folder-study §3.2 п. 4) |

**`FolderPracticeSummary`** / **`FolderReviewSummary`** — `PortionResult` из `today-session` §1 плюс `next: { mode, count } \| null` (что предложить дальше).

---

## 2. Frame (TZ §11)

| Состояние | Primary Action | Secondary Action | Context | Exit |
| --- | --- | --- | --- | --- |
| Папка, есть `primary` | `StudyButton` с режимом | строка «или: …» из `alternatives` (`Chip` neutral) | название, мозаика, подпись режима, минуты | «← Назад» |
| Папка, `primary === null` | нет в блоке. Primary экрана отсутствует — это экран просмотра | `alternatives`, если есть | «На сегодня с этой папкой всё…» | «← Назад» |
| Раунд, задание | `exercise.design.md` | | прогресс «3 из 7 слов» | крестик |
| Итог раунда | «Готово» (`Button primary`) | «Ещё 7 слов» (`Button secondary`) | выученные слова, полоска папки, нагрузка | «Готово» |
| Итог повторения / практики | «Готово» (`Button primary`) | `next` (`Button secondary`) | итог порции | «Готово» |

**Почему «Готово» — primary в итоге раунда.** Семь слов — верхняя граница рабочей памяти (daily-and-folder-study §3.2). Следующий раунд — выбор с ценой на завтра. Интерфейс его показывает, но не толкает.

---

## 3. Блок «Учить папку» на экране папки

Место на экране — `folder-map.design.md` §3.1, сразу под шапкой с полоской стадий и над мозаикой.

```
[ ✦  Новые слова · 7 из 18            → ]    StudyButton: gradients.primary, radius.hero
[    ~7 минут · раунд знакомства           ]    вторая строка внутри кнопки, caption textInverse
 или:  ( ↻ Повторить · 3 )  ( ✎ Практика )     caption textMuted + Chip neutral
```

- **`StudyButton`** — главная кнопка экрана: во всю ширину колонки, высота `sizing.studyButton`, `gradients.primary`, `radius.hero`, `elevation.glow`. Слева иконка режима в кружке `textInverse` 16% alpha. Первая строка `heading textInverse`, вторая `caption textInverse` — без прозрачности: в тёмной теме градиент светлый, а текст тёмный, и приглушение уронило бы контраст ниже 4.5:1. Справа `Icon arrowRight`. Нажатие — `motion.pressScale`.
- **Подписи режимов:**
  | `mode` | Иконка | Первая строка | Вторая строка |
  | --- | --- | --- | --- |
  | `review` | `review` | Повторить · {{count}} | ~{{minutes}} минут · только эта папка |
  | `new` | `sparkle` | Новые слова · {{count}} из {{total_new}} | ~{{minutes}} минут · раунд знакомства |
  | `practice` | `practice` | Практика | ~{{minutes}} минут · слова в предложениях |
- **`practice_note`** — под кнопкой `body textMuted`: «Эти слова пока держатся. Практика в предложениях поможет их использовать.»
- **`load_warning`** до старта — под кнопкой плашка `attentionSoft` / `attentionInk`, `radius.md`: «Завтра будет ~{{n}} заданий». Кнопка остаётся доступной: решает пользователь, но с информацией.
- **Второстепенная строка** — `caption textMuted` «или:» и чипы `alternatives`. Чип — `Chip neutral` высотой ≥ `sizing.tapTarget`, с иконкой режима. Если `alternatives` пуст, строки нет.
- **`primary === null`** — вместо кнопки карточка `surface` с рамкой `border`: `Icon check` в кружке `successSoft` и `body` «На сегодня с этой папкой всё. Слова вернутся в «Сегодня», когда придёт срок.».
- Переход в сессию: кнопка «разворачивается» в полноэкранный фон за `motion.base` (shared-element на web не требуется: достаточно затухания экрана папки и появления оболочки). При reduced motion — мгновенно.

---

## 4. Раунд знакомства (`kind: "folder_new"`)

Задания идут в порядке, который прислал сервер: знакомства, вспоминания вразбивку, 2–3 знакомых слова из этой же папки, коллокация-якорь. Рендер — `exercise.design.md`. Особенности раунда:

1. **Счётчик в шапке** — `progress.learned`: «3 из 7 слов». Каждый раз, когда слово набрало два верных вспоминания, рядом со счётчиком на `motion.slow` вспыхивает маленькая `StageDot stageMeeting`. Это единственный праздник внутри раунда.
2. **Знакомство** — `intro.actions = "know_or_remember"`: primary «Запомню», secondary «Уже знаю».
3. **«Уже знаю»** → `acknowledge(task, "know")`. Сервер возвращает в `next` трудную проверку (вспомнить значение и пиньинь без вариантов: R2 + P2). На этих заданиях в строке eyebrow вместо «Ещё раз» стоит `Chip neutral` «Проверка».
   - Проверка пройдена — лоток `correct`, в теле строка с сервера (например, «豆腐 уже знаете — вернётся через неделю»). Слово больше не появляется в раунде, а в итоге попадает в «Уже знали».
   - Не пройдена — лоток `partial` с заголовком «Тогда запомним», затем та же карточка знакомства, но с одной кнопкой «Запомню».
4. **Ошибка** — слово вернётся через 2–3 задания (сервер вставит). На нём `Chip attention` «Ещё раз».
5. **Выход** — крестик, без потерь. При повторном входе в папку `StudyButton` покажет тот же режим и продолжит раунд с того места (сервер).

---

## 5. Итог раунда

Полный экран, колонка `sizing.readingColumn` по центру, скролл, `gap-lg`.

```
[Mascot small celebrating, decorative]
5 новых слов в «Еда»                             display (название папки — «…»)
┌────┐┌────┐┌────┐┌────┐┌────┐
│火锅 ││豆腐 ││ 葱 ││金针菇││辣椒 │                 WordTile карты (folder-map), стадия meeting,
└────┘└────┘└────┘└────┘└────┘                 въезжают по одной с шагом motion.fast
Уже знали: 米饭, 筷子                              body textMuted, HanziText inline (если known)
▓▓▓▓▓▒▒░░░░░░░░░░░  6 из 18 начаты               StageBar (folder-map) + caption
↻ Вернутся завтра в «Сегодня»                    body, Icon review primary
╭ Завтра будет ~45 заданий ╮                     плашка attentionSoft / attentionInk (если load_warning)
[            Готово            ]                 Button primary
[         Ещё 7 слов           ]                 Button secondary (если more_new)
Завтра прибавится ~12 заданий                    caption textMuted = accessibilityHint (из more_new.tomorrow_delta)
```

- Плитки — тот же `WordTile`, что на карте папки (`folder-map.design.md` §3.3), в стадии `meeting`. Пользователь видит, что именно эти плитки сейчас «зажглись» на его карте.
- Если `more_new.count < 7`, подпись — «Ещё {{count}} слов».
- «Готово» → экран папки. Мозаика там уже с новыми цветами. Плитки только что выученных слов при первом показе «наливаются» цветом за `motion.slow` (данные — `learned`, передаются через параметр маршрута или кэш запроса).
- «Ещё 7 слов» → `startFolder(id, "new")` без возврата на экран папки.

## 5.1 Итог повторения и практики

Экран паузы из `today-session` §3.9 с изменениями: eyebrow — название папки. Заголовок — «Повторили {{answered}} слов» / «Практика: {{recalled}} из {{answered}}». Кнопки — «Готово» (primary) и `next` (secondary): «Новые слова · 7» / «Практика».

---

## 6. States

**Блок «Учить папку»:**

- **Loading:** `StudyButton` в состоянии `loading` — градиент есть, вместо подписи шиммер `textInverse` 16% alpha. Строки «или» нет. Мозаика рядом грузится независимо.
- **Error:** карточка `surface` с рамкой `border`: `body` «Не получилось подобрать занятие для папки. Проверьте интернет.» и `Button secondary` «Попробовать ещё раз». Мозаика и действия папки работают.
- **Empty:** папка без слов — блока нет (пустое состояние папки — `folder-map.design.md` §6). `primary === null` — §3.

**Раунд и итог:**

- **Loading:** `LoadingState` «Собираем раунд» / «Подводим итог».
- **Error:** `ErrorState` «Не получилось собрать раунд» / «Проверьте интернет. Ответы, которые вы уже дали, сохранены.», «Попробовать ещё раз», «К папке».
- **Empty:** сервер вернул раунд без слов (новые кончились на другом устройстве) — `EmptyState` «Новых слов в папке не осталось.» + «К папке».

---

## 7. Accessibility, клавиатура, фокус

| Элемент | Роль и подпись |
| --- | --- |
| `StudyButton` | `button`, `accessibilityLabel` = обе строки: «Новые слова, 7 из 18. Примерно 7 минут, раунд знакомства». `accessibilityHint` «Открывает занятие на весь экран» |
| «или:» + чипы | группа `accessibilityLabel` «Другие занятия». Чип — `button`, «Повторить, 3» |
| Плашка нагрузки | обычный текст, связан с кнопкой через `accessibilityHint` |
| Итог раунда | фокус на заголовке при появлении. Мозаика слов — группа «Новые слова: 火锅, huǒguō; 豆腐, dòufu; …». `StageBar` — `accessibilityLabel` из `folder-map` §7 |
| «Ещё 7 слов» | `accessibilityHint` = строка цены на завтра |

- Возврат с раунда — фокус на `StudyButton`.
- Тап-таргеты ≥ `sizing.tapTarget`. Кольцо фокуса на `StudyButton` — `focusRing` снаружи градиента, с отступом.
- Анимации (разворот кнопки, въезд плиток, «наливание» цветом, вспышка точки) выключаются при reduced motion.

---

## 8. Для `design-system-agent`

### Новые токены (в дополнение к `today-session` V.7)

| Токен | Светлая | Тёмная | Зачем |
| --- | --- | --- | --- |
| `sizing.studyButton` | 72 | 72 | высота двухстрочной главной кнопки папки |

### Примитивы

| # | Что | Требования |
| --- | --- | --- |
| DS-S1 | **`StudyButton`** (вариант `Button` с иконкой, двумя строками и стрелкой) | `gradients.primary`, `radius.hero`, `elevation.glow`, `sizing.studyButton`, состояние `loading` с шиммером |
| DS-S2 | **Глиф `practice`** | «предложение»: строка с пропуском или пузырь реплики |
| DS-S3 | `Chip` (neutral, attention), `StageDot`, `HanziText`, `WordTile` карты, `StageBar` | из `today-session` §9 и `folder-map` §8 |

---

## 9. Копирайт

| Ключ | Текст | Источник |
| --- | --- | --- |
| `learn.folder.mode.review` | Повторить · {{count}} | док |
| `learn.folder.mode.new` | Новые слова · {{count}} из {{total}} | док |
| `learn.folder.mode.practice` | Практика | док |
| `learn.folder.sub.review` | ~{{minutes}} минут · только эта папка | предл. |
| `learn.folder.sub.new` | ~{{minutes}} минут · раунд знакомства | предл. |
| `learn.folder.sub.practice` | ~{{minutes}} минут · слова в предложениях | предл. |
| `learn.folder.or` | или: | док |
| `learn.folder.altA11y` | Другие занятия | предл. |
| `learn.folder.chip.review` | Повторить · {{count}} | док |
| `learn.folder.chip.new` | Новые слова | док |
| `learn.folder.chip.practice` | Практика | док |
| `learn.folder.practiceNote` | Эти слова пока держатся. Практика в предложениях поможет их использовать. | док |
| `learn.folder.loadWarning` | Завтра будет ~{{count}} заданий | док |
| `learn.folder.nothing` | На сегодня с этой папкой всё. Слова вернутся в «Сегодня», когда придёт срок. | предл. |
| `learn.folder.loading` | — (шиммер без текста; для диктора `learn.folder.loadingA11y`) | |
| `learn.folder.loadingA11y` | Подбираем занятие | предл. |
| `learn.folder.error` | Не получилось подобрать занятие для папки. Проверьте интернет. | предл. |
| `learn.round.loading` | Собираем раунд | предл. |
| `learn.round.error.title` | Не получилось собрать раунд | предл. |
| `learn.round.toFolder` | К папке | предл. |
| `learn.round.empty` | Новых слов в папке не осталось. | предл. |
| `learn.round.check` | Проверка | предл. |
| `learn.round.thenRemember` | Тогда запомним | предл. |
| `learn.round.title_one/few/many` | {{count}} новое слово / новых слова / новых слов в «{{folder}}» | док |
| `learn.round.known` | Уже знали: {{words}} | предл. |
| `learn.round.started` | {{started}} из {{total}} начаты | док |
| `learn.round.tomorrow` | Вернутся завтра в «Сегодня» | док |
| `learn.round.done` | Готово | предл. (в документе «Хватит») |
| `learn.round.more` | Ещё {{count}} слов | док |
| `learn.round.moreCost` | Завтра прибавится ~{{count}} заданий | предл. |
| `learn.round.wordsA11y` | Новые слова: {{list}} | предл. |
| `learn.folderReview.title` | Повторили {{count}} слов | предл. |
| `learn.folderPractice.title` | Практика: {{recalled}} из {{answered}} | предл. |

---

## 10. Acceptance

1. На экране папки при непустой папке есть блок «Учить папку» с `StudyButton`, если `primary !== null`. Подпись и вторая строка — из `primary.mode` / `count` / `total_new` / `minutes` по таблице §3. Клиент не выбирает режим сам.
2. `StudyButton` — единственный `primary` на экране папки. Действия папки из `folder-map.design.md` — не `primary`.
3. Строка «или:» рендерит только `alternatives`, чипами высотой ≥ `sizing.tapTarget`. При пустом `alternatives` строки нет.
4. `practice_note` и `load_warning` показаны по §3. Плашка — `attentionSoft` / `attentionInk`. `danger` и `warning` не используются.
5. `primary === null` — карточка `learn.folder.nothing`, `StudyButton` нет.
6. Нажатие на кнопку или чип вызывает `startFolder(id, mode)` и открывает полноэкранный маршрут вне `(tabs)`.
7. В раунде счётчик шапки — `progress.learned` («3 из 7 слов»).
8. У знакомства в раунде primary «Запомню» и secondary «Уже знаю». «Уже знаю» вызывает `acknowledge(…, "know")`, дальше идут задания из `next` с чипом «Проверка».
9. Итог раунда: заголовок с числом и названием папки, `WordTile` выученных слов в стадии `meeting`, строка «Уже знали» при непустом `known`, `StageBar` с «N из M начаты», «Вернутся завтра в «Сегодня»» при `returns_tomorrow`.
10. Итог раунда: primary «Готово». «Ещё N слов» — `secondary`, только при `more_new !== null`, с `learn.round.moreCost` как строкой и `accessibilityHint`. Плашка `load_warning` — при `load_warning !== null`.
11. Состояния §6 реализованы, у каждого фикстура и флаг mock.
12. Фокус: при появлении итога — на заголовке. При возврате на экран папки — на `StudyButton`.
13. Анимации §3–5 выключаются при `useReducedMotion() === true`.
14. Иероглифы — `HanziText`. Фоны, рамки, текст — `className` с `dark:`. Сырых hex и px нет.
15. Строки — ключи §9, литеральной кириллицы в `.tsx` нет.
16. `pnpm typecheck` и `pnpm lint` чистые.

## 11. Out of scope

- «Сцена готова» и «Проверка папки» (SHOULD) — в `alternatives` не приходят и не рендерятся.
- Цели папки: «К дате» (LATER, решение владельца), «Только читать», «Не учить» (SHOULD).
- Фокус папки («учить в первую очередь», SHOULD).

## 12. Open Questions

1. **К владельцу.** «Готово» вместо «Хватит» в итоге раунда: «Хватит» на главной кнопке читается как отказ. «Хватит» остаётся на паузе «Сегодня», где он второстепенный.
2. **К владельцу.** Строки `[предл.]` §9 — подтвердить до gate B.
