-- Что стоит в центре кружка модуля на Главной (docs/design/specs/home.design.md).
--
-- ТЗ обещает «картинку кружка» из разбора (TZ.md §10), но разбор картинки не
-- возвращает (схема TZ.md §7), а выдумывать её не из чего. Кружки различает
-- первое короткое слово материала: одно-два иероглифа читаются в кружке, а
-- слово длиннее уже не влезает. Короткого слова нет — первый знак первого
-- слова. Слов нет вовсе — NULL (разбор без слов отклоняется, так что у
-- готового модуля это не встречается).
--
-- Новое поле — в конце: `create or replace view` не даёт менять порядок
-- существующих колонок.

create or replace view public.module_progress
with (security_invoker = true) as
select
  m.id         as module_id,
  m.user_id,
  m.title,
  m.topic,
  m.created_at,
  cur.generation,
  (select count(*) from public.lessons l
    where l.module_id = m.id and l.generation = cur.generation) * 4 as total_tasks,
  (select count(distinct s.task_id)
     from public.task_submissions s
     join public.tasks t   on t.id = s.task_id
     join public.lessons l on l.id = t.lesson_id
    where l.module_id = m.id and l.generation = cur.generation) as done_tasks,
  coalesce(
    (select v.word from public.module_vocabulary v
      where v.module_id = m.id and char_length(v.word) <= 2
      order by v.position limit 1),
    (select left(v.word, 1) from public.module_vocabulary v
      where v.module_id = m.id
      order by v.position limit 1)
  ) as cover_text
from public.modules m
cross join lateral (
  select coalesce(max(l.generation), 1) as generation
    from public.lessons l
   where l.module_id = m.id
) cur
where m.status = 'ready';
