-- Прогресс модуля для Главной (TZ.md §10, §11 экран 01).
--
-- Прогресс — пройденные задания ко всем заданиям модуля: «3 / 8». Считает
-- сервер (TZ.md §3, правило 1), поэтому это представление в базе, а не
-- арифметика на клиенте.
--
-- Два решения, которых ТЗ не называет прямо:
--   * Считается текущий комплект заданий — последний `generation`. После
--     «Сформировать новые задания» кольцо начинается заново, а не показывает
--     «12 / 24» по двум комплектам сразу: пройденный модуль не должен
--     выглядеть недопройденным оттого, что ученик попросил новые задания.
--   * Заданий в уроке всегда четыре (TZ.md §8), а сами задания появляются,
--     только когда урок открыли (`lesson-generate`). Поэтому «всего» — это
--     уроки × 4, а не число строк в `tasks`: иначе у нового модуля было бы
--     «0 / 0».
--
-- Задание пройдено после первой отправки (TZ.md §10) — считаем задания, у
-- которых есть хоть одна строка в `task_submissions`.
--
-- На Главной только готовые модули: у модуля в разборе или с упавшим
-- разбором нет ни названия, ни слов, и путь к нему — экран загрузки.
--
-- `security_invoker`: представление читается правами того, кто спрашивает,
-- и RLS таблиц под ним отдаёт ученику только его модули.

create view public.module_progress
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
    where l.module_id = m.id and l.generation = cur.generation) as done_tasks
from public.modules m
cross join lateral (
  select coalesce(max(l.generation), 1) as generation
    from public.lessons l
   where l.module_id = m.id
) cur
where m.status = 'ready';

comment on view public.module_progress is
  'Модули на Главной: пройдено заданий из всех в текущем комплекте (TZ.md §10).';

grant select on public.module_progress to authenticated;
