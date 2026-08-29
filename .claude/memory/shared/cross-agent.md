# Shared Memory — cross-agent

Facts promoted here are readable by every agent. Only the Orchestrator writes
to this file, and only after a fact has proven relevant to more than one
agent (AGENT_FRAMEWORK.md §3). Not a dumping ground for everything either
agent learns.

## Контентный пайплайн (промотировано 2026-08-28)

Нужно всем трём контентным агентам, а также `supabase-engineer`, когда он
появится:

- **`status = 'validated'` — жёсткий гейт, а не пометка.** С 2026-08-28
  `missionFromContent()` читает только `validated`. Всё, что залито раньше
  (103 главы Open Oregon, первая authored-партия), сейчас `draft` и в миссии не
  попадает; `mission-generate` откатывается на `generateMission`. Ретро-проверка
  старого материала — отдельная задача в `docs/plan-tasks.md`.
- **SQL пишет только `scripts/content-emit.mjs`.** Ни один агент не формирует
  SQL из текста. Причина — четыре падения заливки на экранировании.
- **Покрытие на 2026-08-28:** `clothing` закрыт одной единицей A2
  (`clothing-a2-shopping-01`, ждёт заливки). B1 по-прежнему без пригодного
  текста, B2+ пуст. `travel-and-accommodation` — 4 главы A2/B1.
- **Один пакет — один навык.** Смешение навыков внутри пакета отправляет
  evidence под `missions.primary_skill`, которого задания не измеряют, и портит
  Learning State. Найдено QA на первом же пакете.
