# Design Spec — settings · v1 · 2026-09-24

**Task:** GitHub #40. Экран «Настройки»: профиль (имя, почта), настройки повторений (`learning_settings`), тема оформления, «О приложении» (источники данных, версия), аккаунт (выход, удаление с подтверждением). Содержание экрана решено владельцем и оркестратором, раскладка и вид — здесь.
**Screen:** вкладка «Настройки», `apps/mobile/app/(tabs)/settings.tsx` (сейчас заглушка). Компоненты фичи — `apps/mobile/features/settings/*`.
**Feasibility:** READY_TO_BUILD при предусловиях P1–P4 (§0). Экран можно строить на mock-репозитории параллельно с P1. Раньше P2 и P3 начинать нельзя.
**Materials used:** `docs/DESIGN_LOOP.md`; `.claude/agents/ui-designer.md`; `docs/design/specs/today-session.design.md` раздел V (общий визуальный язык #65), §3.7 (окно «Повторим?»), §9 (DS1–DS13); `supabase/migrations/20260924101500_learning_lexemes.sql` (таблица `learning_settings`); `supabase/migrations/20260826175748_core_schema.sql` (`profiles`); `supabase/migrations/20260826175813_storage_and_realtime.sql` (бакеты `materials`, `recordings`); `packages/shared/schemas/learning.ts` (`LearningSettingsSchema`); `docs/learning/daily-and-folder-study.md` §2.3; `docs/learning/vocabulary-engine.md` (цель удержания 0.85 / 0.90 / 0.93); TZ.md §3, §11 («05. Настройки», «Универсальные правила экрана»), §14 (БКРС), §15; `apps/mobile/shared/ui/*`; `apps/mobile/shared/config/tokens.ts`; `apps/mobile/tailwind.config.js` (`darkMode: "media"`); `apps/mobile/app/+html.tsx`; `apps/mobile/app/(tabs)/_layout.tsx`; `apps/mobile/shared/lib/{auth,useTheme}.ts`; `apps/mobile/shared/api/{useProfile,useUpdateProfile}.ts`.

> Нумерация TZ — по текущей редакции: универсальные правила экрана — §11, дизайн-система — §15.
>
> **Визуальный язык — раздел V `today-session.design.md`.** Здесь объявлены только токены и примитивы, которых нет в V.7 и §9 той спеки. Пока токены #65 не внесены, действует таблица замен §V-F.

---

## 0. Предусловия

| # | Что | Кто | Почему |
| --- | --- | --- | --- |
| P1 | **Удаление аккаунта на сервере.** Edge Function `account-delete` (POST, авторизованный вызов, тело пустое). Она удаляет объекты Storage с префиксом `{uid}/` в бакетах `materials` и `recordings`, затем вызывает `auth.admin.deleteUser(uid)`. Строки `profiles`, папок, слов, `learning_*`, `skill_states` уходят каскадом `on delete cascade`. Ответ `{ ok: true }`, ошибки — `{ code }` по общему формату `BackendError`. | Владелец бэкенда | Клиент не может удалить `auth.users` и чужие для RLS объекты. Каскад на `storage.objects` не распространяется, файлы остались бы висеть. |
| P2 | **Выбор темы на устройстве** (DS-T в §9): `darkMode: "class"` в tailwind, хранение выбора, скрипт до гидратации в `+html.tsx`, `useTheme()` и все прямые `useColorScheme()` читают выбранную схему. | `design-system-agent`, до экрана | Сейчас `darkMode: "media"`: тёмная тема — только по системе. Переключить её из приложения нельзя. |
| P3 | Примитивы §9 (S1–S7) и токены §«Новые токены». Из #65 нужны `SegmentedChoice` (DS4), `Chip` (DS3), глифы (DS11), кольцо фокуса (DS12). Если #65 ещё не внесён — замены §V-F. | `design-system-agent`, до экрана | |
| P4 | **Ограничение имени в БД** (предложение): `check (char_length(btrim(display_name)) between 1 and 40)` на `profiles.display_name`, добавленное как `not valid`, чтобы не упасть на уже существующих длинных именах из OAuth. | Владелец бэкенда | Сейчас в БД ограничения нет. Клиентская проверка (§3.3) не защищает от прямого запроса. Для вёрстки не блокирует. |
| P5 | Хуки данных: `useLearningSettings()` (строки нет — значения `LEARNING_SETTINGS_DEFAULTS`), `useUpdateLearningSetting()` (upsert одного поля), `useAccountEmail()` (почта из сессии Supabase), `useDeleteAccount()`. Mock-репозиторий с фикстурами на каждое состояние §5 и флагами `EXPO_PUBLIC_MOCK_*`. | `frontend-builder`, в этой задаче | Компоненты не ходят в репозиторий напрямую (как `useProfile`). |

**Данные и Правило 1 (TZ §3).** `learning_settings` пишет клиент: это выбор человека, а не учебное состояние (комментарий миграции, строки 15–16). Экран не вычисляет ни реальную квоту новых слов, ни нагрузку на завтра. Он только объясняет словами, что квота может быть меньше потолка.

---

## V-F. Замены, пока токены #65 не внесены

Экран строится на текущих `tokens.ts`. После внесения V.7 `frontend-builder` меняет левую колонку на правую **одним коммитом** (Acceptance 24). Каждое место замены помечено в коде комментарием `// #65-token: <имя>`.

| Токен #65 (V.7 / §9) | Сейчас использовать | Примечание |
| --- | --- | --- |
| `gradients.hero` (аватар) | `gradients.primary` / `gradients.primaryDark` | текст аватара тогда `textInverse`: 4.62:1 / 4.62:1 — AA |
| `heroInk` (буква аватара) | `textInverse` | |
| `typography.eyebrow` | `Text variant="caption"`, прописные, `font-semibold`, `tracking-wider` | `tracking-wider` — стандартный класс tailwind, не литерал |
| `focusRing` | `primary` | |
| `sizing.focusRingWidth` | `border-2` + `outline-offset-2` | |
| `sizing.tapTarget` / `min-h-tap` | `min-h-[44px]` — как в текущем коде | единственный допустимый литерал до внесения токена |
| `radius.tile` | `radius.lg` | |
| `motion.fast` / `motion.base` / `motion.slow` / `motion.spring` | **без анимации**: мгновенная смена | литералы длительностей запрещены (TZ §15) |
| `successInk` | иконка `success`, текст — `Text tone="default"` | текущий `success` на `surface` — 3.4:1, для текста не проходит AA |
| `attentionInk` | иконка `warning`, текст — `Text tone="default"` | |
| `SegmentedChoice` (DS4) | нет замены — **P3 обязателен** | без него нет `radiogroup` и стрелок (Acceptance 9) |
| `Chip` (DS3) | `Button variant="ghost"` с той же подписью | |
| глиф `check` (DS11) | без иконки, только текст | |

Новые токены **этой** спеки (§«Новые токены») внесены до экрана (P3). Замен для них нет.

---

## 1. Frame (TZ §11)

| Где | Primary Action | Secondary Action | Context | Exit |
| --- | --- | --- | --- | --- |
| Экран | Выбор в группе «Повторения». Сохраняется сразу, кнопки-CTA на экране нет | «Изменить имя» (`Chip`) | имя и почта, текущие значения, подсказка под каждым выбором | таб-бар |
| Лист «Имя» | «Сохранить» (`Button primary`) | «Отмена» (`Button ghost`) | поле с именем, счётчик | «Отмена», Escape, затемнение |
| Лист «Удалить аккаунт» | «Удалить навсегда» (`Button destructive`), недоступна до ввода слова | «Отмена» (`Button ghost`) | что удалится, «нельзя отменить» | «Отмена», Escape, затемнение (кроме времени запроса) |

**Один акцент на экране.** Доминанта — выбранные сегменты `primary` в «Повторениях» и «Оформлении»: суть экрана — текущие выбранные значения. Поэтому карточка профиля **не** на `gradients.hero`, а на `surface`. Градиент есть только в маленьком круге аватара. На экране нет ни одной `Button variant="primary"`, в каждом листе — ровно одна.

---

## 2. Порядок групп

Один порядок на всех ширинах (он же порядок Tab и порядок чтения диктором):

1. Заголовок экрана «Настройки»
2. **Профиль**
3. **Повторения**: время на повторение → новых слов в день → интенсивность
4. **Оформление**: тема
5. **О приложении**: источники данных, версия
6. **Аккаунт**: выйти → удалить аккаунт

Почему так: сверху — кто я, дальше самое частое (повторения), затем редкое (тема), справочное и в самом низу разрушительное. Это привычный порядок настроек в iOS, Android и веб-приложениях.

**Почему на 1280 одна колонка, а не две.** Проверен вариант «профиль слева, группы справа»: слева остаётся одна короткая карточка над пустотой, а порядок Tab расходится с порядком чтения. Одна колонка `sizing.settingsColumn` по центру даёт короткие строки и воздух. Так же устроены настройки GitHub и Linear.

---

## 3. Layout

### 3.1 Каркас

- `ScrollView`, фон `background`. Внутри колонка шириной `100%`, не шире `sizing.settingsColumn`, по центру (`self-center`).
- Режим ширины — по `onLayout` корневого контейнера, **не** по `useWindowDimensions` (как Acceptance 12 в today-session, из-за #56). `isWide` = ширина контейнера ≥ `breakpoints.wide`.
- Отступы колонки: узкий режим — по бокам `md`, сверху `lg`, снизу `xxl`. Широкий — по бокам `xl`, сверху `xxl`, снизу `xxl`.
- Между группами `gap-xl`. Внутри группы между заголовком и карточкой `gap-sm`.

```
390                                           1280 (сайдбар 224 + колонка по центру)
┌──────────────────────────────┐              ┌──────┬──────────────────────────────────────────────┐
│ Настройки            display │              │ Слов │        Настройки                    display  │
│                              │              │ Загр │        ПРОФИЛЬ                               │
│ ПРОФИЛЬ              eyebrow │              │ Наст │        ┌──────────────────────────────────┐  │
│ ┌──────────────────────────┐ │              │      │        │ (А)  Анна Петрова  [✎ Изменить имя]│ │
│ │ (А)  Анна Петрова  title │ │              │      │        │      anna@mail.ru                 │  │
│ │      anna@mail.ru  muted │ │              │      │        └──────────────────────────────────┘  │
│ │      [✎ Изменить имя]    │ │              │      │        ПОВТОРЕНИЯ                            │
│ └──────────────────────────┘ │              │      │        ┌──────────────────────────────────┐  │
│ ПОВТОРЕНИЯ                   │              │      │        │ … как на 390, шире …             │  │
│ ┌──────────────────────────┐ │              │      │        └──────────────────────────────────┘  │
│ │ Время на повторение  ✓Сох│ │              │      │        …                                     │
│ │ [ 5 мин |▓10 мин▓| 15 мин]│ │              └──────┴──────────────────────────────────────────────┘
│ │ Столько длится «Сегодня»…│ │
│ │ ──────────────────────── │ │
│ │ Новых слов в день,       │ │
│ │ не больше                │ │
│ │ [ 0 | 5 |▓8▓| 12 ]       │ │
│ │ Это потолок. Если завтра…│ │
│ │ ──────────────────────── │ │
│ │ Интенсивность            │ │
│ │ [Бережно|▓Обычно▓|Интенс]│ │
│ │ Чем выше, тем чаще…      │ │
│ └──────────────────────────┘ │
│ ОФОРМЛЕНИЕ                   │
│ ┌──────────────────────────┐ │
│ │ Тема                     │ │
│ │ [▢Системная|☀Светл|☾Тёмн]│ │
│ │ Хранится на этом устр-ве │ │
│ └──────────────────────────┘ │
│ О ПРИЛОЖЕНИИ                 │
│ ┌──────────────────────────┐ │
│ │ Словарь БКРС          ↗  │ │
│ │ bkrs.info                │ │
│ │ ──────────────────────── │ │
│ │ Списки слов HSK 2.0   ↗  │ │
│ │ Уровни слов              │ │
│ └──────────────────────────┘ │
│ Версия 0.1.0         caption │
│ АККАУНТ                      │
│ ┌──────────────────────────┐ │
│ │ ⇥ Выйти                  │ │
│ │ ──────────────────────── │ │
│ │ 🗑 Удалить аккаунт  (red) │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 3.2 Заголовок экрана

`Text variant="display"`, `settings.title`. Роль `header`, на web `aria-level={1}`.

### 3.3 Профиль

`SettingsGroup` с заголовком `settings.profile.title`. Внутри `Card` (без разделителей, это одна строка), содержимое `flex-row`, `gap-md`, `items-center`:

- **Аватар** — `Monogram` (S5): круг `sizing.avatar`, заливка `gradients.hero`, первая буква `display_name` прописной, `typography.title`, цвет `heroInk`. Декоративен (`aria-hidden`).
- **Текстовая колонка** (`flex-1`, `gap-xs`): имя — `Text variant="title"`, до 2 строк, перенос по словам. Почта — `Text variant="body" tone="muted"`, 1 строка, обрезка в середине (`ellipsizeMode="middle"`). Если почты нет (mock или провайдер её не отдал), строка не рендерится.
- **«Изменить имя»** — `Chip` вариант `neutral` (DS3), глиф `edit`. Узкий режим — под текстом, в текстовой колонке, выравнивание влево. Широкий — справа от текстовой колонки, по центру по вертикали.

**Лист «Имя»** (`Sheet`, `accessibilityLabel` = `settings.name.title`, внутри `gap-lg`):

```
Как вас называть?                         title
┌ Анна Петрова                        ┐   Input, initialFocusRef
└─────────────────────────────────────┘
Напишите имя                  12 из 40    caption: ошибка слева (только при ошибке), счётчик справа, muted
[            Сохранить            ]       Button primary
              Отмена                       Button ghost
```

- Поле заполнено текущим `display_name`, при открытии фокус в поле и текст выделен.
- Проверка по `value.trim()`: пусто → `settings.name.errorEmpty`; длиннее 40 → `settings.name.errorLong`. Ошибка показывается после первой попытки сохранить или после ухода фокуса с поля, не на каждую букву. `maxLength={40}` на `Input`. Если старое имя длиннее 40 (OAuth), поле показывает его целиком, счётчик — «52 из 40», «Сохранить» недоступна до исправления.
- «Сохранить» недоступна, когда `trim()` пуст, длиннее 40 или совпадает с текущим именем. Enter в поле = «Сохранить», если доступна.
- Сохранение — `useUpdateProfile({ display_name: value.trim() })`. У кнопки `loading`. Успех: лист закрывается, фокус возвращается на «Изменить имя» (`returnFocusRef`), имя в карточке обновлено из кэша. Ошибка: лист остаётся, под кнопками `FeedbackBanner tone="encouraging"` с `settings.name.saveError`, введённый текст сохранён.

### 3.4 Повторения

`SettingsGroup` с заголовком `settings.review.title`. `Card`, три блока `SettingBlock` (S1) через разделитель `border`. Внутри блока `gap-sm`:

```
Время на повторение                ✓ Сохранено      строка: подпись heading (flex-1) + SaveStatus справа
[  5 мин  | ▓▓10 мин▓▓ |  15 мин  ]                 SegmentedChoice compact, во всю ширину
Столько длится «Сегодня». То же время выбирается     caption muted — подсказка
в окне «Повторим?».
Не сохранилось. Проверьте интернет.  Повторить       SaveStatus error — отдельная строка, только при ошибке
```

| Блок | Поле | Варианты (значение → подпись) | По умолчанию | Подсказка |
| --- | --- | --- | --- | --- |
| Время на повторение | `session_minutes` | `5` → «5 мин», `10` → «10 мин», `15` → «15 мин» | 10 | `settings.review.minutesHint` |
| Новых слов в день, не больше | `max_new` | `0` → «0», `5` → «5», `8` → «8», `12` → «12» | 8 | `settings.review.newHint`. При выбранном `0` — `settings.review.newHintZero` |
| Интенсивность | `retention` | `0.85` → «Бережно», `0.90` → «Обычно», `0.93` → «Интенсивно» | 0.90 | `settings.review.intensityHint` |

**Значение из БД вне вариантов.** БД допускает `max_new` 0–30 и `retention` 0.80–0.95. `retention` — `real`, поэтому сравнение идёт с допуском: вариант выбран, если `|value − option| < 0.005`. Если не совпал ни один, в группе ничего не выбрано, Tab попадает на первый вариант. Экран не переписывает значение сам.

**Сохранение сразу при выборе:**

1. Выбор сразу отображается (оптимистично), и отправляется upsert **одного** поля (`useUpdateLearningSetting(field, value)`). Строки нет — upsert создаёт её, остальные поля берут значения по умолчанию из БД.
2. `SaveStatus` (S3) этого блока:
   - `saving` — «Сохраняем…», только если запрос идёт дольше `motion.slow`. Так нет мигания на быстрой сети.
   - `saved` — глиф `check` и «Сохранено» (`successInk`). Держится `motion.statusHold`, потом гаснет за `motion.base`. При reduced motion исчезает сразу.
   - `error` — выбор **возвращается** к последнему подтверждённому значению. Под подсказкой строка: «Не сохранилось. Проверьте интернет.» (`attentionInk`) и текстовая кнопка «Повторить». Она заново отправляет то значение, которое не сохранилось.
3. Быстрые повторные выборы: каждый выбор — новый запрос. Статус и откат решает **только последний** запрос поля, ответы более ранних игнорируются.
4. Успешное сохранение любого из трёх полей инвалидирует кэш `learningSettings` и кэш «Сегодня» (`TodaySummary`, today-session §1). Окно «Повторим?» и карточка «Сегодня» читают `session_minutes` из того же источника. Отдельной синхронизации нет: одно поле, два места выбора.

### 3.5 Оформление

`SettingsGroup` с заголовком `settings.appearance.title`, `Card`, один `SettingBlock`:

- Подпись `settings.appearance.theme`, `SegmentedChoice compact` с иконками (S7): `system` → глиф `monitor` + «Системная», `light` → `sun` + «Светлая», `dark` → `moon` + «Тёмная». По умолчанию `system`.
- Подсказка `settings.appearance.themeHint`.
- Выбор применяется **мгновенно**, без сети и без `SaveStatus`: `setThemePreference(value)` из DS-T. Смена цветов всего экрана — затухание `motion.base` (на web — `transition` цветов фона и текста на корне). При reduced motion — мгновенно.

### 3.6 О приложении

`SettingsGroup` с заголовком `settings.about.title`, подзаголовок группы (caption muted, под eyebrow) `settings.about.sourcesLead`. `Card` без внутренних отступов по вертикали, строки `SettingsRow` (S2) через разделитель.

**Строка источника — шаблон.** Источники перечислены в одном массиве `features/settings/dataSources.ts`, экран рендерит его по порядку:

```ts
interface DataSource {
  id: string;            // "bkrs" | "hsk2" | "makemeahanzi" | "cc-cedict" | "tatoeba"
  titleKey: string;      // settings.about.source.<id>.title
  detailKey: string;     // settings.about.source.<id>.detail — сайт и, если есть, лицензия
  url: string | null;    // null → строка не ссылка
}
```

- `SettingsRow` с `role="link"`: заголовок — `body` `font-semibold`, деталь — `caption` muted, справа глиф `externalLink` (`textMuted`). На web — настоящий `<a href target="_blank" rel="noopener noreferrer">`, на native — `Linking.openURL`.
- `url === null` → строка без глифа, не нажимается, роль `text`.
- Сейчас в массиве два источника: `bkrs` (url `https://bkrs.info`) и `hsk2` (url — Open Question 1, до ответа `null`). Будущие (`makemeahanzi`, `cc-cedict`, `tatoeba`) добавляются строкой в массив и двумя ключами i18n. Ключи для них заведены сразу (§8), в массив они не входят.
- Под карточкой, вне её — `Text variant="caption" tone="muted"` «Версия {{version}}». Версия — `Constants.expoConfig?.version`. Если значения нет, строка не рендерится.

### 3.7 Аккаунт

Группа рендерится только при `REQUIRES_AUTH` (как сейчас). `SettingsGroup` с заголовком `settings.account.title`, `Card`, две `SettingsRow` `role="button"`:

- **«Выйти»** — глиф `signOut`, тон `default`. Нажатие: строка в состоянии `pending` (спиннер справа, `aria-busy`, повторное нажатие игнорируется), затем `signOut()` и `queryClient.clear()`. Перевод на вход делает гейт авторизации в `app/_layout.tsx`. Подтверждения нет. Выбор темы на устройстве остаётся.
- **«Удалить аккаунт»** — глиф `trash`, тон `destructive` (подпись и глиф `destructive`). Открывает лист.

**Лист «Удалить аккаунт»** (`Sheet`, `accessibilityLabel` = `settings.delete.title`, `initialFocusRef` → поле, внутри `gap-lg`):

```
Удалить аккаунт?                              title
Удалится всё, что связано с аккаунтом:         body
 • имя и почта для входа                      body, список
 • папки и слова в них
 • прогресс повторений
 • загруженные файлы
┌ Это нельзя отменить. ─────────────────┐   плашка destructiveSoft, текст destructive, font-semibold
└──────────────────────────────────────────┘
Чтобы подтвердить, напишите «удалить»         caption, это label поля
┌ удалить                                 ┐   Input, autoCapitalize="none", autoCorrect off
└──────────────────────────────────────────┘
[         Удалить навсегда           ]        Button destructive, disabled до совпадения
               Отмена                          Button ghost
```

- Совпадение: `value.trim().toLocaleLowerCase("ru") === t("settings.delete.confirmWord")`. Enter в поле = подтверждение, если доступна.
- Во время запроса у «Удалить навсегда» `loading`, «Отмена» недоступна, Escape и затемнение **не** закрывают лист (нужен проп `dismissible={false}` у `Sheet`, S6).
- Успех: `signOut()` → `queryClient.clear()` → гейт переводит на экран входа. Лист не закрывается отдельно, экран уходит целиком.
- Ошибка: лист остаётся, поле сохраняет ввод, под кнопками `FeedbackBanner tone="encouraging"` с `settings.delete.error`.

---

## 4. Composition

| Элемент | Примитив `shared/ui` | Токены | Примечание |
| --- | --- | --- | --- |
| Заголовок экрана | `Text variant="display"` | `text` | `header`, `aria-level=1` |
| Заголовок группы | внутри `SettingsGroup` (S1new) | `typography.eyebrow`, `textMuted` | `header`, `aria-level=2` |
| Карточка группы | `Card` | `surface`, `border` (dark), `radius.card` | уже умеет тень и рамку в dark |
| Разделитель строк | внутри `SettingsGroup` | `border`, `hairline` (`StyleSheet.hairlineWidth`) | между детьми, не над первым |
| Аватар | `Monogram` (S5new) | `gradients.hero`, `heroInk`, `sizing.avatar`, `typography.title` | `aria-hidden` |
| Имя, почта | `Text` | `title` / `body` muted | |
| «Изменить имя» | `Chip` (DS3, вариант `neutral`) + глиф `edit` | `surfaceAlt`, `text`, `radius.pill`, `sizing.tapTarget` | |
| Блок настройки | `SettingBlock` (S1new) | `heading`, `caption` muted, `gap-sm`, отступы `md` | подпись + `SaveStatus` + контрол + подсказка |
| Выбор из 3–4 | `SegmentedChoice` (DS4, размер `compact`) | дорожка `surfaceAlt`, выбранный `primary` + `textInverse`, прочие `text`, `radius.pill` / `radius.tile` | `radiogroup` |
| Выбор темы | `SegmentedChoice compact` с иконками (S7) | те же | |
| Статус сохранения | `SaveStatus` (S3new) | `caption`, `textMuted`, `successInk`, `attentionInk`, `motion.statusHold` | live region |
| Строка источника / аккаунта | `SettingsRow` (S2new) | `body`, `caption` muted, `destructive`, `sizing.tapTarget` | `link` / `button` |
| Листы | `Sheet` | `scrim`, `sizing.sheetMaxWidth` | `initialFocusRef`, `returnFocusRef`, `dismissible` (S6) |
| Поле | `Input` | как есть | |
| Кнопки листов | `Button` `primary` / `ghost` / `destructive` (S4new) | `destructive`, `textInverse` | |
| Предупреждение «нельзя отменить» | нет: компонент фичи `features/settings/IrreversibleNote.tsx`, `View` + `Text` без иконки | `destructiveSoft`, `destructive`, `radius.md`, отступ `md` | не примитив, встречается один раз |
| Ошибки листов | `FeedbackBanner tone="encouraging"` | как есть | |
| Загрузка / ошибка групп | `LoadingState`, `ErrorState` | как есть | внутри карточки группы, §5 |

**New primitives needed:** S1–S7 и DS-T → `design-system-agent`, §9.

---

## Новые токены

Контраст — WCAG 2.x, посчитан для новых значений V.7 и для текущих `tokens.ts` (замены V-F), где отличается.

| Токен | Светлая | Тёмная | Зачем |
| --- | --- | --- | --- |
| `destructive` | `#B4232F` | `#FF8A8A` | подпись и глиф «Удалить аккаунт», текст плашки, заливка `Button destructive`. Как текст: 6.52:1 на `surface`, 5.74:1 на текущем `background` / 7.70:1 на `surface` V.7, 7.03:1 на текущем `surface`. Подпись кнопки на заливке — `textInverse`: белый 6.52:1 / тёмный 8.49:1 (V.7), 7.91:1 (текущий) |
| `destructiveSoft` | `#FFEEF0` | `#3A1620` | подложка плашки «Это нельзя отменить». `destructive` на ней 5.82:1 / 7.03:1 |
| `sizing.avatar` | 64 | 64 | диаметр `Monogram` |
| `sizing.settingsColumn` | 640 | 640 | максимальная ширина колонки настроек |
| `motion.statusHold` | 1600 ms | 1600 ms | сколько «Сохранено» остаётся на экране |

`danger` (текущий, 3.2:1 на белом) для текста не годится и в этой спеке не используется. `destructive` — отдельная роль: разрушительное действие, а не ошибка.

---

## 5. States

Экран **не** блокируется целиком. «Оформление», «О приложении» и «Аккаунт» не зависят от сети и рендерятся сразу. Выйти можно всегда, даже если профиль не загрузился.

| Часть | Loading | Empty | Error |
| --- | --- | --- | --- |
| Профиль (`useProfile`, `useAccountEmail`) | карточка той же высоты: `Monogram` без буквы, вместо текста `LoadingState` c `settings.profile.loading` (live region polite). «Изменить имя» нет | не бывает: профиль создаётся триггером при регистрации | в карточке `ErrorState` `settings.profile.error` / `settings.common.errorDetail`, `onRetry` → `refetch`, подпись `settings.common.retry` |
| Повторения (`useLearningSettings`) | в карточке `LoadingState` `settings.review.loading`. Контролов нет | строки нет → значения `LEARNING_SETTINGS_DEFAULTS`, выглядит как обычное состояние | в карточке `ErrorState` `settings.review.error` / `settings.common.errorDetail` + повтор |
| Сохранение поля | `SaveStatus saving` (§3.4) | — | `SaveStatus error` + откат + «Повторить» |
| Лист «Имя» | `Button loading` | — | `FeedbackBanner` `settings.name.saveError` |
| Лист «Удалить» | `Button loading`, лист не закрывается | — | `FeedbackBanner` `settings.delete.error` |
| Выйти | строка `pending` | — | ошибки нет: `signOut` локально чистит сессию всегда |
| Тема | — (читается синхронно, P2) | — | хранилище недоступно → `system`, молча |

Офлайн-сохранение не делается: ошибка сети — это `SaveStatus error`.

Маскота на экране нет: настройки — служебный экран, маскот отвлекал бы от выбора (TZ §11, «Маскот»).

---

## 6. Theming

- Все фоны, рамки и цвета текста — `className` с парой `dark:`. `useTheme().colors` — только для SVG (`Icon`) и градиента `Monogram`, как today-session §6.
- С P2 признак тёмной темы — класс `dark` на `<html>`, его ставит скрипт до гидратации по сохранённому выбору. Поэтому первая отрисовка статической web-сборки сразу в нужной теме, без вспышки светлой.
- Тёмная тема: карточки `surface` + рамка `border` (`Card` уже так делает). Выбранный сегмент — `primary` тёмной темы с `textInverse` тёмной (тёмный текст на светлом фиолетовом). `destructive` светлеет до розово-красного. Плашка — `destructiveSoft` тёмной темы.
- Выбор «Системная» следит за `prefers-color-scheme` на лету: сменили тему в ОС — экран сменился без перезагрузки.

---

## 7. Accessibility, клавиатура, фокус

| Элемент | Роль и атрибуты |
| --- | --- |
| «Настройки» | `header`, `aria-level=1` |
| Заголовки групп | `header`, `aria-level=2`. Текст в разметке строчный (`Повторения`), прописные — стилем, чтобы диктор не читал по буквам |
| Аватар | `aria-hidden` |
| Почта | `accessibilityLabel` `settings.profile.emailA11y` |
| «Изменить имя» | `button`, `accessibilityLabel` `settings.profile.editA11y` («Изменить имя, сейчас: Анна Петрова») |
| `SegmentedChoice` | `radiogroup`, `accessibilityLabel` = подпись блока, `aria-describedby` = `nativeID` подсказки. Варианты — `radio` + `checked`, подписи `settings.review.*A11y` («10 минут», «8 новых слов», «Обычно»). Roving tabindex: в группе один Tab-стоп (выбранный или первый), ←/→ и ↑/↓ двигают **и выбирают** (поведение WAI-ARIA radiogroup), Home/End — крайние |
| Иконки тем | `aria-hidden`, имя варианта даёт текст |
| `SaveStatus` | `accessibilityLiveRegion="polite"`. Объявляются «Сохранено» и ошибка. «Сохраняем…» не объявляется (`aria-hidden` на этом тексте) |
| «Повторить» в ошибке | `button`, `accessibilityLabel` `settings.save.retryA11y` («Повторить сохранение: Время на повторение») |
| Строка источника | `link`, `accessibilityLabel` `settings.about.sourceA11y` («Словарь БКРС, bkrs.info, откроется в новой вкладке») |
| «Выйти» | `button`, при ожидании `aria-busy` |
| «Удалить аккаунт» | `button`, `accessibilityHint` `settings.account.deleteHint` («Откроет подтверждение») |
| Листы | `dialog`, имя = заголовок листа. Фокус при открытии — в поле. При закрытии — на кнопку, которая открыла лист (`returnFocusRef`) |
| Поле удаления | `accessibilityLabel` = `settings.delete.confirmLabel`. Недоступная кнопка — `aria-disabled`, `accessibilityHint` `settings.delete.confirmHint` |
| Счётчик имени | `aria-live="off"`, объявляется только ошибка (`polite`) |

- Порядок Tab = порядок §2: «Изменить имя» → 3 группы повторений → тема → ссылки источников → «Выйти» → «Удалить аккаунт».
- Тап-таргеты: сегменты, строки, чип, «Повторить» — не меньше `sizing.tapTarget` по высоте (у «Повторить» — через увеличенную зону нажатия, а не через размер текста).
- Кольцо фокуса `focusRing`, `sizing.focusRingWidth`, только `:focus-visible`. У сегментов — вокруг выбранного/сфокусированного сегмента, не вокруг всей дорожки.
- Масштаб текста: подписи сегментов в 2 строки максимум (`numberOfLines={2}`, по центру), без обрезки многоточием. На 390 «Интенсивно» в сегменте шириной треть карточки помещается в одну строку. При увеличенном шрифте переносится.
- Движение: переезд выбранного сегмента — `motion.fast` + `motion.spring`, `SaveStatus` — затухание `motion.base`, смена темы — `motion.base`. При `useReducedMotion()` — мгновенно.

---

## 8. Копирайт (i18n, `apps/mobile/shared/i18n/ru.ts`, раздел `settings`)

`[задача]` — дословно из задачи или документов. `[предл.]` — предложено здесь, подтвердить до gate B (Open Question 2).

| Ключ | Текст | Источник |
| --- | --- | --- |
| `settings.title` | Настройки | задача |
| `settings.common.retry` | Попробовать ещё раз | как `learn.today.retry` |
| `settings.common.errorDetail` | Проверьте интернет и попробуйте ещё раз. | предл. |
| `settings.profile.title` | Профиль | задача |
| `settings.profile.loading` | Загружаем профиль | предл. |
| `settings.profile.error` | Не получилось загрузить профиль | предл. |
| `settings.profile.edit` | Изменить имя | предл. |
| `settings.profile.editA11y` | Изменить имя, сейчас: {{name}} | предл. |
| `settings.profile.emailA11y` | Почта для входа: {{email}} | предл. |
| `settings.name.title` | Как вас называть? | предл. |
| `settings.name.label` | Имя | предл. |
| `settings.name.counter` | {{count}} из 40 | предл. |
| `settings.name.errorEmpty` | Напишите имя | предл. |
| `settings.name.errorLong` | Не длиннее 40 символов | предл. |
| `settings.name.save` | Сохранить | предл. |
| `settings.name.cancel` | Отмена | как `learn.prompt.cancel` |
| `settings.name.saveError` | Не получилось сохранить имя. Проверьте интернет и попробуйте ещё раз. | предл. |
| `settings.review.title` | Повторения | задача |
| `settings.review.loading` | Загружаем настройки повторений | предл. |
| `settings.review.error` | Не получилось загрузить настройки повторений | предл. |
| `settings.review.minutes` | Время на повторение | задача |
| `settings.review.minutesOption` | {{count}} мин | как `learn.prompt.unit` |
| `settings.review.minutesA11y_one/few/many` | {{count}} минута / минуты / минут | предл. |
| `settings.review.minutesHint` | Столько длится «Сегодня». То же время выбирается в окне «Повторим?». | предл. |
| `settings.review.newWords` | Новых слов в день, не больше | задача |
| `settings.review.newA11y_one/few/many` | {{count}} новое слово / новых слова / новых слов | предл. |
| `settings.review.newHint` | Это потолок. Если завтра много повторений, новых будет меньше. | предл. |
| `settings.review.newHintZero` | Только повторения, новые слова не добавляются. | предл. |
| `settings.review.intensity` | Интенсивность | задача |
| `settings.review.intensityGentle` | Бережно | задача |
| `settings.review.intensityNormal` | Обычно | задача |
| `settings.review.intensityIntense` | Интенсивно | задача |
| `settings.review.intensityHint` | Чем выше, тем чаще повторения и тем крепче память. | задача |
| `settings.save.saving` | Сохраняем… | предл. |
| `settings.save.saved` | Сохранено | предл. |
| `settings.save.error` | Не сохранилось. Проверьте интернет. | предл. |
| `settings.save.retry` | Повторить | предл. |
| `settings.save.retryA11y` | Повторить сохранение: {{setting}} | предл. |
| `settings.appearance.title` | Оформление | задача |
| `settings.appearance.theme` | Тема | задача |
| `settings.appearance.system` | Системная | задача |
| `settings.appearance.light` | Светлая | задача |
| `settings.appearance.dark` | Тёмная | задача |
| `settings.appearance.themeHint` | Хранится на этом устройстве. | предл. |
| `settings.about.title` | О приложении | задача |
| `settings.about.sourcesLead` | Источники данных | предл. |
| `settings.about.sourceA11y` | {{title}}, {{detail}}, откроется в новой вкладке | предл. |
| `settings.about.source.bkrs.title` | Словарь БКРС | задача |
| `settings.about.source.bkrs.detail` | bkrs.info | задача |
| `settings.about.source.hsk2.title` | Списки слов HSK 2.0 | задача |
| `settings.about.source.hsk2.detail` | Уровни слов | предл. |
| `settings.about.source.makemeahanzi.title` | Make Me a Hanzi | задача, в массив не входит |
| `settings.about.source.makemeahanzi.detail` | Порядок черт | предл. |
| `settings.about.source.cc-cedict.title` | CC-CEDICT | задача, в массив не входит |
| `settings.about.source.cc-cedict.detail` | Лицензия CC BY-SA 4.0 | предл. |
| `settings.about.source.tatoeba.title` | Tatoeba | задача, в массив не входит |
| `settings.about.source.tatoeba.detail` | Примеры предложений · CC BY 2.0 FR | предл. |
| `settings.about.version` | Версия {{version}} | задача |
| `settings.account.title` | Аккаунт | задача |
| `settings.account.signOut` | Выйти | задача |
| `settings.account.delete` | Удалить аккаунт | задача |
| `settings.account.deleteHint` | Откроет подтверждение | предл. |
| `settings.delete.title` | Удалить аккаунт? | предл. |
| `settings.delete.lead` | Удалится всё, что связано с аккаунтом: | предл. |
| `settings.delete.itemProfile` | имя и почта для входа | задача |
| `settings.delete.itemFolders` | папки и слова в них | задача |
| `settings.delete.itemProgress` | прогресс повторений | задача |
| `settings.delete.itemFiles` | загруженные файлы | задача |
| `settings.delete.irreversible` | Это нельзя отменить. | задача |
| `settings.delete.confirmLabel` | Чтобы подтвердить, напишите «удалить» | предл. |
| `settings.delete.confirmWord` | удалить | задача |
| `settings.delete.confirmHint` | Сначала напишите «удалить» в поле выше | предл. |
| `settings.delete.confirm` | Удалить навсегда | предл. |
| `settings.delete.cancel` | Отмена | как `learn.prompt.cancel` |
| `settings.delete.error` | Не получилось удалить аккаунт. Проверьте интернет и попробуйте ещё раз. | предл. |

Подписи вариантов «0», «5», «8», «12» — числа, не ключи. Их имя для диктора — `settings.review.newA11y_*`. Тон — TZ §14: без кодов ошибок, без «сервер», «API», «сессия».

---

## 9. Для `design-system-agent` — примитивы

| # | Примитив | Требования |
| --- | --- | --- |
| S1 | **`SettingsGroup`** | пропы `title`, `lead?`, `footer?`, `children`. Заголовок — `typography.eyebrow`, `textMuted`, `header` + `aria-level=2`. Тело — `Card` с `p-0`, между детьми разделитель `border` толщиной `hairline`, с отступом слева `md`. `footer` — `caption` muted под карточкой. **`SettingBlock`** в том же файле: `label`, `status?: ReactNode`, `hint?`, `hintId`, `children`. Отступы `md`, `gap-sm` |
| S2 | **`SettingsRow`** | `title`, `detail?`, `leadingIcon?: IconName`, `trailing?: "chevron" \| "external" \| "none"`, `tone?: "default" \| "destructive"`, `role: "button" \| "link" \| "text"`, `href?` (web — настоящий `<a>`, `target="_blank"`, `rel="noopener noreferrer"`), `pending?` (спиннер справа, `aria-busy`, нажатия игнорируются). Высота ≥ `sizing.tapTarget`, отступы `md`. Нажатие — фон `surfaceAlt`, `motion.fast` |
| S3 | **`SaveStatus`** | `state: "idle" \| "saving" \| "saved" \| "error"`, `onRetry?`, `retryA11yLabel?`, `layout: "inline" \| "block"`. `saving` появляется с задержкой `motion.slow`. `saved` — глиф `check` + текст `successInk`, держится `motion.statusHold`, гаснет за `motion.base`. `error` (`block`) — текст `attentionInk` + текстовая кнопка «Повторить» с зоной нажатия `sizing.tapTarget`. Live region `polite`. Reduced motion — без затуханий |
| S4 | **`Button variant="destructive"`** | заливка `destructive`, подпись `textInverse`, без градиента. `disabled` — как у остальных вариантов |
| S5 | **`Monogram`** | круг `sizing.avatar`, `gradients.hero`, одна буква (первый графем имени, прописная, `toLocaleUpperCase("ru")`), `typography.title`, `heroInk`. `letter` пустая → только круг. Всегда `aria-hidden` |
| S6 | **`Sheet`: проп `dismissible`** | по умолчанию `true`. При `false` Escape, затемнение и «назад» браузера лист не закрывают |
| S7 | **`SegmentedChoice` (DS4): дополнения** | 4 варианта в `compact`, у каждого необязательный `icon: IconName` (слева от подписи, `aria-hidden`), подписи до 2 строк по центру, ширина вариантов равная. `aria-describedby`. Выбор стрелками по WAI-ARIA radiogroup (стрелка выбирает), Home/End. `compact`: высота ≥ `sizing.tapTarget`, дорожка `surfaceAlt`, `radius.pill`, выбранный `primary` + `textInverse` (как DS4). Невыбранные — текст `text`, `font-medium` |
| S8 | **Глифы `Icon`** | `edit`, `externalLink`, `signOut`, `trash`, `monitor`, `sun`, `moon` (плюс `check` из DS11) |
| DS-T | **Тема на устройстве** | 1) `tailwind.config.js`: `darkMode: "class"`. 2) `shared/lib/themePreference.ts`: `ThemePreference = "system" \| "light" \| "dark"`, хранение в `AsyncStorage` под ключом `yuny.theme` (на web — `localStorage`), `useThemePreference()` → `{ preference, setThemePreference }`. Применение — `colorScheme.set()` NativeWind. 3) `useTheme()` возвращает **итоговую** схему (выбор или система). `Button.tsx` и `AtmosphericBackground.tsx` читают её вместо `useColorScheme()`. 4) `+html.tsx`: встроенный скрипт до гидратации читает `localStorage["yuny.theme"]` и `matchMedia`, ставит класс `dark` и `color-scheme` на `<html>`. CSS автозаполнения переходит с `@media (prefers-color-scheme: dark)` на `.dark`. 5) При `system` — подписка на `matchMedia("(prefers-color-scheme: dark)")` |

