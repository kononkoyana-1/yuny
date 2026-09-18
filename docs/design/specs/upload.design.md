# Design Spec — upload · v1.1 · 2026-09-18

> **v1.1 (2026-09-18, после gate B раунд 2).** Уточнения, не меняющие принятого в раундах 1–2: они фиксируют решения владельца
> и закрывают пробелы, которые нашёл ревью (m1–m6). Что уже сделано — помечено «сделано»; что остаётся разработчику — Acceptance 26–28.
> Изменённые места: §2 строка `limits`; Layout, строка файла; §3 п. 2–5 и «Отображаемое имя»; §Copy (`upload.error.unreadable`,
> `upload.file.unnamed`); Acceptance 17, 26–28.

**Task:** Экран 02 «Загрузка» (issue #11) и экран ожидания разбора (issue #15) с ошибками по классам (issue #14) — один поток от выбора файлов до готового модуля.
**Screen:** TZ.md §11 «02. Загрузка», вкладка `apps/mobile/app/(tabs)/upload.tsx`
**Feasibility:** READY_TO_BUILD — после предусловий P1–P3 (ниже), P2 делает `design-system-agent` до начала сборки.
**Materials used:** TZ.md §2, §3, §5, §6, §7, §11 (02 + «Универсальные правила экрана»), §13, §15, §17; `packages/shared/schemas/module.ts`; `supabase/functions/module-create/index.ts`; `supabase/functions/_shared/moduleParse.ts`; `apps/mobile/shared/lib/{jobs,edge,backendError}.ts`; `apps/mobile/shared/ui/*`; `apps/mobile/shared/config/tokens.ts`; `apps/mobile/app/(tabs)/_layout.tsx`; `assets/image/design.png` (карточки, пилюля primary, чек-лист дорожной карты как образец ритма строк).

> Нумерация разделов TZ — по редакции 2026-09-17: универсальные правила экрана — §11, дизайн-система — §15, DoD — §17.

---

## 0. Предусловия

| # | Что | Кто | Почему |
| --- | --- | --- | --- |
| P1 | i18n-инфраструктуры в приложении нет (`i18next` не установлен, ни один экран не использует `t()`). Поставить `i18next` + `expo-localization` (оба в TZ.md §2), модуль `apps/mobile/shared/i18n/index.ts` с ресурсом `ru` в `apps/mobile/shared/i18n/ru.ts`, экспорт `t`. Язык зафиксирован — `ru` (TZ.md §1). Русская плюрализация — через суффиксы `_one/_few/_many` i18next; если `Intl.PluralRules` на Hermes недоступен — полифил `intl-pluralrules`. | `frontend-builder`, первым шагом | Без этого требование «все строки через i18n» невыполнимо. |
| P2 | Правки примитивов и новые примитивы — §Composition, «New primitives needed». | `design-system-agent`, **до** экрана | `ErrorState` сейчас пишет по-английски и всегда говорит «This was on our side» — для отказа материала это неправда. |
| P3 | Зависимости `expo-image-picker`, `expo-document-picker`, `expo-image-manipulator`, `expo-crypto` (TZ.md §2, раздел «Медиа/файлы»; `expo-crypto` — только ради `randomUUID`, на Hermes нет `crypto.randomUUID`). Строки разрешений iOS — через plugin-конфиг `expo-image-picker` в `apps/mobile/app.json`, тексты в §Copy (`permissions.*`). `expo-camera` и `expo-file-system` **не** нужны: снимок делает `launchCameraAsync`, байты читаются через `fetch(uri).arrayBuffer()` на всех трёх платформах. | `frontend-builder` | Сейчас ни одного из пакетов нет в `apps/mobile/package.json`. |

---

## 1. Поток и владение состоянием

Один конечный автомат в Zustand — `apps/mobile/features/upload/uploadFlow.store.ts`. Состояние живёт в store, а не в компоненте: пользователь может уйти на другую вкладку во время разбора и вернуться, ожидание не должно потеряться (пока приложение живо). Промис `awaitJob` принадлежит action'у store, не `useEffect` экрана.

```
selecting ──submit──► sending(current, total) ──► reading(jobId, moduleId, startedAt)
    ▲                        │                          │
    │                        ▼                          ├─ done(result) ─► success
    │                   failed(send_failed | limits)    └─ failed(<класс>, jobId, moduleId)
    └──────────── «Выбрать другой файл» / «Загрузить ещё» / «Изменить выбор»
```

Сеть — только через репозиторий (TZ.md §17: «нет прямого обращения к Supabase из компонента»):
`apps/mobile/shared/repositories/module.repository.ts` (интерфейс) + `supabase/module.repository.supabase.ts` + `mock/module.repository.mock.ts`, выбор в `shared/repositories/index.ts` по образцу `userRepository`. Методы:

| Метод | Что делает | Контракт |
| --- | --- | --- |
| `uploadFile(materialId, position, file)` | `storage.from("materials").upload("{user_id}/{material_id}/{position}.{ext}", bytes, { contentType, upsert: true })` | Сегмент пути — **`{position}.{ext}`** (`1.jpg`, `2.pdf`), не исходное имя: кириллица и пробелы в ключе Storage не проходят, а два снимка камеры иначе оба зовутся одинаково. `contentType` обязателен — `module-create` берёт MIME из метаданных Storage. |
| `createModule(req)` | `invokeEdge("module-create", req)`, ответ — `ModuleCreateResponseSchema.parse` | `ModuleCreateRequestSchema`; `filename` = отображаемое имя (§3). |
| `awaitParse(jobId, timeoutMs)` | `awaitJob<unknown>` + `ModuleParseResultSchema.parse` | `timeoutMs` = **120 000** для этого вызова (разбор трёх файлов доходит до ~90 с — таймаут по умолчанию 90 с срабатывал бы на здоровом разборе). |
| `retryParse(moduleId)` | `invokeEdge("module-parse", { module_id })` → `jobRefSchema("module_parse")` | `ModuleParseRequestSchema`. |

`material_id` — `expo-crypto` `randomUUID()`, **один на попытку отправки выбора**; повтор отправки после `send_failed` использует тот же `material_id` (`upsert: true`), чтобы не плодить сирот в Storage.

Учебной логики на клиенте нет: число слов и грамматики экран только показывает из `jobs.result`; решение «материал не учебный» — только по коду сервера.

---

## 2. Классы ошибок — единая таблица маршрутизации

Классифицирует **фаза + код**, не код в одиночку: `internal_error` из `module-create` значит «модуля нет», а тот же код из job — «модуль в `failed`, повторяем разбор». Функция — `apps/mobile/features/upload/errorRoute.ts`, чистая, `(phase, code) → FailureKind`.

| Фаза | Коды | FailureKind | Что видит пользователь | Действие |
| --- | --- | --- | --- | --- |
| sending (Storage upload) | любая ошибка загрузки | `send_failed` | ErrorState | «Попробовать ещё раз» — вся отправка заново (тот же `material_id`, тот же выбор). Вторичное «Изменить выбор» → `selecting`, выбор сохранён. |
| sending (`module-create`) | `too_many_files`, `file_too_large`, `total_too_large`, `unsupported_type` | `limits` | Сразу `selecting`, выбор сохранён, баннер: `too_many_files` → `upload.error.tooMany`, `total_too_large` → `upload.error.totalTooLarge`; `file_too_large`, `unsupported_type` → `upload.limits` (v1.1: сервер не называет файл, а строка лимитов верна без имени; решение владельца, сделано) | — (пользователь правит выбор). Новый `material_id` при следующей отправке: сервер уже удалил папку. |
| sending (`module-create`) | `file_missing`, `network_error`, `internal_error`, `empty_response`, `module_create_failed`, `storage_unavailable`, `invalid_request`, любой неизвестный | `send_failed` | как выше | как выше; при `file_missing` — новый `material_id`. |
| reading (job) | `not_language_material` | `material_rejected` | ErrorState | «Выбрать другой файл» → `selecting`, выбор **сохранён** (из трёх плохим может быть один — пользователь уберёт его сам). |
| reading (job) | `pdf_too_many_pages` | `pdf_too_long` | ErrorState | как `material_rejected`. |
| reading (job) | `ai_unavailable`, `ai_invalid_response`, `internal_error`, любой неизвестный | `parse_failed` | ErrorState | «Попробовать ещё раз» → `retryParse(moduleId)` → `reading` с новым `jobId`. Файлы не перезагружаются. |
| reading (job) | `timeout`, `realtime_unavailable` | `parse_slow` | ErrorState | «Проверить ещё раз» → `awaitParse(**тот же** jobId)` → `reading`. **Не** `module-parse`: при таймауте модуль ещё в статусе `parsing`, и `module-parse` ответит `module_not_retryable` (`supabase/functions/module-parse/index.ts:37`). `awaitJob` сам делает начальный `select`, так что готовый результат подхватится сразу. |
| reading (job) | `file_missing` | `lost` | ErrorState | «Выбрать файлы заново» → `selecting`, выбор сохранён, новый `material_id`. |
| retry (`module-parse`) | `module_not_found`, `module_not_retryable` | `lost` | ErrorState | как выше. |
| retry (`module-parse`) | `network_error`, прочее | `parse_failed` | ErrorState | повтор того же `retryParse`. |

Ни один код не выводится на экран и не попадает в `accessibilityLabel`; код остаётся в `BackendError` для логов.

---

## Frame (TZ.md §11, универсальные правила)

| Состояние | Primary Action | Secondary Action | Context | Exit |
| --- | --- | --- | --- | --- |
| selecting | «Создать модуль» (`Button` primary) | Источники «Камера / Галерея / Файлы» — это ввод, не второе действие; «Убрать» у строки | Заголовок + подзаголовок, строка лимитов, счётчик «Выбрано: N из 3» и суммарный размер | Таб-бар |
| sending / reading | нет — ждать нечего нажимать | нет | Что происходит сейчас и сколько обычно длится | Таб-бар (ожидание продолжается в store) |
| success | «На главную» (`Button` primary) | «Загрузить ещё» (`Button` ghost) | Сколько нашлось слов и грамматики | Таб-бар |
| failed | Одно действие класса (`ErrorState`, кнопка secondary по правилу примитива) | «Изменить выбор» (ghost) — только у `send_failed` | Человеческая причина и что делать | Таб-бар |

---

## Layout

### selecting

Контейнер экрана: `bg-background dark:bg-background-dark`, safe-area сверху. Прокручиваемая область `ScrollView`, контент `px-lg pt-xl pb-lg gap-lg`. Под ней — фиксированный футер `px-lg pt-sm pb-md` с кнопкой, фон `background` (кнопка не уезжает при трёх файлах и крупном шрифте).

Сверху вниз:

1. **Шапка**, `gap-xs`: `Text variant="title"` — `upload.title`; `Text variant="body" tone="muted"` — `upload.subtitle`. Заголовок — `accessibilityRole="header"`.
2. **Источники** — ряд из трёх `ActionTile` (новый, §Composition), `flex-row gap-sm`, каждая `flex-1`. Порядок: Камера, Галерея, Файлы. Иконки `camera`, `image`, `document`.
3. **Строка лимитов** — `Text variant="caption" tone="muted"`, `upload.limits`. Лимит в 20 страниц PDF назван здесь, заранее: клиент страницы не считает, сервер проверяет сам и при превышении даёт `pdf_too_long` — человек должен знать правило до отправки, а не узнать его из ошибки.
4. **Баннер** (если есть сообщение) — `FeedbackBanner tone="encouraging"`. Одно сообщение за раз — последнее. Сбрасывается при следующем удачном добавлении, при удалении файла и при отправке.
5. **Список выбранного**:
   - Подпись над списком — ряд `justify-between`: слева `Text variant="caption" tone="muted"` — `upload.selected.count`; справа `Text variant="caption" tone="muted"` — `upload.selected.total`.
   - Один `Card` (радиус `card`, отступ `md`), внутри строки файлов, между строками — разделитель `h-px bg-border dark:bg-border-dark`, вертикальный отступ строки `py-sm`.
   - **Строка файла**, `flex-row items-center gap-md`:
     - плашка типа: `rounded-md bg-primary-soft dark:bg-primary-soft-dark p-sm`, внутри `Icon` 22 цвета `colors.primary` (`image` для фото, `document` для PDF/DOCX), декоративная;
     - текст `flex-1 gap-xs`: имя — `Text variant="body" className="font-semibold"`, `numberOfLines={1}`, `ellipsizeMode="middle"` (расширение остаётся видно). v1.1: в web react-native-web обрезает только в конце — так и оставить, обходной код не писать: тип файла и так стоит в мета-строке («PDF · 391 КБ»), а в `accessibilityLabel` строки идёт полное имя; мета — `Text variant="caption" tone="muted"` — `upload.file.meta` (или `upload.file.preparing`, пока фото сжимается);
     - `IconButton` (новый) с иконкой `close`, `accessibilityLabel` = `upload.file.remove`.
   - Когда выбрано 3 — под списком `Text variant="caption" tone="muted"` — `upload.selected.full`, все три `ActionTile` в `disabled`.
6. **Футер** — `Button variant="primary"` `upload.submit`, во всю ширину. `disabled`, пока файлов 0 или хоть одно фото ещё сжимается. На время `submit` до перехода в `sending` — `loading`.

### sending / reading (экран ожидания)

Весь контент вкладки заменяется на `LoadingState` на `flex-1`: маскот `thinking` (уже внутри примитива), ритм точек, `message` = заголовок фазы, `detail` (новый проп, §Composition) = объяснение.

| Фаза | `message` | `detail` |
| --- | --- | --- |
| sending | `upload.wait.sending.title` | `upload.wait.sending.detail` — номер загружаемого файла; обновляется по мере загрузки |
| reading, первые 30 с | `upload.wait.reading.title` | `upload.wait.reading.detail` |
| reading, после 30 с | `upload.wait.reading.title` | `upload.wait.reading.slow` |

Порог 30 с — это время на экране, а не прогресс работы: процентов и выдуманных этапов («извлекаем слова… сверяем со словарём…») нет — клиент их не знает, и имитировать их значит обещать то, чего не видно. Честных наблюдаемых фаз две: файлы уходят (клиент считает их сам) и сервер читает (job).

### success

Контент вкладки: `flex-1 items-center justify-center px-lg gap-lg`, фон `background`.

1. `Mascot stage={1} mood="celebrating" size="medium" showStage={false}` — всплеск уже учитывает reduced motion внутри примитива.
2. Блок `items-center gap-xs`: `Text variant="title" className="text-center"` — `upload.done.title` (`accessibilityRole="header"`); `Text variant="body" className="text-center"` — `upload.done.summary` или `upload.done.summaryWordsOnly` (если `grammar_count === 0`); `Text variant="body" tone="muted" className="text-center"` — `upload.done.next`.
3. Кнопки `w-full gap-sm`: `Button variant="primary"` — `upload.done.primary` → `router.navigate("/")` и сброс store в пустой `selecting`; `Button variant="ghost"` — `upload.done.secondary` → сброс store в пустой `selecting`.

Автоперехода нет: момент успеха и числа из разбора — единственное, что человек видит о своём модуле до фазы 4, пропускать его нельзя.

### failed

`ErrorState` на `flex-1` с `title`/`detail`/`retryLabel`/`continueLabel` из §Copy по FailureKind. Состояние `limits` экрана ошибки не имеет — сразу `selecting` с баннером.

---

## 3. Правила выбора файлов (клиентская проверка до отправки)

Все числа — из `MATERIAL_LIMITS`, типы — через `materialKind()` из `packages/shared/schemas/module.ts`. Литералов 3 / 10 / 20 / 30 в коде экрана нет (в i18n-строках числа допустимы — это копирайт).

| Источник | Вызов | Что принимается |
| --- | --- | --- |
| Камера | `ImagePicker.launchCameraAsync` | одно фото |
| Галерея | `ImagePicker.launchImageLibraryAsync({ mediaTypes: images, allowsMultipleSelection: true, selectionLimit: оставшиеся слоты })` | фото |
| Файлы | `DocumentPicker.getDocumentAsync({ multiple: true, type: [pdf, docx, "image/*"] })` | PDF, DOCX, фото |

Порядок проверки при добавлении, для каждого файла по очереди:

1. **Слоты.** Если выбрано больше, чем осталось мест, — берутся первые по порядку, баннер `upload.error.tooMany`.
2. **Тип.** MIME из пикера; если пикер вернул пустой или `application/octet-stream` — по расширению (`.pdf`, `.docx`, `.jpg/.jpeg/.png/.heic/.heif`). `materialKind() === null` → файл не добавляется, баннер `upload.error.unsupported`.
3. **Фото — сжатие.** Строка появляется сразу с мета `upload.file.preparing`; `ImageManipulator` ресайзит до `MATERIAL_LIMITS.imageMaxSide` по длинной стороне (только уменьшение) и **всегда** сохраняет в JPEG, качество 0.8. Итог: MIME `image/jpeg`, расширение `.jpg` — HEIC перестаёт быть проблемой на Android и Web. Ошибка открытия → строка убирается, баннер `upload.error.imageUnreadable`. v1.1: у PDF/DOCX без `size`, байты которого не удалось дочитать, — баннер `upload.error.unreadable`, не `upload.error.unsupported` (сделано).
4. **Размер одного файла** — проверяется **после** сжатия для фото (лимит 10 МБ относится к тому, что уйдёт на сервер; отказывать в 12-мегабайтном снимке, который сожмётся до 1 МБ, нельзя). PDF > `pdfMaxBytes`, DOCX > `docxMaxBytes`, фото > `imageMaxBytes` → не добавляется, баннер соответствующего `upload.error.*TooLarge`.
5. **Сумма** > `maxTotalBytes` с учётом этого файла → не добавляется, баннер `upload.error.totalTooLarge`.
   v1.1: сумма считается по **текущему** списку в store в тот момент, когда размер файла стал известен (PDF/DOCX — сразу, фото — после сжатия), а не по снимку списка на момент выбора. Так файлы, добавленные другим пикером, пока фото сжимается, попадают в сумму. Если фото после сжатия не помещается в 30 МБ вместе с тем, что уже в списке, убирается именно оно, баннер `upload.error.totalTooLarge`. Плитки источников на время сжатия **остаются активными** (см. Accessibility), блокировать их нельзя. Отправку это не задевает: «Создать модуль» и так `disabled`, пока хоть одно фото сжимается.
6. **Разрешения.** Камера или галерея не разрешены → баннер `upload.error.cameraDenied` / `upload.error.galleryDenied`, выбор не меняется. Отмена пикера пользователем — не ошибка, ничего не показывается.

**Отображаемое имя** (и поле `filename` в запросе): фото — `upload.file.photoName` с номером среди фото в выборе («Фото 1», «Фото 2»; после удаления нумерация пересчитывается), PDF/DOCX — исходное имя файла; v1.1: если пикер не отдал `name` (или отдал пустую строку), имя — `upload.file.unnamed`, **никогда** не `uri`. То же имя идёт в баннеры `upload.error.*` с `{{name}}`, в `upload.file.remove` и в `filename` запроса. **Размер** — байты итогового файла (для фото — после сжатия): < 1 МБ → `upload.size.kb` (целое), иначе `upload.size.mb` с одной цифрой после запятой; формат через `Intl.NumberFormat("ru")`.

---

## Composition

| Элемент | Примитив `shared/ui` | Токены | Примечание |
| --- | --- | --- | --- |
| Фон вкладки | `View` | `background` / `background-dark` | как у `index.tsx` |
| Заголовок / подзаголовок | `Text` title / body muted | `text`, `textMuted` | |
| Источник | **`ActionTile` (новый)** | `surface`, `border`, `primary`, радиус `card`, отступ `md`, `gap-xs` | |
| Строка лимитов, подписи | `Text` caption muted | `textMuted` | |
| Баннер проверки | `FeedbackBanner tone="encouraging"` | `accentSoft`, `accent` | нужен live region — см. ниже |
| Список | `Card` | `surface`, радиус `card` | разделитель `border` |
| Плашка типа | `View` + `Icon` | `primarySoft`, `primary`, радиус `md`, отступ `sm` | |
| Убрать файл | **`IconButton` (новый)** | `textMuted` → `text` при нажатии | |
| Создать модуль / На главную | `Button` primary | градиент primary | |
| Загрузить ещё / Изменить выбор | `Button` ghost | `primary` | |
| Ожидание | `LoadingState` (+ проп `detail`) | | |
| Ошибка | `ErrorState` (расширенный) | | |
| Успех | `Mascot` + `Text` + `Button` | | композиция в экране, примитив не нужен |

**New primitives needed → `design-system-agent`, до сборки экрана:**

1. **`ActionTile`** (`apps/mobile/shared/ui/ActionTile.tsx`) — плитка-кнопка «иконка над подписью». Props: `icon: IconName`, `label: string`, `accessibilityLabel: string`, `onPress`, `disabled?`. Вид: `rounded-card bg-surface dark:bg-surface-dark dark:border dark:border-border-dark`, тень как у `Card` в светлой теме, `items-center justify-center gap-xs p-md`, `min-h-[44px]` (высота растёт от контента — Dynamic Type), иконка 24 `colors.primary`, подпись `Text variant="caption"` с `font-semibold`. Pressed: `bg-surface-alt dark:bg-surface-alt-dark`. Disabled: `opacity-50`, `accessibilityState={{ disabled: true }}`. `accessibilityRole="button"`. Нужен и дальше — выбор действия плиткой встретится снова; `Button` (пилюля 56, градиент) для трёх равных источников не подходит — дал бы три primary на экране.
2. **`IconButton`** (`apps/mobile/shared/ui/IconButton.tsx`) — иконка без подписи с зоной нажатия ≥ 44×44 (`min-h-[44px] min-w-[44px] items-center justify-center rounded-pill`). Props: `icon`, `accessibilityLabel` (обязательный), `onPress`, `disabled?`. Иконка 20, `colors.textMuted`; pressed — фон `surfaceAlt`. `accessibilityRole="button"`.
3. **Иконки** в `Icon.tsx` → `GLYPHS`: `camera`, `image`, `document`, `close`. Из того же семейства и того же начертания (filled, `viewBox 0 0 24 24`, без `fill` на путях), что и существующие `home`/`upload`/`settings`. Если глифы не удаётся получить — плитки и кнопка работают на подписях и `accessibilityLabel` (иконки декоративны), но `IconButton` без глифа не имеет видимого смысла: тогда вместо него `Button variant="ghost"` с подписью «Убрать» — решение за `design-system-agent`, фиксируется в handoff.
4. **`ErrorState` — расширение.** Сейчас: захардкоженные английские «Something went wrong», «Your progress is saved. This was on our side.», «Try again», «Continue with another activity». Нужно: `title: string` (heading), `detail?: string` (body muted; нет пропа — нет строки; фиксированной фразы «это на нашей стороне» больше нет — для отказа материала она ложна), `retryLabel?: string`, `continueLabel?: string`; дефолты — из i18n (`common.error.*`), не английские литералы. Поведение кнопок (retry = secondary, continue = ghost) не меняется. Существующие вызовы (`grep ErrorState apps/mobile/app`) переводятся на новые пропы в той же правке.
5. **`LoadingState` — проп `detail?: string`**: `Text variant="body" tone="muted" className="text-center"` под `message`, внутри того же live region.
6. **`Mascot` в `LoadingState`/`ErrorState`** — сейчас озвучивается английским «Mascot, thinking, stage 1». Внутри этих примитивов маскот декоративен: `accessible={false}` / скрыт от ассистивных технологий. Тот же вопрос для экрана успеха решается пропом или обёрткой — на усмотрение `design-system-agent`, требование одно: маскот не озвучивается английским текстом.
7. **`FeedbackBanner`** — если у него нет `accessibilityLiveRegion="polite"` и `accessibilityRole="alert"`, добавить: сообщение проверки должно быть озвучено, фокус при этом не переносится.

---

## States

- **Loading** — экран ожидания (`sending` / `reading`), тексты `upload.wait.*`, маскот `thinking`. Локальная загрузка внутри `selecting` — только строка фото с `upload.file.preparing`, кнопка «Создать модуль» `disabled`.
- **Empty** — `selecting` без файлов: вместо `Card` со списком — `EmptyState showMascot={false} message={t("upload.empty")}` без действия (действие — плитки над ним), кнопка «Создать модуль» видна и `disabled`. Подпись «Выбрано: 0 из 3» не показывается.
- **Error** — `failed` по таблице §2; валидационные ошибки — баннер в `selecting`.
- **Success** — см. Layout.

---

## Theming

Всё через пары `x` / `dark:x-dark` из `tailwind.config.js`; цвета для SVG — из `useTheme().colors`, не из литералов. Что меняется в тёмной теме:

- фон вкладки `background` → `background-dark`;
- `Card` и `ActionTile`: тень → рамка `border-dark` на `surface-dark` (как уже делает `Card`);
- плашка типа файла `primary-soft` → `primary-soft-dark`, иконка `colors.primary` (в dark — светлее, `#9B8FE3` из токенов, читается на `primarySoft` dark);
- разделители `border` → `border-dark`;
- баннер `accent-soft` → `accent-soft-dark`;
- `IconButton` pressed `surface-alt` → `surface-alt-dark`;
- спрайты маскота одинаковы в обеих темах.

---

## Accessibility

| Элемент | Role | Label / State |
| --- | --- | --- |
| Заголовки `upload.title`, `upload.done.title` | `header` | текст |
| `ActionTile` ×3 | `button` | `upload.source.*A11y`; `disabled` только при 3 файлах (пока фото сжимается, плитки активны) |
| Строка файла | группа (`accessible` на контейнере текста) | «{имя}, {мета}» |
| `IconButton` убрать | `button` | `upload.file.remove` с именем файла |
| Баннер | `alert`, live region polite | текст баннера |
| «Создать модуль» | `button` | `disabled` при 0 файлов / сжатии; `busy` при `loading` |
| `LoadingState` | `alert`, live region polite (уже в примитиве) | `message` + `detail`; смена фазы и 30-секундная смена текста озвучиваются |
| `ErrorState` | `alert` (уже в примитиве) | `title` + `detail` |

Тап-таргеты: `ActionTile`, `IconButton`, `Button` — все ≥ 44 по обеим осям. Dynamic Type: ни у одного текстового контейнера нет фиксированной высоты; при крупном шрифте подписи плиток переносятся, ряд из трёх плиток сохраняется. Reduced motion: точки `LoadingState` и всплеск `Mascot` уже его учитывают — в экране новых анимаций нет.

---

## Copy (i18n, `apps/mobile/shared/i18n/ru.ts`)

Тон — на «вы», спокойно, по-взрослому, без кодов, без «ИИ/сервер/API/ошибка 500».

| Ключ | Текст |
| --- | --- |
| `upload.title` | Новый материал |
| `upload.subtitle` | Сфотографируйте страницу учебника или выберите файлы. До трёх файлов станут одним модулем. |
| `upload.source.camera` | Камера |
| `upload.source.gallery` | Галерея |
| `upload.source.files` | Файлы |
| `upload.source.cameraA11y` | Сфотографировать страницу |
| `upload.source.galleryA11y` | Выбрать фото из галереи |
| `upload.source.filesA11y` | Выбрать PDF, DOCX или фото из файлов |
| `upload.limits` | Фото, PDF до 20 страниц или DOCX. До трёх файлов и 30 МБ за раз. |
| `upload.empty` | Выбранные файлы появятся здесь |
| `upload.selected.count` | Выбрано: {{count}} из 3 |
| `upload.selected.total` | {{size}} из 30 МБ |
| `upload.selected.full` | Выбрано три файла — это максимум за один раз |
| `upload.file.photoName` | Фото {{n}} |
| `upload.file.kind.image` | Фото |
| `upload.file.kind.pdf` | PDF |
| `upload.file.kind.docx` | DOCX |
| `upload.file.meta` | {{kind}} · {{size}} |
| `upload.file.preparing` | Готовим фото… |
| `upload.file.remove` | Убрать «{{name}}» |
| `upload.size.kb` | {{value}} КБ |
| `upload.size.mb` | {{value}} МБ |
| `upload.submit` | Создать модуль |
| `upload.error.tooMany` | За раз можно добавить до трёх файлов — взяли первые по порядку. |
| `upload.error.unsupported` | «{{name}}» не подойдёт: нужны фото, PDF или DOCX. |
| `upload.error.imageTooLarge` | Фото слишком большое даже после сжатия. Попробуйте сделать снимок ещё раз. |
| `upload.error.pdfTooLarge` | «{{name}}» больше 20 МБ. Разделите PDF на части поменьше. |
| `upload.error.docxTooLarge` | «{{name}}» больше 5 МБ. Сохраните документ без картинок или разделите его. |
| `upload.error.totalTooLarge` | Вместе файлы больше 30 МБ. Уберите один или выберите файлы поменьше. |
| `upload.error.imageUnreadable` | Не получилось открыть это фото. Попробуйте другое. |
| `upload.error.unreadable` | Не получилось прочитать файл «{{name}}». Выберите его ещё раз или другой файл. *(v1.1, текст владельца, сделано)* |
| `upload.file.unnamed` | Файл без названия *(v1.1)* |
| `upload.error.cameraDenied` | Нет доступа к камере. Разрешите его в настройках телефона. |
| `upload.error.galleryDenied` | Нет доступа к фото. Разрешите его в настройках телефона. |
| `upload.wait.sending.title` | Отправляем файлы |
| `upload.wait.sending.detail` | Файл {{current}} из {{total}}. Не закрывайте приложение, пока файлы загружаются. |
| `upload.wait.reading.title` | Читаем материал |
| `upload.wait.reading.detail` | Выписываем слова из заданий и находим грамматику урока. Обычно это занимает до полуминуты. |
| `upload.wait.reading.slow` | Иногда разбор идёт до полутора минут. Можно перейти на другую вкладку — разбор продолжится. |
| `upload.done.title` | Модуль готов |
| `upload.done.words_one` | {{count}} слово |
| `upload.done.words_few` | {{count}} слова |
| `upload.done.words_many` | {{count}} слов |
| `upload.done.grammar_one` | {{count}} тема грамматики |
| `upload.done.grammar_few` | {{count}} темы грамматики |
| `upload.done.grammar_many` | {{count}} тем грамматики |
| `upload.done.summary` | В материале {{words}} и {{grammar}}. |
| `upload.done.summaryWordsOnly` | В материале {{words}}. |
| `upload.done.next` | Модуль сохранён. Задания по нему появятся на Главной. |
| `upload.done.primary` | На главную |
| `upload.done.secondary` | Загрузить ещё |
| `upload.fail.rejected.title` | Не нашли здесь материала по китайскому |
| `upload.fail.rejected.detail` | Возможно, снимок размыт или на нём нет заданий. Подойдёт страница учебника, распечатка или конспект с заданиями. |
| `upload.fail.rejected.action` | Выбрать другой файл |
| `upload.fail.pdfTooLong.title` | В PDF больше 20 страниц |
| `upload.fail.pdfTooLong.detail` | Оставьте в файле нужные страницы или разделите его на части — каждая станет своим модулем. |
| `upload.fail.pdfTooLong.action` | Выбрать другой файл |
| `upload.fail.parse.title` | Не получилось разобрать материал |
| `upload.fail.parse.detail` | Файлы сохранены, загружать их заново не нужно. Попробуйте ещё раз через минуту. |
| `upload.fail.parse.action` | Попробовать ещё раз |
| `upload.fail.slow.title` | Разбор идёт дольше обычного |
| `upload.fail.slow.detail` | Материал ещё читается. Проверим, готов ли он? |
| `upload.fail.slow.action` | Проверить ещё раз |
| `upload.fail.send.title` | Не получилось отправить файлы |
| `upload.fail.send.detail` | Проверьте интернет. Выбранные файлы на месте — выбирать их заново не нужно. |
| `upload.fail.send.action` | Попробовать ещё раз |
| `upload.fail.send.change` | Изменить выбор |
| `upload.fail.lost.title` | Не получилось закончить разбор |
| `upload.fail.lost.detail` | Отправьте файлы ещё раз — начнём сначала. |
| `upload.fail.lost.action` | Выбрать файлы заново |
| `permissions.camera` | Чтобы сфотографировать страницу учебника или конспект. |
| `permissions.photos` | Чтобы выбрать фото материала из галереи. |

`permissions.*` попадают в `app.json` (строки разрешений читаются ОС до запуска JS) — там те же тексты литералами, ключи здесь для сверки.

---

## Acceptance

Проверяется чтением кода; адреса — файлы из §1 и `apps/mobile/app/(tabs)/upload.tsx`.

**Инфраструктура и контракт**
1. `apps/mobile/shared/i18n/` существует, `ru.ts` содержит все ключи из §Copy с этими текстами; в `upload.tsx` и `features/upload/**` нет ни одной кириллической или английской строки интерфейса вне `t()`.
2. Экран и store не импортируют `getSupabase`/`@supabase/*`; вся сеть — через `moduleRepository` из `apps/mobile/shared/repositories/index.ts`, у которого есть mock- и supabase-реализация.
3. Путь загрузки — `{user_id}/{material_id}/{position}.{ext}`, `contentType` передан, `upsert: true`; `material_id` из `expo-crypto` `randomUUID()`.
4. Запрос `module-create` проходит `ModuleCreateRequestSchema`, ответ — `ModuleCreateResponseSchema.parse`; результат job — `ModuleParseResultSchema.parse`.
5. `awaitParse` вызывает `awaitJob` с таймаутом 120 000.
6. Все лимиты берутся из `MATERIAL_LIMITS`, типы — из `materialKind()`; в коде экрана/store нет числовых литералов лимитов.

**selecting**
7. Три `ActionTile` в порядке Камера / Галерея / Файлы, с иконками `camera` / `image` / `document` и `accessibilityLabel` из `upload.source.*A11y`; при трёх файлах все `disabled`.
8. Фото проходит `ImageManipulator` с ресайзом до `MATERIAL_LIMITS.imageMaxSide` по длинной стороне и форматом JPEG; размер для проверки и показа — итоговый.
9. Проверки §3 идут в порядке слоты → тип → сжатие → размер файла → сумма; каждая ошибка даёт свой ключ `upload.error.*` в `FeedbackBanner tone="encouraging"`; отказ пикера/отмена ничего не показывает.
10. Строка файла: плашка `bg-primary-soft dark:bg-primary-soft-dark`, имя с `numberOfLines={1}` и `ellipsizeMode="middle"`, мета `upload.file.meta`, `IconButton` `close` с `upload.file.remove`.
11. Фото называются `upload.file.photoName` с пересчётом номера после удаления; PDF/DOCX — исходным именем; это же имя уходит в `filename`.
12. Пустой выбор: `EmptyState showMascot={false}` с `upload.empty` без действия; «Создать модуль» `disabled`.
13. Ровно один `Button variant="primary"` в `selecting` — «Создать модуль», в футере вне `ScrollView`; `disabled` при 0 файлов или сжатии, `loading` на время старта отправки.

**Ожидание**
14. `sending` и `reading` рендерят `LoadingState` с `message`/`detail` по таблице Layout; `upload.wait.sending.detail` получает реальные `current`/`total`; смена на `upload.wait.reading.slow` — по 30 с времени в `reading`.
15. Ни процентов, ни выдуманных этапов, ни `ProgressBar` на экране ожидания.
16. Состояние потока — в `features/upload/uploadFlow.store.ts`; промис ожидания запускается action'ом store; уход с вкладки и возврат показывает текущую фазу, а не пустой выбор.

**Ошибки**
17. `features/upload/errorRoute.ts` реализует таблицу §2 целиком, включая классификацию по фазе; есть unit-тест на каждую строку таблицы (Jest, `apps/mobile/jest.config.js`, `pnpm test`).
18. `parse_failed` → `retryParse(moduleId)` без повторной загрузки; `parse_slow` → `awaitParse` с **тем же** `jobId`, `module-parse` не вызывается.
19. `material_rejected` / `pdf_too_long` / `lost` возвращают в `selecting` с сохранённым выбором; `limits` — сразу `selecting` с баннером, без `ErrorState`.
20. `send_failed` повторяет отправку с тем же `material_id` (кроме `file_missing`), вторичное `upload.fail.send.change` возвращает в `selecting`.
21. Ни один `BackendError.code` не попадает в отрисованный текст или `accessibilityLabel`.

**Успех**
22. `Mascot mood="celebrating"`; `upload.done.summary` при `grammar_count > 0`, иначе `upload.done.summaryWordsOnly`, числа — плюральными ключами; primary `upload.done.primary` → `router.navigate("/")` + сброс store; ghost `upload.done.secondary` → сброс store. Автоперехода нет.

**Тема и доступность**
23. Каждый цветной класс в новых файлах имеет пару `dark:`; цвета для `Icon` — из `useTheme().colors`; ни одного hex-литерала.
24. Все интерактивные элементы ≥ 44×44, у каждого `accessibilityRole` и `accessibilityLabel`; заголовки — `accessibilityRole="header"`; у текстовых контейнеров нет фиксированных высот.
25. `pnpm typecheck` и `pnpm lint` чисты; handoff перечисляет проверку на iOS, Android и Web (TZ.md §17) — или честно говорит, где не проверено.

**v1.1 — доделка после раунда 2**
26. В `features/upload/selection.ts` нет ни одного `asset.name ?? asset.uri`: пустое или отсутствующее `name` у PDF/DOCX даёт `t("upload.file.unnamed")` — в строке, в баннерах, в `upload.file.remove` и в `filename`. `ru.ts` содержит `upload.file.unnamed` с текстом из §Copy.
27. Проверка суммы (§3 п. 5) для PDF/DOCX и для фото после сжатия берёт список из store на момент проверки (например, через колбэк `getFiles()` вместо переданного снимка); фото, которое после сжатия не помещается, удаляется через `onRemove` с баннером `upload.error.totalTooLarge`. `ActionTile` на время сжатия не получают `disabled`.
28. `selection.test.ts` покрывает оба пункта: (а) ассет без `name` → имя `upload.file.unnamed`; (б) фото сжимается, в это время в список попадает документ, после сжатия сумма > `maxTotalBytes` → фото удалено, баннер `upload.error.totalTooLarge`.

---

## Out of scope

- Показ модуля на Главной (фаза 4) — до неё `/` показывает нынешнее пустое состояние; спека ведёт туда, куда поток должен вести по TZ.md §5.
- Отмена идущего разбора: сервер отмены не поддерживает.
- Восстановление ожидания после убийства приложения (job продолжится на сервере, модуль окажется в базе — его покажет фаза 4).
- Предпросмотр разобранных слов (TZ.md §20, открытый вопрос).
- Перевод таб-бара `apps/mobile/app/(tabs)/_layout.tsx` и прочих экранов на i18n — отдельная задача; здесь только потоку загрузки и затронутым примитивам.
- Прогресс загрузки в процентах: у Storage-загрузки в RN нет колбэка прогресса; показывается номер файла.

## Open Questions

1. **Недосказанное в контракте (для владельца бэкенда, не блокирует).** Комментарий к `ModuleErrorCodeSchema` в `packages/shared/schemas/module.ts` говорит, что `not_language_material` — единственный код, после которого модуля нет; на деле так же ведёт себя `pdf_too_many_pages` (`_shared/moduleParse.ts:303` → `discardModule`). В enum нет `invalid_request`, `storage_unavailable`, `module_create_failed`, `internal_error` и клиентских `timeout`/`realtime_unavailable`/`network_error`/`empty_response`, хотя все они доходят до экрана.
2. **Сироты `failed`.** Если после `parse_failed` человек не повторяет, а уходит, модуль остаётся в базе в статусе `failed` с файлами. Фаза 4 должна решить, показывать ли такие модули на Главной (с повтором) или скрывать.
3. **Дубль модуля.** Если `module-create` отработал, а ответ потерялся в сети, повтор отправки создаст второй модуль на тех же файлах. Редко; лечится идемпотентностью `module-create` по `material_id` на сервере.
4. **Разрыв до фазы 4.** «На главную» ведёт на пустое состояние «Загрузите свой материал» сразу после успешной загрузки. Если фаза 2 уйдёт пользователям раньше фазы 4, это читается как потеря модуля.
