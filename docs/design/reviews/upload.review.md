# Design Review — upload

Спека: `docs/design/specs/upload.design.md` v1 (2026-09-18).

## Round 1 · 2026-09-18 · REVISION_REQUIRED

**Reviewed:** рабочее дерево, не закоммичено —
`apps/mobile/app/(tabs)/upload.tsx`;
`apps/mobile/features/upload/{errorRoute,selection,sources,format,uploadFlow.store}.ts`;
`apps/mobile/shared/repositories/{module.repository.ts,index.ts,supabase/module.repository.supabase.ts,mock/module.repository.mock.ts}`;
`apps/mobile/shared/i18n/{index,ru}.ts`; `apps/mobile/app/_layout.tsx`; `apps/mobile/app.json`;
`apps/mobile/package.json`; `pnpm-workspace.yaml`. Примитивы P2 (коммит 3f1ceca) читались как контекст;
`LoadingState`/`ErrorState` попали в замечания только там, где их поведение нарушает требование этой спеки.

**Depth:** проверка кода + отрисовка в web: `expo export --platform web` с `EXPO_PUBLIC_DATA_SOURCE=mock`,
headless Chromium 390×844 через CDP, светлая и тёмная тема. Видел глазами: `selecting` пустой и с двумя файлами
(PDF + фото, выбраны через системный диалог файлов), `sending`, `reading`, `success`, «Загрузить ещё».
**Не видел:** ни одного состояния `failed` (mock-репозиторий ошибок не отдаёт), камеру и галерею, iOS и Android.
Скриншоты: `/tmp/claude-1000/-mnt-c-Users-------orca-projects-Yuny/0b357978-85e6-446e-9ddb-fc373b78d635/scratchpad/shots/*.png`
(временная папка сессии — в репозиторий не кладутся).

**Checks:** `pnpm typecheck` pass · `pnpm lint` pass (прогнал рецензент, не только разработчик).
Таблица §2 проверена отдельно: `errorRoute.ts` транспилирован и прогнан на 26 парах (фаза, код),
включая неизвестные коды и `needsFreshMaterialId` — расхождений 0. Тексты `ru.ts` сверены
со всеми 70 строками §Copy — расхождений 0.

### Acceptance

