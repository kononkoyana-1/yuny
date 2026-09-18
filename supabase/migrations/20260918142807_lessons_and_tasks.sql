-- Уроки и задания модуля (TZ.md §8, §10, §12).
--
-- Урок — одна пачка слов до 20 и четыре задания к ней. Слов больше — уроков
-- больше: пачки режет сервер при разборе (TZ.md §3, правило 1).
--
-- `generation` — номер комплекта заданий. «Сформировать новые задания»
-- (TZ.md §10) даёт новый комплект уроков по тем же словам, а старый остаётся
-- доступным, поэтому урок принадлежит не только модулю, но и комплекту.
--
-- Правильные ответы лежат отдельно, в `task_answer_keys`, и клиенту не видны:
-- верно ли отвечено, считает сервер, и ключ до проверки отдавать незачем. Так
-- было и в прошлой редакции (`activity_answer_keys`).

create type public.task_type as enum (
  'reading_truefalse',
  'open_questions',
  'translation',
  'word_cards'
);

-- `pending` — пачка нарезана, заданий ещё нет; `generating` — идёт
-- `lesson-generate`; `failed` — генерация упала, урок можно сгенерировать заново.
create type public.lesson_status as enum ('pending', 'generating', 'ready', 'failed');

create table public.lessons (
  id             uuid                 primary key default gen_random_uuid(),
  module_id      uuid                 not null references public.modules (id) on delete cascade,
  user_id        uuid                 not null references auth.users (id) on delete cascade,
  generation     smallint             not null default 1 check (generation >= 1),
  position       smallint             not null check (position >= 1),
  status         public.lesson_status not null default 'pending',
  -- Пачка слов урока: id из `module_vocabulary` в порядке, заданном при
  -- нарезке. Массив, а не таблица связей: пачка не меняется после создания,
  -- а слова модуля удаляются только вместе с модулем.
  vocabulary_ids uuid[]               not null check (cardinality(vocabulary_ids) between 1 and 20),
  error_code     text,
  created_at     timestamptz          not null default now(),
  updated_at     timestamptz          not null default now(),
  unique (module_id, generation, position),
  constraint lessons_failed_has_code check (status <> 'failed' or error_code is not null)
);

create table public.tasks (
  id         uuid             primary key default gen_random_uuid(),
  lesson_id  uuid             not null references public.lessons (id) on delete cascade,
  module_id  uuid             not null references public.modules (id) on delete cascade,
  user_id    uuid             not null references auth.users (id) on delete cascade,
  type       public.task_type not null,
  -- Порядок в уроке всегда один и тот же (TZ.md §8): чтение, вопросы,
  -- перевод, карточки. Тип и позиция связаны жёстко.
  position   smallint         not null check (position between 1 and 4),
  -- То, что показывает экран: текст, утверждения, вопросы, предложения,
  -- карточки. Без правильных ответов.
  content    jsonb            not null,
  created_at timestamptz      not null default now(),
  unique (lesson_id, position),
  unique (lesson_id, type),
  constraint tasks_type_matches_position check (
    (type = 'reading_truefalse' and position = 1) or
    (type = 'open_questions'    and position = 2) or
    (type = 'translation'       and position = 3) or
    (type = 'word_cards'        and position = 4)
  )
);

-- Ключ к заданию: верность утверждений, правильные ответы карточек, эталонный
-- перевод. Читает и пишет только сервер — политик для клиента нет вовсе.
create table public.task_answer_keys (
  task_id    uuid        primary key references public.tasks (id) on delete cascade,
  answer_key jsonb       not null,
  created_at timestamptz not null default now()
);

create index lessons_module_idx     on public.lessons (module_id, generation, position);
create index lessons_user_idx       on public.lessons (user_id);
create index tasks_lesson_idx       on public.tasks (lesson_id, position);
create index tasks_module_idx       on public.tasks (module_id);
create index tasks_user_idx         on public.tasks (user_id);

create trigger lessons_touch before update on public.lessons
  for each row execute function public.touch_updated_at();

alter table public.lessons          enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_answer_keys enable row level security;

create policy "lessons: read own" on public.lessons
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks: read own" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);
