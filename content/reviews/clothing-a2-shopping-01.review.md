# Review — clothing-a2-shopping-01

Рецензент видел только `specs/clothing-a2-shopping-01.spec.json`,
`drafts/clothing-a2-shopping-01.content.json` и отчёт gate B
(`docs/CONTENT_AGENTS.md` §9.4). Рассуждения автора и его Memory не читались.

---

## Раунд 1 — 2026-08-28

**Verdict:** REVISION_REQUIRED

**Checklist (§10.2):**

| Проверка | Исход |
| ----- | ----- |
| correctness | **fail** — два задания принимают не все верные ответы |
| naturalness | pass с замечанием |
| level | pass с замечанием — две лексемы вне заявленной калибровки |
| difficulty | pass |
| skill alignment | **fail** — LO-2 грамматический, спецификация объявляет skill `vocabulary` |
| goal alignment | pass |
| clarity | pass |
| ambiguity | **fail** — см. correctness |
| pedagogical value | pass |
| assessment quality | pass |
| тон (`TZ.md §14`) | pass |
| провенанс | pass — всё `ai_generated`, ничего не выдаётся за цитату |

**Findings:**

- **[blocker] LO-1 / `size` / fill_blank.** «The medium jacket is small on Dani,
  so he asks for a bigger ___.» принимает только `size`, но «a bigger **one**»
  и «a bigger **jacket**» — такой же правильный английский в этом предложении.
  Учащийся, ответивший верно, получит «неправильно», и `evidence` запишет
  слабый результат по слову, которое он знает. Нужно предложение, где
  подходит только `size` — например, через «asks the assistant for a bigger
  ___» контекст не спасает; спасает конструкция, где слово обязательно
  («What ___ do you take?» / «a bigger ___ of the same jacket»).

- **[blocker] LO-1 / `exchange` / fill_blank.** «…so he decides to ___ the
  jacket for a grey one.» — `change` подходит и грамматически, и по смыслу, и
  для A2 даже вероятнее целевого `exchange`. То же последствие.

- **[spec defect] LO-2 против `skill: "vocabulary"`.** Спецификация объявляет
  навык `vocabulary`, но LO-2 проверяет грамматику (`too` / `not … enough`), и
  под него отдано 2 из 8 заданий. Последствие не косметическое: миссия из этой
  единицы уйдёт в `missions.primary_skill = 'vocabulary'`, и `evidence` по
  грамматическим заданиям осядет под навыком, который они не измеряют, —
  то есть Learning State будет испорчен ровно тем механизмом, который
  `TZ.md §3` Правило 1 защищает. Это дефект спецификации, не драфта:
  адресуется learning-agent (§9.3), а не content-agent.

- **[minor] Уровень.** `till` и `rail` — вне «первых 1000 частотных слов»,
  заявленных в `level.calibration_basis` самой спецификации. `till` вдобавок
  британский; американский учащийся его не узнает. Заменить на `checkout` или
  переформулировать.

- **[minor] Естественность.** «The shop has two answers for him» — калька, так
  не говорят. «The assistant tells him he has two choices» или проще.

**Что проверено не было:** произношение, аудио, культурная уместность сценария
возврата в конкретной стране (спецификация явно вывела последнее из области
проверки).

---

## Раунд 2 — 2026-08-28

Проверялась версия 2 спецификации (LO-2 вынесен в отдельный пакет) и
переписанный драфт.

**Verdict:** APPROVED

**Checklist (§10.2):**

| Проверка | Исход |
| ----- | ----- |
| correctness | pass — оба неоднозначных пропуска переписаны, единственный верный ответ проверен по каждому |
| naturalness | pass — `till`→`checkout`, «two answers»→«two choices», `rail` убран из текста совсем |
| level | pass — вся лексика вне целевого списка укладывается в заявленную калибровку |
| difficulty | pass — 2 соответствует полосе и заданиям |
| skill alignment | pass — пакет целиком `vocabulary`, грамматика вынесена |
| goal alignment | pass — все три `target_situations` покрыты |
| clarity | pass |
| ambiguity | pass |
| pedagogical value | pass — предложения заданий не копируют текст, отвечать по памяти о сюжете нельзя |
| assessment quality | pass — 5 целевых слов, 6 заданий, `evidence_of_success` достижим ровно ими |
| тон (`TZ.md §14`) | pass |
| провенанс | pass |

**Findings:** нет блокеров.

- **[minor, не блокирует]** `fitting room` как `dedup_key` из двух слов — в
  существующем банке ключи однословные. Схема это допускает
  (`unique (content_unit_id, kind, dedup_key)`), поведение корректно; отмечено
  для консистентности будущих пакетов, не для правки этого.

**Что проверено не было:** то же, что в раунде 1.
