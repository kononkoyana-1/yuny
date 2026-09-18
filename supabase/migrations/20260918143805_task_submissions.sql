-- Отправки заданий (TZ.md §9, §10, §12).
--
-- Задание считается пройденным после первой отправки, какой бы ни был
-- процент (TZ.md §10). Поэтому отправка — всегда новая строка: повторная не
-- затирает первую, и «пройдено» — это просто «есть хоть одна строка».
--
-- Пишет только сервер (`task-submit`): процент и разбор считает он, клиент
-- читает своё.

create table public.task_submissions (
  id            uuid        primary key default gen_random_uuid(),
  task_id       uuid        not null references public.tasks (id) on delete cascade,
  lesson_id     uuid        not null references public.lessons (id) on delete cascade,
  module_id     uuid        not null references public.modules (id) on delete cascade,
  user_id       uuid        not null references auth.users (id) on delete cascade,
  -- Ответы как их прислал клиент: { <id пункта>: ответ }.
  answers       jsonb       not null,
  score_percent smallint    not null check (score_percent between 0 and 100),
  -- Разбор по существу на русском; у карточек его нет (TZ.md §9).
  comment       text,
  -- [{ fragment, what, correct }] — у карточек и чтения тоже, по пунктам.
  errors        jsonb       not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create index task_submissions_task_idx   on public.task_submissions (task_id, created_at);
create index task_submissions_lesson_idx on public.task_submissions (lesson_id);
create index task_submissions_module_idx on public.task_submissions (module_id);
create index task_submissions_user_idx   on public.task_submissions (user_id);

alter table public.task_submissions enable row level security;

create policy "task_submissions: read own" on public.task_submissions
  for select to authenticated using ((select auth.uid()) = user_id);