---

## 10. Acceptance

1. Порядок групп в `settings.tsx`: заголовок, Профиль, Повторения, Оформление, О приложении, Аккаунт. Порядок один на всех ширинах.
2. Колонка не шире `sizing.settingsColumn`, по центру. Режим ширины — по `onLayout` контейнера и `breakpoints.wide`. В `features/settings/*` и `settings.tsx` нет `useWindowDimensions`.
3. Отступы колонки: узкий режим `px-md pt-lg pb-xxl`, широкий `px-xl pt-xxl pb-xxl`. Между группами `gap-xl`.
4. Профиль: `Monogram` (`sizing.avatar`, `gradients.hero`), имя `title` до 2 строк, почта `body` muted из `useAccountEmail()`. Если почты нет, строки почты нет. «Изменить имя» — `Chip neutral` (замена V-F — `Button ghost`): под текстом в узком режиме, справа в широком.
5. Лист «Имя»: фокус в поле при открытии; проверка по `trim()` 1–40; «Сохранить» недоступна при пустом, длинном или неизменённом значении; Enter сохраняет; успех закрывает лист и возвращает фокус на «Изменить имя»; ошибка — `FeedbackBanner` с `settings.name.saveError`, лист открыт.
6. Три блока «Повторений» с вариантами и значениями по умолчанию из таблицы §3.4. `retention` сравнивается с допуском 0.005. Значение вне вариантов — ничего не выбрано, запись не делается.
7. Выбор сразу отправляет upsert одного поля `learning_settings`. На экране нет кнопки «Сохранить» для повторений.
8. `SaveStatus`: `saving` не раньше `motion.slow`, `saved` держится `motion.statusHold`, при ошибке выбор откатывается к последнему подтверждённому, есть «Повторить», которая отправляет несохранённое значение. Статус определяет только последний запрос поля.
9. Все выборы — `SegmentedChoice` с `radiogroup` / `radio` / `checked`, одним Tab-стопом на группу, стрелками и Home/End, `aria-describedby` на подсказку.
10. Подсказка «Новых слов» при `max_new === 0` — `settings.review.newHintZero`, иначе `settings.review.newHint`. Экран не считает и не показывает реальную квоту.
11. Успешное сохранение любого поля повторений инвалидирует кэш `learningSettings` и кэш «Сегодня». `session_minutes` здесь и в окне «Повторим?» — одно поле БД.
12. Тема: `SegmentedChoice` с глифами `monitor` / `sun` / `moon`, по умолчанию `system`. Выбор применяется без сети и без `SaveStatus` через `setThemePreference`, переживает перезагрузку. Первая отрисовка web-сборки после перезагрузки сразу в выбранной теме (скрипт в `+html.tsx`).
13. `tailwind.config.js` — `darkMode: "class"`. В `apps/mobile` нет прямых вызовов `useColorScheme` вне `shared/lib/useTheme.ts` и `themePreference.ts`.
14. Источники рендерятся из массива `features/settings/dataSources.ts` по шаблону §3.6. В массиве `bkrs` и `hsk2`. Строка с `url` — `link` (на web `<a target="_blank" rel="noopener noreferrer">`) с глифом `externalLink`. Строка с `url === null` не нажимается.
15. «Версия {{version}}» из `Constants.expoConfig?.version`, `caption` muted, под карточкой «О приложении».
16. Группа «Аккаунт» только при `REQUIRES_AUTH`. «Выйти» без подтверждения: `signOut()` + `queryClient.clear()`, строка в `pending` на время вызова.
17. «Удалить аккаунт» — `SettingsRow tone="destructive"`, открывает лист. Лист перечисляет 4 пункта `settings.delete.item*` и плашку `destructiveSoft` с `settings.delete.irreversible`.
18. «Удалить навсегда» — `Button variant="destructive"`, недоступна, пока `trim().toLocaleLowerCase("ru")` поля не равно `settings.delete.confirmWord`. Во время запроса лист не закрывается ни «Отменой», ни Escape, ни затемнением (`dismissible={false}`).
19. Успешное удаление вызывает `account-delete`, затем `signOut()` и `queryClient.clear()`. Ошибка — `FeedbackBanner` `settings.delete.error`, ввод сохранён.
20. Состояния §5: профиль и повторения грузятся и ошибаются независимо, у ошибки есть повтор (`refetch`). «Оформление», «О приложении», «Аккаунт» рендерятся без ожидания сети. У каждого состояния — фикстура mock и флаг `EXPO_PUBLIC_MOCK_*`.
21. Роли и подписи — по таблице §7. Заголовок экрана `aria-level=1`, заголовки групп `aria-level=2`. Аватар и иконки — `aria-hidden`.
22. Тап-таргеты ≥ `sizing.tapTarget`. У всех интерактивных элементов видимое кольцо `focusRing` на `:focus-visible`.
23. Все строки — ключи §8 в `ru.ts`, числа с существительными через `_one/_few/_many`. Литеральной кириллицы в `.tsx` нет.
24. В новых файлах нет сырых hex, px и длительностей. Цвета, отступы, радиусы, размеры, движение — токены. Места замен V-F помечены `// #65-token: <имя>`. Литерал `min-h-[44px]` допустим только как такая замена.
25. Фоны, рамки и цвет текста — `className` с `dark:`. `useTheme().colors` — только в пропах SVG и градиента `Monogram`. `danger` не используется.
26. При `useReducedMotion() === true` нет переезда сегмента, затухания статуса и перехода темы.
27. `pnpm typecheck` и `pnpm lint` чистые.