| # | Пункт | Результат | Адрес |
| --- | --- | --- | --- |
| 1 | i18n, все ключи §Copy, нет строк вне `t()` | pass | `shared/i18n/ru.ts` (70/70 совпадают); в `upload.tsx` и `features/upload/**` кириллица только в комментариях |
| 2 | Нет `getSupabase`/`@supabase` в экране и store; репозиторий с mock и supabase | pass | `shared/repositories/index.ts:18-19` |
| 3 | Путь `{user_id}/{material_id}/{position}.{ext}`, `contentType`, `upsert`, `randomUUID` | pass | `module.repository.supabase.ts:24,36`; `uploadFlow.store.ts:225` |
| 4 | Схемы запроса/ответа/результата | pass | `module.repository.supabase.ts:42-50` |
| 5 | `awaitParse` → `awaitJob(…, 120 000)` | pass | `uploadFlow.store.ts:142`; `module.repository.supabase.ts:48-49` |
| 6 | Лимиты из `MATERIAL_LIMITS`, типы из `materialKind()` | pass | `selection.ts:148,190,198,224,234`; `upload.tsx:76`. `30_000` в `upload.tsx:171` — это порог времени, не лимит материала |
| 7 | Три `ActionTile`, порядок, иконки, a11y-подписи, `disabled` при трёх | pass | `upload.tsx:93-118`; в отрисовке — три `button` с `upload.source.*A11y` |
| 8 | Сжатие до `imageMaxSide`, JPEG, итоговый размер | pass | `selection.ts:116-132` |
| 9 | Порядок проверок, ключи баннеров, молчание при отмене | pass | `selection.ts:148-237`; `uploadFlow.store.ts:166-172` |
| 10 | Строка файла: плашка, `numberOfLines`/`ellipsizeMode="middle"`, мета, `IconButton` | pass (код) | `upload.tsx:46-59`. В web многоточие стоит в конце — см. minor m4 |
| 11 | Имена фото с пересчётом; это же имя в `filename` | pass | `selection.ts:38-53`; `uploadFlow.store.ts:263` |
| 12 | Пустой выбор: `EmptyState showMascot={false}`, кнопка `disabled` | pass | `upload.tsx:126-127,162` |
| 13 | Один primary, в футере вне `ScrollView`, `disabled`/`loading` | pass | `upload.tsx:158-166` |
| 14 | `LoadingState` по фазам, реальные `current`/`total`, смена текста по 30 с | **fail** | `uploadFlow.store.ts:232,254` — B1 |
| 15 | Нет процентов, этапов, `ProgressBar` | pass | `upload.tsx:173-204` |
| 16 | Состояние в store, промис в action'е | pass | `uploadFlow.store.ts:133-157,296` |
| 17 | `errorRoute.ts` реализует §2 целиком + unit-тест на каждую строку | pass (таблица) / не выполнено (тест) | `errorRoute.ts:48-82`. Тестов нет — не засчитывается разработчику, см. Open Question 1 |
| 18 | `parse_failed` → `retryParse`; `parse_slow` → тот же `jobId` | **fail** | `uploadFlow.store.ts:299-318` — B2. `checkAgain` (`:321-328`) — pass |
| 19 | `material_rejected`/`pdf_too_long`/`lost` → `selecting` с выбором; `limits` → баннер без `ErrorState` | pass | `uploadFlow.store.ts:271-281,345-360`; `upload.tsx:266-285,318-327` |
| 20 | `send_failed`: тот же `material_id` (кроме `file_missing`), вторичное → `selecting` | pass | `errorRoute.ts:79-82`; `uploadFlow.store.ts:225,330-343`; `upload.tsx:306-317` |
| 21 | Коды не попадают в текст и `accessibilityLabel` | pass | баннер и экраны ошибок берут только ключи i18n |
| 22 | Успех: `celebrating`, выбор фразы, плюрали, навигация и сброс, без автоперехода | pass | `upload.tsx:206-256`; в отрисовке «В материале 18 слов и 2 темы грамматики.» |
| 23 | Пары `dark:`, цвета `Icon` из `useTheme`, нет hex | pass | `upload.tsx:47-48,81,142,158,221`; тёмная тема проверена в отрисовке |
| 24 | ≥ 44×44, role + label, заголовки `header`, без фиксированных высот | **fail** | `upload.tsx:229` — B3: маскот в web озвучивается как «Mascot, celebrating, stage 1» |
| 25 | typecheck/lint чисты, в handoff честно сказано, где не проверено | pass | handoff: запуск на устройстве и в браузере не делался — сказано прямо |

### Findings

- **blocker B1** · `apps/mobile/features/upload/uploadFlow.store.ts:232` и `:254` · нарушен Acceptance #14 (Layout, таблица ожидания: «номер загружаемого файла») ·
  ожидалось: пока грузится первый файл — «Файл 1 из 2», пока второй — «Файл 2 из 2» / получено: `current` стартует с `0` и растёт только **после** загрузки файла,
  поэтому весь первый файл экран показывает «Файл 0 из 2. Не закрывайте приложение…» (видно на скриншоте `04-sending-light.png`).
  Номер должен выставляться до `uploadFile` для этой позиции.

- **blocker B2** · `apps/mobile/features/upload/uploadFlow.store.ts:299-318` · нарушен Acceptance #18 и строка `parse_failed` в §2 («→ `retryParse(moduleId)` → `reading` с новым `jobId`») ·
  ожидалось: одно нажатие «Попробовать ещё раз» = один перезапуск разбора, повторное нажатие ничего не меняет /
  получено: пока идёт `module-parse`, store остаётся в `failed` и кнопка остаётся активной без отклика. Второе нажатие проходит проверку на строке 301 и шлёт второй `module-parse`.
  Модуль к этому моменту уже в `parsing`, сервер отвечает `module_not_retryable`, catch на строке 317 переводит поток в `lost` («Не получилось закончить разбор… Выбрать файлы заново»),
  а первый, здоровый разбор отбрасывается проверкой `jobId` на строке 143. На медленной сети двойное нажатие — обычное дело.
  Поток должен выйти из `failed` синхронно, до сетевого вызова (или повтор должен быть закрыт флагом «уже в работе»). Ошибка самого вызова по-прежнему идёт по строкам `retry` из §2.

