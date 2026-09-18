-- Модуль — один загруженный материал (TZ.md §10, §12): до трёх файлов, слова
-- и грамматика из их разбора.
--
-- Жизнь модуля до разбора. `module-create` пишет строку сразу, в статусе
-- `parsing`: задаче разбора нужно, куда складывать результат, а клиенту —
-- куда перейти, когда задача закончится. Дальше два исхода неудачи, и они
-- разные по смыслу:
--   * материал не учебный или не читается (TZ.md §6) — модуль удаляется
--     вместе с файлами, в базе не остаётся ни строки. Повторять нечего:
--     нужен другой файл;
--   * упал сам разбор (Gemini недоступен, таймаут) — модуль остаётся в
--     статусе `failed` с файлами, и `module-parse` может разобрать его
--     заново без повторной загрузки.
-- На главной показываются только модули в статусе `ready`.
--
-- Писать во все четыре таблицы может только сервер: учебное состояние
-- считает он (TZ.md §3), поэтому у клиента здесь есть только чтение своего.
-- `user_id` повторён в дочерних таблицах ради RLS без подзапроса к `modules`.

create type public.module_status as enum ('parsing', 'ready', 'failed');

create table public.modules (
  id         uuid                 primary key default gen_random_uuid(),
  user_id    uuid                 not null references auth.users (id) on delete cascade,
  status     public.module_status not null default 'parsing',
  -- Название, тема и контекст приходят из разбора, до него их нет.
  title      text,
  topic      text,
  context    text,
  -- Почему разбор не удался — только для `failed`, код для клиента.
  error_code text,
  created_at timestamptz          not null default now(),
  updated_at timestamptz          not null default now(),
  constraint modules_ready_has_title check (status <> 'ready' or title is not null),
  constraint modules_failed_has_code check (status <> 'failed' or error_code is not null)
);

create table public.module_materials (
  id           uuid        primary key default gen_random_uuid(),
  module_id    uuid        not null references public.modules (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  -- Порядок частей материала: три файла — три части одного целого (TZ.md §6).
  position     smallint    not null check (position between 1 and 3),
  -- `{user_id}/{material_id}/{filename}` в bucket `materials`.
  storage_path text        not null unique,
  filename     text        not null,
  mime_type    text        not null,
  size_bytes   integer     not null check (size_bytes > 0),
  created_at   timestamptz not null default now(),
  unique (module_id, position)
);

create table public.module_vocabulary (
  id                  uuid        primary key default gen_random_uuid(),
  module_id           uuid        not null references public.modules (id) on delete cascade,
  user_id             uuid        not null references auth.users (id) on delete cascade,
  position            integer     not null,
  word                text        not null,
  reading             text,
  meaning_ru          text        not null,
  -- Как слово употреблено в материале. По нему выбирается словарное значение,
  -- которое станет правильным ответом в карточке (TZ.md §7, §9).
  sense_hint          text        not null,
  -- Словарь урезают и перезаливают — ссылка не должна мешать этому.
  dictionary_entry_id bigint      references public.dictionary_entries (id) on delete set null,
  hsk_level           smallint    check (hsk_level between 1 and 6),
  created_at          timestamptz not null default now(),
  unique (module_id, word)
);

create table public.module_grammar (
  id          uuid        primary key default gen_random_uuid(),
  module_id   uuid        not null references public.modules (id) on delete cascade,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  position    integer     not null,
  point       text        not null,
  explanation text        not null,
  examples    text[]      not null default '{}',
  created_at  timestamptz not null default now()
);

create index modules_user_created_idx       on public.modules (user_id, created_at desc);
create index module_materials_module_idx    on public.module_materials (module_id);
create index module_materials_user_idx      on public.module_materials (user_id);
create index module_vocabulary_module_idx   on public.module_vocabulary (module_id, position);
create index module_vocabulary_user_idx     on public.module_vocabulary (user_id);
create index module_vocabulary_dict_idx     on public.module_vocabulary (dictionary_entry_id);
create index module_grammar_module_idx      on public.module_grammar (module_id, position);
create index module_grammar_user_idx        on public.module_grammar (user_id);

create trigger modules_touch before update on public.modules
  for each row execute function public.touch_updated_at();

alter table public.modules           enable row level security;
alter table public.module_materials  enable row level security;
alter table public.module_vocabulary enable row level security;
alter table public.module_grammar    enable row level security;

create policy "modules: read own" on public.modules
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "module_materials: read own" on public.module_materials
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "module_vocabulary: read own" on public.module_vocabulary
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "module_grammar: read own" on public.module_grammar
  for select to authenticated using ((select auth.uid()) = user_id);

-- Bucket `materials` остался от прошлой редакции. Под TZ.md §6 ему не
-- хватало DOCX, а лишними были text/plain и webp. Лимит на файл — самый
-- большой из форматов (PDF, 20 МБ); лимиты по типам проверяет `module-create`.
update storage.buckets
   set file_size_limit    = 20 * 1024 * 1024,
       allowed_mime_types = array[
         'image/jpeg',
         'image/png',
         'image/heic',
         'image/heif',
         'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       ]
 where id = 'materials';