---

## 11. Out of scope

- **Уровень HSK и прогресс по уровням** — в TZ §11 «05. Настройки» они есть, в содержании задачи #40 нет (Open Question 3).
- Тоновые цвета пиньиня (`tone_colors`, `exercise.design.md`, SHOULD).
- Смена почты и пароля, привязка Google/Apple.
- Сообщение «Аккаунт удалён» на экране входа.
- Экспорт данных перед удалением.
- Цель «К дате» и её влияние на удержание (LATER).
- Подписи вкладок в `(tabs)/_layout.tsx` через i18n.

## 12. Open Questions

1. **К владельцу.** Ссылка для «Списки слов HSK 2.0». В TZ §4 источник — `docs/hsk-words-visualized.pdf`, публичного адреса нет. До ответа строка без ссылки (`url: null`). Шаблон это поддерживает, стройку не блокирует.
2. **К владельцу.** Строки `[предл.]` в §8 подтвердить до gate B. Особенно: «Как вас называть?», «Удалить навсегда», подсказки к «Новых слов в день» и «Время на повторение», детали будущих источников (лицензии CC-CEDICT и Tatoeba нужно сверить при подключении).
3. **К владельцу.** TZ §11 включает в Настройки уровень HSK и прогресс по уровням. В #40 их нет. Отдельная задача или снимается?
4. **К владельцу бэкенда.** P1 (`account-delete`) и P4 (ограничение имени). Без P1 «Удалить аккаунт» строится на mock, но в продакшен не идёт: Acceptance 19 на реальном бэкенде не проверить.
5. **К `design-system-agent`.** DS-T меняет механизм тёмной темы для всего приложения (класс вместо media). Правки затронут `Button`, `AtmosphericBackground`, `+html.tsx` и таб-бар (#56). Лучше сделать вместе с #56, одним заходом.