- **blocker B3** · `apps/mobile/app/(tabs)/upload.tsx:229` · нарушены Composition п. 6 («маскот не озвучивается английским текстом») и Acceptance #24 ·
  ожидалось: маскот на экране успеха скрыт от ассистивных технологий на iOS, Android **и Web** /
  получено: `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` react-native-web 0.21 не учитывает.
  В отрисованном DOM у обёртки нет `aria-hidden`, маскот виден как `role=img`, `aria-label="Mascot, celebrating, stage 1"`.
  Обёртка — законный путь, спека его разрешает, но она должна скрывать маскот на всех трёх платформах (например, `aria-hidden`: RN переводит его в нативные свойства, RNW отдаёт как есть).
  **Тот же дефект в примитивах:** `apps/mobile/shared/ui/LoadingState.tsx:81` и `apps/mobile/shared/ui/ErrorState.tsx:49`. На экране ожидания в web внутри live region `role=alert` лежит `role=img` «Mascot, thinking, stage 1».
  Это правка `design-system-agent` (P2, п. 6), не `frontend-builder`. Пакет закрывается, только когда исправлены все три места.

- **minor m1** · `uploadFlow.store.ts:103` · §2, строка `limits` · при серверном `unsupported_type` баннер собирается с `name: ""` и выглядит как «» не подойдёт…». Путь на практике недостижим: клиент проверяет те же типы раньше. В этом раунде принимается как есть; правильную фразу даст спека v2 (Open Question 2).
- **minor m2** · `uploadFlow.store.ts:86-97` · §2, строка `limits` · при серверном `file_too_large` эвристика «самый большой файл» может назвать не тот файл. Пример: PDF на 9 МБ в пределах лимита, а слишком большой — DOCX на 6 МБ. Путь тоже недостижим; решение — там же, Open Question 2.
- **minor m3** · `selection.ts:211-221` · §3 · если у документа нет `size`, клиент сначала честно дочитывает байты (хорошо). Только если и это не удалось, показывается `upload.error.unsupported` — для PDF это неправда («нужны фото, PDF или DOCX»). Путь редкий, отдельной строки в §Copy нет, поэтому это пробел спеки, а не дефект реализации (Open Question 2).
- **minor m4** · `upload.tsx:52` · Layout, строка файла · `ellipsizeMode="middle"` передан верно, но react-native-web поддерживает только обрезку в конце. В web длинное имя кончается на «…», и расширение `.pdf` пропадает (`03-selected-light.png`). Ограничение платформы, а не реализации (Open Question 3).
- **minor m5** · `selection.ts:160,219,225` · если пикер не отдал `name`, в баннер и в `filename` уходит `asset.uri`. В web это `blob:`-адрес на весь баннер.
- **minor m6** · `selection.ts:148,197,234` · сумма считается по снимку списка на момент выбора. Если добавить файлы вторым пикером, пока первое фото ещё сжимается (плитки при этом активны — так и должно быть), размер сжимаемого фото считается как 0. Превышение 30 МБ поймает сервер (`total_too_large` → тот же баннер), но уже после загрузки.
- **minor m7** · `shared/repositories/mock/module.repository.mock.ts:27-47` · §1, по образцу `userRepository` · mock не прогоняет свои данные через схемы `@yuny/shared`, хотя интерфейс (`module.repository.ts:24-25`) это обещает.

### По пунктам, которые разработчик отметил сам

1. **Нет unit-тестов на `errorRoute.ts`.** Не засчитывается разработчику. TZ.md §2 фиксирует Jest + RNTL, но в репозитории нет ни раннера, ни конфига, а спека v1 не вынесла его установку в предусловия. Это промах gate A, а не исполнения. Таблицу я проверил сам: 26 пар, расхождений 0. Решение по раннеру — Open Question 1.
2. **Эвристика баннера `limits` при `file_too_large`/`unsupported_type`.** Принято на этот раунд как minor (m1, m2): путь недостижим, пока типы и лимиты клиента и сервера совпадают. Спека требует «ту же фразу», а сервер не называет файл, поэтому точную фразу не собрать — это пробел спеки (Open Question 2). Пустые кавычки «» в m1 — худший из вариантов, но только на мёртвом пути.
3. **`Mascot` с английским `accessibilityLabel`, обёртка на экране успеха.** Подход верный (спека разрешает обёртку), исполнение не работает в web — blocker B3. Та же проблема в `LoadingState`/`ErrorState`, их чинит `design-system-agent`.
4. **Документ без `size` → `upload.error.unsupported`.** Принято как minor m3. Текст для PDF ложный, но путь редкий и отдельной строки в §Copy нет. Пробел спеки.

