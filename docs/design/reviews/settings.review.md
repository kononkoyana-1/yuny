# Design Review — settings

Спека: `docs/design/specs/settings.design.md` v1 (2026-09-24).

## Round 1 · 2026-09-24 · REVISION_REQUIRED

**Reviewed:** `apps/mobile/app/(tabs)/settings.tsx`, `apps/mobile/features/settings/*`; для отдельных пунктов прочитаны `shared/ui/{SettingsRow,SettingsGroup,Text,Button,SegmentedChoice,SaveStatus}.tsx`, `shared/api/useSettings.ts`, `shared/platform/sheetA11y.web.ts`, `features/auth/useAuthStatus.ts`.
**Depth:** код + скриншоты оркестратора (`/tmp/claude-0/shots/*`: 390 и 1280 в обеих темах, группа «Аккаунт», лист имени, лист удаления в тёмной). Проверку клавиатуры и ARIA делал скрипт оркестратора, сам я её не проводил.
**Checks:** `pnpm typecheck` и `pnpm lint` прогнал сам, оба чистые.
**Принято вне ревью:** замены §V-F (запасной шрифт, мгновенное движение); тему в single-сборке ставит `initTheme()`, а не `+html.tsx`.

### Blockers

**B1. Красный цвет у «Удалить аккаунт» и у плашки «Это нельзя отменить» теряется.** Нарушены Acc 17 и §6.
`shared/ui/SettingsRow.tsx:63-64,72` и `features/settings/AccountSettings.tsx:151` задают цвет через `className="text-destructive dark:text-destructive-dark"` на `Text`. В `shared/ui/Text.tsx:24-36` прямо сказано, что такой класс проигрывает `TONE_CLASS` (`text-text`). Скриншоты это подтверждают. На `settings-account-390.png` подпись «Удалить аккаунт» тёмная, красный только глиф. На `delete-dark.png` текст плашки светлый, а не `destructive` тёмной темы.
Нужно: подпись и текст плашки в `destructive` / `destructive-dark`. Правильный путь — добавить `tone="destructive"` в `Text` (решает `design-system-agent`, это `shared/ui`) и использовать его в обоих местах.

**B2. После закрытия листа удаления фокус пропадает.** Нарушены §7 (строка «Листы») и Acc 21.
`AccountSettings.tsx:85,97`: `returnFocusRef` указывает на обёртку `<View ref={deleteRowRef}>`. `returnFocusTo` (`sheetA11y.web.ts:42-43`) вызывает у неё `.focus()`. Но у `div` без `tabIndex` вызов ничего не делает, и после «Отмены» или Escape фокус уходит на `body`. У `SettingsRow` (`SettingsRow.tsx:12-28`) нет пропа `ref`, поэтому указать на саму строку нельзя.
Нужно: фокус возвращается на строку «Удалить аккаунт». Для этого `SettingsRow` должен принимать `ref` на своём `Pressable`/`<a>` (это `design-system-agent`), а `AccountSettings` — передавать его без обёртки.

### Minor

**m1. В карточке «Повторения» нет разделителей между блоками** (§3.4: «три блока через разделитель `border`»).
`ReviewSettings.tsx:99-161`: `Blocks` возвращает фрагмент. `SettingsGroup.tsx:25` (`Children.toArray`) видит в нём одного ребёнка и не ставит разделители. Это видно на всех четырёх основных скриншотах. Нужно: три `SettingBlock` должны быть прямыми детьми `SettingsGroup`, например вынести условие загрузки и ошибки внутрь или отдавать массив.

**m2. «Изменить имя» на 390 стоит по центру текстовой колонки, а не слева** (§3.3, Acc 4).
`ProfileCard.tsx:70-78`, скриншоты `settings-390-{light,dark}.png`. На временной сборке `settings-account-390.png` кнопка уже слева, то есть сборки расходятся. Нужно: убедиться по финальной сборке, что кнопка прижата к левому краю колонки. Если нет — выровнять обёртку, например `self-start`.

### Замечания без статуса дефекта

- `settings-after.png` не подтверждает то, что обещает подпись. В тёмной теме выбраны «10 мин» и «Обычно», а не «15 мин» и «Интенсивно», статуса «Сохранено» не видно. Скорее всего, снимок сделан после перезагрузки: mock-хранилище сбросилось, тема сохранилась. По коду (`useSettingField`, `useSettings.ts:37-66`) оптимистичный выбор, последний запрос и откат сделаны по спеке. Этот пункт я принимаю по коду и скрипту, а не по пикселям.
- Acc 11: кэша «Сегодня» в `queryKeys.ts` пока нет, инвалидировать нечего. `learningSettings` обновляется ответом сервера через `setQueryData`. Когда появится `TodaySummary`, инвалидацию нужно добавить в `useSettingField`.
- `AccountSettings.tsx:76` добавляет ошибку выхода `settings.signOutFailed`, хотя §5 говорит «ошибки нет». Это защитный вариант, отмечаю как Open Question, а не дефект.
- Acc 16: `queryClient.clear()` при выходе вызывается централизованно на `SIGNED_OUT` (`useAuthStatus.ts:34`). Засчитано.

### Verdict

`REVISION_REQUIRED`: два блокера (B1, B2), оба чинятся в `shared/ui` через `design-system-agent`, после этого нужна правка вызовов в `AccountSettings.tsx`. m1 и m2 закрыть в том же раунде. Остальные пункты Acceptance 1–27 по коду выполнены.

## Round 2 · 2026-09-24 · APPROVED

**Reviewed:** `git diff`: `shared/ui/{Text,SettingsRow}.tsx`, `shared/platform/linkRow.tsx`, `features/settings/{AccountSettings,ReviewSettings}.tsx`.
**Depth:** код и скриншоты `/tmp/claude-0/pw/{full-light,full-dark,delete-light,delete-dark,name-sheet}.png` (390). Возврат фокуса проверял скрипт оркестратора в Chromium, сам я его не проверял. Скриншотов 1280 в этом раунде нет.
**Checks:** `pnpm typecheck` и `pnpm lint` прогнал сам, оба чистые.

- **B1 — закрыт.** В `Text` появился `tone="destructive"`, он есть в `TONE_CLASS`. `SettingsRow` и плашка `AccountSettings.tsx:113` используют его. На `full-light` и `full-dark` подпись «Удалить аккаунт» красная в обеих темах. На `delete-light` и `delete-dark` текст «Это нельзя отменить.» в `destructive` / `destructive-dark`.
- **B2 — закрыт.** `SettingsRow` передаёт `ref` в `LinkRow` и дальше в `Pressable`. Обёртки `View` больше нет, и `returnFocusRef` указывает на саму строку. Оркестратор измерил, что после Escape `activeElement` — кнопка «Удалить аккаунт».
- **m1 — закрыт.** Три блока стали прямыми детьми `SettingsGroup` (массив с ключами). На `full-*` видны оба разделителя.
- **m2 — закрыт.** На `full-*` и `name-sheet` кнопка «Изменить имя» прижата к левому краю колонки.
- **Open Question signOutFailed — принято.** Ошибка в подвале группы лучше, чем молчаливый сбой. Спеку это не расширяет, а закрывает пропущенное в ней состояние. Текст строки `settings.signOutFailed` я не видел ни на одном скриншоте. Если в нём нет обвинения пользователя и есть следующий шаг (тон по `TZ.md §14`), вопрос закрыт.

### Verdict

`APPROVED`: оба блокера и оба minor закрыты, новых дефектов в диффе нет.
