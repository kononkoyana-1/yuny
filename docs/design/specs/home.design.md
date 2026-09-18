# Design Spec — home · v2 · 2026-09-18

> **v2 (2026-09-18, после gate B раунд 1 → `SPEC_DEFECT`, см. `docs/design/reviews/home.review.md`).** Три исправления, всё остальное без изменений:
> 1. **Дорожка кольца.** В v1 дорожка — `primarySoft`. В светлой теме это `1.02:1` к `background`: кольцо модуля с прогрессом 0 не видно, а у остальных видна только дуга без круга, от которого её отсчитывать. Теперь нужен новый цветовой токен `ringTrack` / `ring-track-dark` (§Composition, п. 1 и п. 4; Theming; Acceptance #9, #21, #23).
> 2. **Ширина названия под кружком.** В v1 было «не больше ячейки», и это разрешало сузить название до диаметра кольца, из-за чего слова ломаются посередине («Приветств / ия»). Теперь ширина равна ширине ячейки (§3; Acceptance #12).
> 3. **Acceptance #11.** В v1 требовался тест `coverText()` на случай «`cover_text` не `null`», но в эту ветку функция не вызывается. Пункт переписан (Acceptance #11).
>
> Дефект `Sheet` (оформление окна не доходит до отрисовки) — ошибка не спеки, а примитива. Требование к нему не меняется (Acceptance #22).

**Task:** Экран 01 «Главная», фаза 4. Модули показаны кружками с кольцом прогресса (#23), по тапу открывается окно модуля (#24), есть пустое состояние (#25).
**Screen:** TZ.md §11 «01. Главная», вкладка `apps/mobile/app/(tabs)/index.tsx`
**Feasibility:** READY_TO_BUILD. Сначала выполняются предусловия P1–P2 (§0). P1 делает сервер, P2 делает `design-system-agent`. Обе задачи — до начала сборки экрана.
**Materials used:** TZ.md §3, §5, §10, §11 (01 + «Универсальные правила экрана»), §13, §15, §17, §18 (фаза 4), §19; `packages/shared/schemas/module.ts` (`ModuleProgressSchema`); `supabase/migrations/20260918160358_module_progress.sql`; `supabase/migrations/20260918131255_modules.sql` (`module_vocabulary.position`); `apps/mobile/shared/ui/*`; `apps/mobile/shared/config/tokens.ts`; `apps/mobile/shared/api/*`; `apps/mobile/shared/repositories/*`; `apps/mobile/features/upload/uploadFlow.store.ts`; `apps/mobile/app/(tabs)/{index,_layout,upload}.tsx`; `docs/design/specs/upload.design.md` v1.1 и его ревью (решения по i18n, Jest, репозиториям, `Mascot decorative`, `ErrorState`/`IconButton`); `assets/image/design.png` (карточки на `surface`, пилюля primary, лавандовый фон; кружков в референсе нет — ритм сетки задаётся здесь).

> Разделы TZ нумеруются по редакции 2026-09-17: универсальные правила экрана — в §11, дизайн-система — §15, DoD — §17.

---

## 0. Предусловия

| # | Что | Кто | Почему |
| --- | --- | --- | --- |
| P1 | Добавить в представление `public.module_progress` поле **`cover_text text null`**, а в `ModuleProgressSchema` — поле `cover_text: z.string().nullable()`. Как считать: берётся строка `module_vocabulary` этого модуля с наименьшим `position`, у которой `char_length(word) <= 2`; значение поля — её `word`. Если таких строк нет, берётся `left(word, 1)` строки с наименьшим `position`. Если у модуля нет слов, поле равно `null`. | Сервер (владелец бэкенда) | Кружки должны различаться, но у разбора нет картинки (TZ.md §7). Выдумывать её нельзя. Что показать на Главной, решает код (TZ.md §3, правило 3), поэтому слово выбирает сервер, клиент его только выводит. Больше двух иероглифов в кружок не помещается, поэтому ограничение `<= 2` задано в SQL, а не на клиенте. |
| P2 | Новые примитивы и токены из §Composition → «New primitives needed». | `design-system-agent`, до экрана | Кольца прогресса и модального окна в `shared/ui` нет. Размера кружка и цвета затемнения нет в токенах. |
| P3 | Маршрут `app/module/[id].tsx` появляется в этой задаче (§4). После создания файла типы маршрутов перегенерировать через `expo start`, а не `expo export`, иначе `tsc` сообщит о несуществующих ошибках маршрутов. | `frontend-builder` | Без маршрута кнопке в окне некуда вести. |

---

## 1. Данные и обновление

**Репозиторий.** В `ModuleRepository` (`apps/mobile/shared/repositories/module.repository.ts`) добавляется метод `listModules(): Promise<ModuleProgress[]>`.
- Supabase: `from("module_progress").select("module_id,title,topic,created_at,generation,total_tasks,done_tasks,cover_text").order("created_at", { ascending: false })`, затем `z.array(ModuleProgressSchema).parse`.
- Mock: фикстуры проходят через ту же схему, как это уже сделано для загрузки. Фикстуры: (а) модуль с `0 / 8`; (б) модуль в процессе, `3 / 8`; (в) пройденный модуль, `8 / 8`; (г) модуль с длинным названием из 60+ символов и `topic: null`; (д) модуль с `cover_text: null`. Ещё нужен режим пустого списка: переключатель в `mock/fixtures.ts` по образцу существующих.

**Хук.** `apps/mobile/shared/api/useModules.ts`: `useQuery({ queryKey: queryKeys.modules, queryFn: () => moduleRepository.listModules() })`. В `queryKeys.ts` добавляется ключ `modules: ["modules"] as const`. Экран импортирует только хук.

**Порядок — сначала новые (`created_at desc`), и никакой другой сортировки.** Новый модуль появляется первым, в левом верхнем углу: это и есть ответ на вопрос «появился ли мой модуль». Пройденный модуль остаётся на своём месте (проверка фазы 4, TZ.md §18). Сортировки или группировки по прогрессу нет: пройденный модуль ничем не отличается от нового, кроме прогресса (TZ.md §10).

**Как Главная узнаёт о новом модуле.** Работают два механизма, нужны оба:
1. **Инвалидация из потока загрузки.** В `uploadFlow.store.ts`, в том же месте, где store переходит в `phase: "success"`, вызывается `queryClient.invalidateQueries({ queryKey: queryKeys.modules })`. Это делается в момент успеха, а не по кнопке «На главную»: пользователь может вернуться на Главную через таб-бар, и модуль всё равно должен там быть. `queryClient` — singleton из `shared/api/queryClient.ts`, store импортирует его напрямую.
2. **Перезапрос при фокусе вкладки.** `useFocusEffect` из `expo-router` вызывает `refetch({ cancelRefetch: false })`: запрос, который уже идёт, не перезапускается. Этот механизм покрывает случаи, которые инвалидация не ловит. Первый: приложение закрыли во время разбора, а модуль дособрался на сервере (upload spec, Out of scope). Второй: прогресс изменился на другом устройстве. Третий, в фазе 5: человек возвращается на Главную из урока.

Фоновый перезапрос не показывает загрузку: на экране остаются прежние данные.

**Прогресс клиент не считает.** `done_tasks` и `total_tasks` выводятся как есть. Единственная арифметика на клиенте — доля заполнения кольца: `total > 0 ? min(done / total, 1) : 0`. Она живёт внутри `ProgressRing` и никуда больше не уходит: ни в текст, ни в условия, ни в выбор подписи. Клиент не решает, пройден ли модуль. Поэтому подпись кнопки и вид кружка не зависят от `done === total`.

---

## 2. Frame (TZ.md §11, универсальные правила)

| Состояние | Primary Action | Secondary Action | Context | Exit |
| --- | --- | --- | --- | --- |
| Список | Тап по кружку модуля открывает окно. Кнопки `Button primary` на экране нет. | нет | Заголовок `home.title`, кружки с названиями | Таб-бар |
| Окно модуля | «К заданиям» (`Button primary`) → `/module/{module_id}` | нет. Закрыть окно можно через `IconButton close`, тап по затемнению, «назад» на Android или Escape в web. Это выход, а не второе действие. | Название, тема (если есть), «3 / 8» и «пройдено заданий» | Закрыть окно |
| Пустое | «Загрузить материал» (`EmptyState` action) → вкладка Загрузка | нет | Маскот и одна фраза-призыв | Таб-бар |
| Загрузка | нет | нет | `home.loading` | Таб-бар |
| Ошибка | «Попробовать ещё раз» (`ErrorState` retry) | нет | Человеческая причина | Таб-бар |

Кнопки «Загрузить материал» при непустом списке **нет**: загрузка находится в таб-баре. Вторая кнопка рядом с кружками стала бы вторым primary action и спорила бы с модулями.

---

## 3. Layout

### Список

Контейнер: `flex-1 bg-background dark:bg-background-dark`, safe-area сверху. Контент — `FlatList`, а не `ScrollView` с `map`: модули не удаляются (TZ.md §10), поэтому список со временем только растёт.

- `contentContainerClassName` (или `contentContainerStyle` из токенов `spacing`): отступы `px-lg pt-xl pb-xl`.
- **`ListHeaderComponent`:** `Text variant="title"` — `home.title`, `accessibilityRole="header"`. Под ним отступ `mb-lg`.
- **Сетка.** `numColumns = max(3, floor(ширина_списка / sizing.moduleCell))`. Ширина берётся из `onLayout` контейнера списка, а не из окна: на широком экране часть ширины занимает сайдбар таб-бара. Чтобы смена числа колонок пересобирала список, у `FlatList` стоит `key={numColumns}`. Строки — `columnWrapperClassName="gap-md"` (для `numColumns = 1` это не нужно, минимум здесь 3). Между строками — `gap-lg` (через `ItemSeparatorComponent` высотой `lg` или `rowGap`).
- **Ячейка:** `flex-1 items-center`. Внутри — `ModuleCircle` (§Composition, п. 3). Если в последней строке кружков меньше, чем колонок, строка дополняется пустыми ячейками-распорками той же ширины (`flex-1`, `accessible={false}`). Иначе `flex-1` растянет два последних кружка на всю строку, и они уедут из сетки.

### Кружок модуля (`ModuleCircle`)

Сверху вниз, `items-center gap-sm`:

1. **`ProgressRing`** диаметром `sizing.moduleCircle`. Внутри кольца — диск с отступом `sizing.progressRingGap` от внутреннего края кольца:
   - диск: `rounded-pill bg-surface dark:bg-surface-dark`. В светлой теме у него тень, как у `Card`, в тёмной — рамка `border-dark`;
   - текст внутри диска — `cover_text`. Если `cover_text === null`, выводится первая графема `title` после `trim()` (`Array.from(title.trim())[0]`). Кириллица и латиница переводятся в верхний регистр через `toLocaleUpperCase("ru")`. Функция живёт в `features/home/coverText.ts` и покрыта тестами. Текст: `Text variant="title"`, `tone` по умолчанию (`text`), `numberOfLines={1}`, `adjustsFontSizeToFit` запрещён: размер задаёт токен. Отдельный размер для CJK — задача фазы 7 (TZ.md §15, китайская типографика). Сейчас используется `title`;
   - кольцо: дорожка `ringTrack` (v2, было `primarySoft`), заполнение `primary`, толщина `sizing.progressRingStroke`, закруглённые концы, старт в 12 часов, рост по часовой стрелке. У пройденного модуля кольцо просто полное. Цвет `success`, галочек, бейджей и отличий в оттенке нет (TZ.md §10).
2. **Название** — `Text variant="caption" className="text-center"`, `numberOfLines={2}`. **Ширина равна ширине ячейки** (v2), а не диаметру кольца: `Pressable` растягивается на ячейку (`self-stretch`), кольцо внутри стоит по центру. Иначе слова длиннее диаметра кольца переносятся посреди слова. Полное название есть в окне и в `accessibilityLabel`.

Числа прогресса в кружке **нет** (TZ.md §11: «числом — только внутри окна»).

**Нажатие:** весь кружок вместе с названием — одна `Pressable`. В состоянии pressed диск получает `bg-surface-alt dark:bg-surface-alt-dark`. Фокус в web оставляется стандартным: outline не отключать.

### Окно модуля (`Sheet`)

На узком экране окно прижато к низу и занимает всю ширину. На широком (≥ `breakpoints.wide`) оно стоит по центру, ширина не больше `sizing.sheetMaxWidth`. Поведение задаёт примитив, см. §Composition, п. 2. Содержимое, `gap-lg`:

1. **Шапка**, `flex-row items-start gap-md`:
   - слева `flex-1 gap-xs`: `Text variant="heading"` — `title` без обрезки, `accessibilityRole="header"`. Если `topic !== null` — под ним `Text variant="caption" tone="muted"` — `topic`;
   - справа `IconButton icon="close"` с `accessibilityLabel` = `home.sheet.close`.
2. **Прогресс**, `items-start gap-xs`, одна группа для ассистивных технологий (`accessible`, label `home.sheet.progressA11y`):
   - `Text variant="display"` — `home.sheet.progress` («3 / 8»). Цифры выводятся через `Intl.NumberFormat("ru")`, как в загрузке;
   - `Text variant="caption" tone="muted"` — `home.sheet.progressCaption`.
3. **Кнопка** `Button variant="primary"` во всю ширину — `home.sheet.open`. По нажатию окно закрывается, затем выполняется `router.push({ pathname: "/module/[id]", params: { id: module_id } })`.

Маскота в окне нет: окно — место решения, а не оформления (TZ.md §11, маскот не спорит с primary action).

Окно открывается по `module_id` из состояния экрана (`useState<string | null>`), а данные берутся из текущего результата `useModules`. Если во время открытого окна прошёл фоновый перезапрос, числа в окне обновятся сами.

---

## 4. Временный маршрут `/module/[id]` — заглушка до фазы 5

**Временное решение, и оно записано здесь явно.** Экран урока и выбора урока появится в фазе 5 (TZ.md §18). Сейчас кнопка «К заданиям» ведёт на заглушку по тому адресу, который фаза 5 займёт выбором урока (TZ.md §10: «Пройти заново — открывает выбор урока»). Фаза 5 заменит **только файл** `apps/mobile/app/module/[id].tsx`, а код Главной не тронет.

- Файл: `apps/mobile/app/module/[id].tsx`, вне `(tabs)`. Так же устроен урок: полноэкранный поток без таб-бара (комментарий в `(tabs)/_layout.tsx`). Первая строка файла — комментарий `// TEMPORARY (phase 4): заглушка до экрана выбора урока, фаза 5 заменяет файл целиком. docs/design/specs/home.design.md §4`.
- Заглушка **не делает сетевых запросов** и параметр `id` не читает.
- Экран: `bg-background dark:bg-background-dark`, safe-area. По центру `EmptyState` с `message` = `module.stub.title`, `actionLabel` = `module.stub.back`, `onAction` = `router.back()`. Если истории нет (прямой заход по ссылке в web), выполняется `router.replace("/")`. Маскот показывается (в `EmptyState` он уже `decorative`). Под `EmptyState` описания нет: у примитива нет пропа `detail`, а расширять его ради временного экрана не нужно. Поэтому `module.stub.title` сформулирован так, чтобы хватило одной фразы.
- Frame заглушки: Primary — «На главную». Loading, empty и error отсутствуют, потому что экран ничего не загружает.

---

## Composition

| Элемент | Примитив / компонент | Токены | Примечание |
| --- | --- | --- | --- |
| Фон | `View` | `background` / `background-dark` | |
| Заголовок | `Text variant="title"` | `text` | `header` |
| Сетка | `FlatList` | отступы `lg`, `xl`, `md` | §3 |
| Кружок | **`ModuleCircle`** (feature, `apps/mobile/features/home/ModuleCircle.tsx`) | см. §3 | строится из `ProgressRing` и `Text`, делает `frontend-builder` |
| Кольцо | **`ProgressRing` (новый, shared/ui)** | `ringTrack` (v2), `primary` | |
| Окно | **`Sheet` (новый, shared/ui)** | `surface`, `scrim`, радиус `xl` | |
| Закрыть окно | `IconButton icon="close"` | существует | |
| К заданиям | `Button variant="primary"` | существует | |
| Пустое состояние | `EmptyState` | существует | маскот `decorative` уже внутри |
| Загрузка | `LoadingState` | существует | |
| Ошибка | `ErrorState` (`title`/`detail`/`retryLabel`) | существует | |
| Заглушка модуля | `EmptyState` | существует | §4 |

**New primitives needed → `design-system-agent`, до сборки экрана:**

1. **`ProgressRing`** (`apps/mobile/shared/ui/ProgressRing.tsx`), SVG на `react-native-svg`.
   - Props: `value: number`, `max: number`, `size: number` (из `sizing`), `strokeWidth?: number` (по умолчанию `sizing.progressRingStroke`), `children?: ReactNode` (центр кольца), `decorative?: boolean`, `accessibilityLabel?: string` (обязателен, если `decorative` не задан; сделать это дискриминированным union, по уроку `Mascot`).
   - Доля: `max > 0 ? clamp(value / max, 0, 1) : 0`.
   - Цвета берутся из `useTheme().colors`: дорожка `ringTrack` (v2), дуга `primary`. `strokeLinecap="round"`, старт в 12 часов, рост по часовой стрелке. При доле 0 дуга не рисуется совсем, круглой точки нулевой длины быть не должно.
   - Анимация: изменение доли анимируется Reanimated, так же как у `ProgressBar`. При `useReducedMotion()` значение ставится сразу.
   - A11y без `decorative`: `accessibilityRole="progressbar"`, `accessibilityLabel`, `accessibilityValue={{ min: 0, max, now: value, text: <строка вызывающего, например «3 из 8»> }}`. С `decorative` кольцо и его SVG скрыты: `accessible={false}`, `importantForAccessibility="no-hide-descendants"`, `aria-hidden` в web. Кольцо внутри `ModuleCircle` декоративно, число произносит сама кнопка (см. Accessibility): в web `progressbar` внутри `button` нарушает дерево ролей.
   - Web: SVG рендерится через `react-native-svg` web, `Platform.OS` в компоненте не используется (TZ.md §17).
2. **`Sheet`** (`apps/mobile/shared/ui/Sheet.tsx`), модальное окно на `Modal` из `react-native` (react-native-web его поддерживает). Новой зависимости нет.
   - Props: `visible: boolean`, `onClose(): void`, `accessibilityLabel: string` (имя диалога, передаётся `title` модуля), `children`, `returnFocusRef?: RefObject<View>`.
   - Узкий экран: панель прижата к низу, `rounded-t-xl`, `bg-surface dark:bg-surface-dark`, в тёмной теме рамка сверху `border-dark`, отступы `px-lg pt-lg`, снизу `pb-lg` плюс safe-area. Широкий экран (≥ `breakpoints.wide`): по центру, `rounded-xl`, ширина не больше `sizing.sheetMaxWidth`.
   - Затемнение: на весь экран, цвет `scrim` / `scrim-dark` (новые токены, п. 4). Тап по затемнению вызывает `onClose`. Само затемнение не озвучивается: `accessible={false}`, это не кнопка, закрыть окно можно `IconButton` внутри.
   - `onRequestClose` → `onClose` (кнопка «назад» на Android, Escape в web).
   - A11y: у панели `accessibilityViewIsModal` (iOS), в web `role="dialog"`, `aria-modal="true"` и `aria-label`. При открытии фокус ассистивных технологий переходит в окно, при закрытии возвращается на `returnFocusRef`: на native через `AccessibilityInfo.setAccessibilityFocus`, в web через `.focus()` элемента. Платформенные ветки живут в `shared/platform/`.
   - Анимация: панель выезжает снизу, окно по центру проявляется, затемнение проявляется. При `useReducedMotion()` анимаций нет: окно просто появляется.
   - Контент длиннее экрана (большой Dynamic Type) прокручивается внутри панели. Высота панели ограничена экраном за вычетом safe-area.
3. **`ModuleCircle` — не примитив.** Он собирается в `features/home/` силами `frontend-builder` только из `ProgressRing`, `Text` и токенов по §3. В `shared/ui` его не выносить: это доменный компонент одного экрана.
4. **Токены** (`tokens.ts` и `tailwind.config.js`, синхронно):
   - `sizing.moduleCircle` — внешний диаметр кольца. Условие: при ширине экрана 320 pt и отступах `lg` по бокам три колонки помещаются так, что между кружками остаётся не меньше `sm`. Предлагаю 80.
   - `sizing.moduleCell` — минимальная ширина ячейки, по ней считается число колонок на широком экране. Предлагаю 112.
   - `sizing.progressRingStroke` — предлагаю 4. `sizing.progressRingGap` — зазор между кольцом и диском, предлагаю 4.
   - `sizing.sheetMaxWidth` — ширина окна по центру, предлагаю 480.
   - `breakpoints.wide` = 768. Это значение уже зашито литералом в `(tabs)/_layout.tsx`. Токен нужен, чтобы Главная и `Sheet` не завели второй литерал; перевести на него `_layout.tsx` — на усмотрение `design-system-agent`.
   - Цвет `scrim` / `scrim-dark`: полупрозрачный, 8-значный hex, как в `atmosphere`. На его фоне панель `surface` должна отделяться без тени. Значения выбирает `design-system-agent`.
   - **v2.** Цвет `ringTrack` / `ring-track-dark`: дорожка кольца. Условие: контраст к `background` в каждой теме не ниже `1.25:1`. Это значение пары dark `primarySoft` на `background-dark`, и в отрисовке раунда 1 кольцо с этим контрастом читается как кольцо. У светлой `primarySoft` контраст `1.02:1`, поэтому она не подходит. Дорожка остаётся тише дуги `primary` и не спорит с ней. Значения выбирает `design-system-agent`.
   Окончательные значения за `design-system-agent`. Спека требует только имена и условия для `moduleCircle` и `ringTrack`.

---

## States

- **Loading** (первая загрузка, `isPending`, данных нет): `LoadingState className="flex-1" message={t("home.loading")}`. Маскот `thinking` уже внутри примитива. Скелетонов нет: список короткий, а скелетон кружков обещал бы число модулей, которого клиент не знает.
- **Empty** (`data.length === 0`): `EmptyState className="flex-1"`, `message` = `home.empty.message`, `actionLabel` = `home.empty.action`, `onAction` = `router.navigate("/upload")`. Нужен именно `navigate`, а не `push` (в текущем коде стоит `push`): переход на вкладку не должен класть второй экземпляр вкладки в стек. Маскот показывается, `mood="neutral"`, как в примитиве. Заголовок `home.title` в пустом состоянии не выводится: одна фраза-призыв (TZ.md §11), без лишнего текста.
- **Error** (`isError` и данных нет): `ErrorState className="flex-1"`, `title` = `home.error.title`, `detail` = `home.error.detail`, `onRetry` = `refetch()`, `retryLabel` = `home.error.retry`. Без `continueLabel`. Если фоновый перезапрос упал, а данные уже есть, на экране остаются данные и ошибка не показывается. `BackendError.code` не попадает ни в текст, ни в `accessibilityLabel`.

---

## Theming

Все цвета задаются парами `x` / `dark:x-dark`. Цвета SVG берутся из `useTheme().colors`. Что меняется в тёмной теме:
- фон `background` → `background-dark`;
- диск кружка: тень в светлой теме → рамка `border-dark` на `surface-dark` в тёмной (как у `Card`); pressed `surface-alt` → `surface-alt-dark`;
- кольцо: дорожка `ringTrack` → `ring-track-dark` (v2), дуга `primary` → dark `primary` (светлее, читается на тёмном фоне);
- текст внутри диска и название: `text` → `text-dark`;
- окно: `surface` → `surface-dark` с верхней рамкой `border-dark`; затемнение `scrim` → `scrim-dark`;
- `Button primary` в тёмной теме уже исправлен (`7252756`), здесь ничего не меняется.

---

## Accessibility

| Элемент | Role | Label / State / Value |
| --- | --- | --- |
| `home.title` | `header` | текст |
| `ModuleCircle` | `button` | `home.module.a11y` («{{title}}. Пройдено 3 из 8 заданий», плюрализация по `total`), `accessibilityHint` = `home.module.a11yHint`. Кольцо и текст внутри скрыты (`decorative`) и второй раз не озвучиваются. Здесь число произносится намеренно: правило «числом — только в окне» касается того, что видно глазами, а незрячему человеку кольцо ничего не показывает. |
| Ячейки-распорки | — | `accessible={false}` |
| `Sheet` | `dialog` (web) / `accessibilityViewIsModal` | `aria-label` = `title` модуля. Фокус переходит в окно, при закрытии возвращается на кружок. |
| Название в окне | `header` | текст |
| Блок прогресса | группа | `home.sheet.progressA11y` («Пройдено 3 из 8 заданий»). «3 / 8» по символам не читается. |
| Закрыть | `button` | `home.sheet.close` |
| «К заданиям» | `button` | `home.sheet.open` |
| `LoadingState`, `ErrorState` | `alert` (уже в примитивах) | |

Тап-таргеты: у `ModuleCircle` ширина не меньше `sizing.moduleCircle` (≥ 44), высота равна кольцу плюс название. У `IconButton` и `Button` размеры уже ≥ 44. Dynamic Type: высоты текстовых контейнеров не фиксируются. Название кружка ограничено двумя строками, при крупном шрифте строки сетки становятся выше, и это допустимо. Окно при крупном шрифте прокручивается. Reduced motion: у `ProgressRing` и `Sheet` см. §Composition, других анимаций на экране нет.

---

## Copy (i18n, `apps/mobile/shared/i18n/ru.ts`)

Тон: на «вы», спокойно, без кодов, как в upload (TZ.md §11, «универсальные правила»). Тексты предлагает дизайнер, владелец подтверждает (так же было в upload). Структуру экрана они не блокируют.

| Ключ | Текст |
| --- | --- |
| `home.title` | Мои модули |
| `home.loading` | Загружаем ваши модули |
| `home.empty.message` | Загрузите первый материал — по нему появятся задания |
| `home.empty.action` | Загрузить материал |
| `home.error.title` | Не получилось загрузить модули |
| `home.error.detail` | Проверьте интернет и попробуйте ещё раз. Модули и прогресс сохранены. |
| `home.error.retry` | Попробовать ещё раз |
| `home.module.a11y_one` | {{title}}. Пройдено {{done}} из {{count}} задания |
| `home.module.a11y_few` | {{title}}. Пройдено {{done}} из {{count}} заданий |
| `home.module.a11y_many` | {{title}}. Пройдено {{done}} из {{count}} заданий |
| `home.module.a11yHint` | Открывает подробности модуля |
| `home.sheet.progress` | {{done}} / {{total}} |
| `home.sheet.progressCaption` | пройдено заданий |
| `home.sheet.progressA11y_one` | Пройдено {{done}} из {{count}} задания |
| `home.sheet.progressA11y_few` | Пройдено {{done}} из {{count}} заданий |
| `home.sheet.progressA11y_many` | Пройдено {{done}} из {{count}} заданий |
| `home.sheet.open` | К заданиям |
| `home.sheet.close` | Закрыть |
| `module.stub.title` | Уроки этого модуля скоро появятся здесь. Модуль и прогресс сохранены. |
| `module.stub.back` | На главную |

`count` в плюральных ключах — это `total_tasks` (после «из» стоит родительный падеж: «из 1 задания», «из 8 заданий», «из 21 задания»).

---

## Acceptance

Всё проверяется чтением кода. Адреса: `app/(tabs)/index.tsx`, `features/home/**`, `app/module/[id].tsx`, `shared/api/{useModules,queryKeys}.ts`, `shared/repositories/**`, `features/upload/uploadFlow.store.ts`.

**Данные**
1. У `ModuleRepository` есть `listModules()`, и у него две реализации — supabase и mock. Supabase-версия читает `module_progress` с `order("created_at", { ascending: false })` и прогоняет ответ через `z.array(ModuleProgressSchema).parse`. Mock прогоняет фикстуры (а)–(д) из §1 через ту же схему и умеет отдавать пустой список.
2. `useModules` использует `queryKeys.modules`. Экран и `features/home/**` не импортируют `getSupabase`, `@supabase/*` и `moduleRepository` напрямую.
3. В `uploadFlow.store.ts` при переходе в `phase: "success"` вызывается `queryClient.invalidateQueries({ queryKey: queryKeys.modules })`. Есть Jest-тест: успех разбора → инвалидация вызвана.
4. `index.tsx` вызывает `refetch({ cancelRefetch: false })` в `useFocusEffect`.
5. В коде Главной нет ни сортировки, ни фильтрации, ни группировки модулей: порядок приходит из репозитория.
6. `done_tasks` и `total_tasks` используются только в трёх местах: для отображения (`home.sheet.progress`), в a11y-строках и как `value`/`max` у `ProgressRing`. Нет ни одного условия вида `done === total`, `done >= total`, `done / total` вне `ProgressRing`.

**Список и кружок**
7. Список — `FlatList`. `numColumns` вычисляется по ширине из `onLayout` и `sizing.moduleCell` и не бывает меньше 3. Есть `key={numColumns}`. Неполная последняя строка дополнена распорками с `accessible={false}`.
8. `ModuleCircle` — одна `Pressable` с `accessibilityRole="button"`, `accessibilityLabel` из `home.module.a11y` (плюрализация по `total_tasks`) и `accessibilityHint` из `home.module.a11yHint`. `ProgressRing` внутри неё `decorative`.
9. Диаметр кольца — `sizing.moduleCircle`. Кольцо: дорожка `ringTrack` (v2), дуга `primary`. Цвета берутся из `useTheme().colors`. Ни в кружке, ни в названии нет числа прогресса.
10. У пройденного модуля (фикстура (в)) отличие только в полном кольце: нет ни `success`, ни иконки, ни бейджа. Ни один стиль кружка не зависит от соотношения `done` и `total`.
11. Внутри диска — `cover_text`, а при `null` — результат `coverText(title)` из `features/home/coverText.ts`: первая графема `title.trim()`, в верхнем регистре `ru`. Выбор между ними — одно выражение `cover_text ?? coverText(title)` в `ModuleCircle`, без других условий. Тест `coverText.test.ts` покрывает кириллическое название, название, которое начинается с пробелов, и китайское название (v2: случая «`cover_text` не `null`» в тесте функции нет, потому что функция в эту ветку не вызывается).
12. Название под кружком: `Text variant="caption"`, `text-center`, `numberOfLines={2}`. Ширина названия равна ширине ячейки: на `ModuleCircle` нет `width: sizing.moduleCircle`, `Pressable` растянут на ячейку (v2).
13. В состоянии pressed у диска `bg-surface-alt dark:bg-surface-alt-dark`. Outline фокуса в web не отключён.

**Окно**
14. Окно — `Sheet` из `shared/ui`, с `accessibilityLabel` = `title` модуля и `returnFocusRef` на нажатый кружок.
15. Содержимое по порядку: `Text variant="heading"` (`header`) с полным `title` без `numberOfLines`; `topic`, только если он не `null`; `IconButton close` с `home.sheet.close`; группа прогресса с `Text variant="display"` `home.sheet.progress`, подписью `home.sheet.progressCaption` и `accessibilityLabel` из `home.sheet.progressA11y`; единственная `Button variant="primary"` с `home.sheet.open`.
16. «К заданиям» закрывает окно и выполняет `router.push` на `/module/[id]` с `id = module_id`. Подпись одна для любого прогресса.
17. Данные открытого окна берутся из текущего `useModules().data` по `module_id` из состояния, а не из копии, снятой при открытии.

**Заглушка**
18. `apps/mobile/app/module/[id].tsx` существует и начинается с комментария `TEMPORARY (phase 4)` со ссылкой на эту спеку §4. Экран не делает сетевых запросов. `EmptyState` в нём использует `module.stub.title`/`module.stub.back`, `router.back()` с запасным `router.replace("/")`.

**Состояния**
19. Первая загрузка — `LoadingState` с `home.loading`. Пустой список — `EmptyState` с `home.empty.*` и `router.navigate("/upload")` без заголовка `home.title`. Ошибка без данных — `ErrorState` с `home.error.*` и `onRetry={refetch}`. Ошибка при наличии данных ничего не меняет на экране.
20. Ровно один `Button variant="primary"` на каждое состояние экрана: в списке без окна их ноль, в окне один, в пустом состоянии один (внутри `EmptyState`).

**Новые примитивы (проверяются в пакете `design-system-agent`, до экрана)**
21. `ProgressRing`: пропсы по §Composition, п. 1. Дорожка — `ringTrack` (v2). Доля `max > 0 ? clamp : 0`, при доле 0 дуги нет. Reduced motion учитывается. `decorative` скрывает кольцо от ассистивных технологий на всех трёх платформах. Без `decorative` — `progressbar` с `accessibilityValue`, у которого `min`, `max`, `now` и `text`. `accessibilityLabel` обязателен на уровне типов, если `decorative` не задан.
22. `Sheet`: пропсы по §Composition, п. 2. `onRequestClose`, тап по затемнению и `IconButton` вызывают `onClose`. Затемнение `accessible={false}`. В web есть `role="dialog"`/`aria-modal`. Фокус возвращается на `returnFocusRef`. Нижняя панель на узком экране, центрированное окно на `≥ breakpoints.wide`. Reduced motion учитывается. `Platform.OS` вне `shared/platform/` не используется.
23. Токены `sizing.{moduleCircle,moduleCell,progressRingStroke,progressRingGap,sheetMaxWidth}`, `breakpoints.wide`, `scrim`/`scrim-dark`, `ringTrack`/`ring-track-dark` (v2, контраст к `background` ≥ `1.25:1` в обеих темах) есть в `tokens.ts` и `tailwind.config.js`.

**Сквозное**
24. В `ru.ts` есть все ключи из §Copy с этими текстами. В `index.tsx`, `features/home/**` и `app/module/[id].tsx` нет строк интерфейса вне `t()`. Старая литеральная строка из `index.tsx` удалена.
25. Каждый цветной класс в новых файлах имеет пару `dark:`. Нет ни одного hex-литерала и ни одного числового размера вне токенов.
26. У всех интерактивных элементов есть `accessibilityRole` и `accessibilityLabel`, все они ≥ 44×44. У текстовых контейнеров нет фиксированных высот.
27. `pnpm typecheck`, `pnpm lint`, `pnpm test` проходят чисто. В handoff перечислено, на каких платформах экран проверен (iOS / Android / Web), или честно сказано, где проверки не было (TZ.md §17). Отдельно указано, проверен ли на Web `Sheet` с клавиатуры (Tab и Escape).

---

## Out of scope

- Экран выбора урока, урок, «Пройти заново», «Сформировать новые задания» — всё это фаза 5. Сейчас есть только заглушка по §4.
- Модули в разборе и модули с упавшим разбором на Главной не показываются (решение владельца в #23). Сироты `failed` из upload spec (Open Question 2) остаются без интерфейса.
- Pull-to-refresh: свежесть обеспечивают инвалидация и перезапрос при фокусе.
- Перевод таб-бара на i18n: как и в upload, это отдельная задача.
- Размер CJK-шрифта и выбор шрифта с полным покрытием CJK (TZ.md §15) — фаза 7. Внутри диска сейчас `title` с системным fallback для CJK.
- Приветствие по имени и «следующее задание» из референса `design.png`: TZ.md §11 для Главной их не предусматривает.

## Open Questions (владельцу; сборку не блокируют)

1. **Модуль без заданий.** Если в разборе ноль слов (TZ.md §20, «меньше пяти слов»), у готового модуля `total_tasks = 0`. Экран выведет «0 / 0» и пустое кольцо, а `cover_text` окажется `null`, так что в кружке будет первая буква названия. Показывать ли такой модуль вообще — решение сервера, а не экрана.
2. **Главная во время разбора.** Если человек ушёл с экрана ожидания на Главную, пока первый модуль ещё читается, он увидит «Загрузите первый материал». Можно показать в пустом состоянии «Материал ещё читается» по фазе `uploadFlow.store`. Это вторая строка копирайта и связь между фичами, поэтому в v1 так не сделано, решение за владельцем.
3. **Тексты §Copy** предложены дизайнером, в первую очередь `home.title` «Мои модули» и `home.sheet.open` «К заданиям». Их нужно подтвердить.