### Open Questions

1. **Раннер тестов (пользователю / `qa-agent`).** Jest (TZ.md §2) в репозитории не настроен. Предлагаю: `qa-agent` ставит Jest в `apps/mobile`, после чего тест на `errorRoute.ts` добавляется отдельной задачей. До тех пор пункт тестов в Acceptance #17 не блокирует приёмку этого пакета. Если нужно, чтобы тест вошёл именно в этот пакет, — это решение пользователя, и тогда установка раннера становится предусловием спеки v2.
2. **Серверные `limits` без имени файла и нечитаемый документ (спека v2, копирайт).** Предлагаю для серверных `file_too_large` и `unsupported_type` показывать уже существующую строку `upload.limits` — она верна без имени файла. Для документа, который не удалось прочитать, нужна новая строка: её текст я сам не придумываю, он за пользователем. Правка войдёт в v2 вместе с ответом, в текущем раунде цель не меняется.
3. **`ellipsizeMode="middle"` в web.** В web расширение файла не видно. Варианты: принять (на iOS/Android работает) или в v2 показывать тип только в мета-строке — он там уже есть («PDF · 391 КБ»), так что информация не теряется. Склоняюсь принять как есть.
4. **Open Question 3 спеки (дубль модуля) закрыт на сервере:** `supabase/functions/module-create/index.ts:58-80` отдаёт уже созданный модуль по тому же `material_id`, поэтому повтор после потерянного ответа второй модуль не создаёт.
5. **Замечено в отрисовке, вне этого дифа (для `design-system-agent`):** в тёмной теме у `Button variant="primary"` тёмный текст на фиолетовом градиенте — и в активном, и в `disabled` состоянии (`01-empty-dark.png`, `03-selected-dark.png`). Контраст стоит проверить. Таб-бар при первой загрузке сразу в тёмной теме остался светлым (`01-empty-dark.png`).

**Verdict:** REVISION_REQUIRED — раунд 1 из 2. `frontend-builder` исправляет B1, B2 и `upload.tsx:229` из B3. `design-system-agent` — `LoadingState.tsx:81` и `ErrorState.tsx:49` из B3. Больше ничего не трогать.

## Round 2 · 2026-09-18 · APPROVED

**Reviewed:** рабочее дерево, не закоммичено. Изменения раунда: `apps/mobile/features/upload/uploadFlow.store.ts`
(`limitsBanner` :81-92, `submit` :208-290, `retryParse` :292-314, `checkAgain`/`retrySend` :316-338);
`features/upload/selection.ts` (:211-221); `features/upload/{errorRoute,selection}.test.ts`; `apps/mobile/jest.config.js`;
`shared/ui/{Mascot,LoadingState,ErrorState,EmptyState}.tsx`; `app/(tabs)/upload.tsx:220-229`;
`app/(auth)/{sign-in,check-email}.tsx`, `app/(onboarding)/welcome.tsx` (только проп `decorative`);
`shared/i18n/ru.ts:56`; `shared/repositories/mock/module.repository.mock.ts`.

**Depth:** проверка кода + отрисовка в web: заново собрал `expo export --platform web` с `EXPO_PUBLIC_DATA_SOURCE=mock`,
headless Chromium 390×844, светлая и тёмная тема. Прошёл весь поток: пустой выбор → PDF + фото → `sending` → `reading` → `success` → «Загрузить ещё».
На каждом шаге снимал DOM-дерево доступности. Скриншоты: `…/scratchpad/r2/shots/*.png` (временная папка сессии).
**Не видел:** состояния `failed` (mock не отдаёт ошибок), двойное нажатие в `failed`, камеру, галерею, iOS и Android.

**Checks:** `pnpm typecheck --force` pass · `pnpm lint --force` pass · `pnpm test` 41/41 pass (прогнал рецензент, кэш turbo отключён).

### Blockers раунда 1

| # | Результат | Адрес / доказательство |
| --- | --- | --- |
| B1 | pass | `uploadFlow.store.ts:236` — `set({ current: position })` до `uploadFile`. В отрисовке первый файл идёт как «Файл 1 из 2. Не закрывайте приложение…» (`04-sending-light.png`). |
| B2 | pass (код) | `retryParse` :305: переход `failed → reading` синхронный, до `await`. Второе нажатие упирается в проверку `phase !== "failed"` на :294. `jobId: null` на время вызова безопасен: `runAwaitParse` сверяет `jobId` только после `set({ jobId })` на :309. `checkAgain` :321 уходит синхронно — подтверждаю. `retrySend` синхронно ставит `selecting`, а `submit` ставит `sending` до первого `await` — тоже подтверждаю. Поведение в отрисовке не проверял. |
| B3 | pass | `Mascot.tsx:279-281`: `decorative` → `aria-hidden`. На iOS/Android RN 0.86 переводит его сам (`react-native/Libraries/Components/View/View.js:41`). Английской подписи по умолчанию больше нет. `LoadingState.tsx:81`, `ErrorState.tsx:49`, `upload.tsx:229` используют `decorative`. В отрисованном DOM на `sending`, `reading` и `success` нет ни одного `role=img`, у обёрток маскота `aria-hidden="true"`. `ErrorState` в web не видел, по коду тот же путь. |

### Acceptance (изменившиеся пункты; остальные — как в раунде 1, дифом не затронуты)

| # | Результат | Адрес |
| --- | --- | --- |
| 14 | pass | B1 |
| 17 | pass | `errorRoute.test.ts:11-46`: 27 пар (фаза, код). Это все строки §2 плюс неизвестный код для каждой фазы. Там же `needsFreshMaterialId` |
| 18 | pass | B2 |
| 24 | pass (web) | B3; все кнопки и плитки — `button` с русскими подписями, иконки `aria-hidden` |
| 25 | pass | см. Checks |

### Findings

- **m1, m2** закрыты решением владельца: серверные `file_too_large` и `unsupported_type` показывают `upload.limits` (`uploadFlow.store.ts:81-92`). Внесено в спеку v1.1, §2.
- **m3** закрыт: новая строка `upload.error.unreadable` (`ru.ts:56`, `selection.ts:221`). Внесено в v1.1, §3 и §Copy.
- **m7** закрыт: mock прогоняет данные через `ModuleCreateResponseSchema` / `ModuleParseResultSchema` / `jobRefSchema` (`module.repository.mock.ts:37,46,54`).
- **m4** принято как есть. Обрезка в конце — ограничение react-native-web. Тип файла стоит в мета-строке, полное имя есть в `accessibilityLabel`. v1.1 запрещает писать обходной код.
- **m5** → спека v1.1, доделка разработчика (Acceptance 26): вместо `uri` — новая строка `upload.file.unnamed` «Файл без названия». Адрес дефекта прежний: `selection.ts:160,221,227`.
- **m6** → спека v1.1, доделка разработчика (Acceptance 27–28). Плитки не блокировать: сумму проверять по текущему списку store в момент, когда размер известен, а не по снимку. Не поместившееся фото убирается после сжатия. Противоречия со спекой нет: активные плитки остаются, меняется только момент проверки. Адрес: `selection.ts:197,236`.
- m5 и m6 — minor на редких путях, приёмку не блокируют. Доделка идёт отдельной короткой задачей по v1.1, её проверю по пунктам 26–28 без нового раунда по этому пакету.

### Open Questions

1. **Вне пакета (для `design-system-agent`).** Вопрос 5 раунда 1 ещё открыт: в тёмной теме у `Button variant="primary"` тёмный текст на фиолетовом («На главную», `06-success-dark.png`).
2. **Вне пакета.** На `sign-in.tsx` остался английский текст («Welcome back.»). Правка раунда коснулась только маскота. Это задача перевода auth, не этой спеки.
3. **Вне пакета, `Mascot`.** `accessibilityLabel` необязателен в типах. Недекоративный маскот без подписи получит `role=image` без имени. Сейчас таких вызовов нет: все 7 передают `decorative`. Надёжнее сделать дискриминированный union.

**Verdict:** APPROVED — раунд 2 из 2, по спеке v1. Доделка m5/m6 — по v1.1, Acceptance 26–28.
