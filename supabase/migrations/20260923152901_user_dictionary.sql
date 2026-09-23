-- Свой словарь (TZ.md §11 экран 04, §12): папки, которые создаёт
-- пользователь, и слова в них. Одно слово может лежать в нескольких папках —
-- это просто несколько строк `user_dictionary_items`, по одной на папку.
--
-- В отличие от модулей, здесь пишет сам клиент: папки и слова — не учебное
-- состояние, считать на сервере нечего (TZ.md §3), и отдельной Edge Function
-- под них нет (TZ.md §13). Поэтому RLS даёт владельцу полный доступ к своему,
-- а `user_id` по умолчанию берётся из сессии — клиенту его передавать не нужно.
--
-- Слово хранится своим естественным ключом из словаря — `headword` и
-- `reading`, тем же, что у `dictionary_entries_headword_reading_key`. Словарь
-- урезают и перезаливают целиком (TZ.md §14, supabase/README.md), и
-- `bigserial`-id при этом меняются: ссылка `dictionary_entry_id` — только для
-- быстрого join за статьёй, и при удалении статьи она обнуляется, а слово в
-- папке остаётся и находится заново по заголовку и чтению.

create table public.user_dictionary_folders (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_dictionary_folders_name_len
    check (char_length(btrim(name)) between 1 and 60),
  -- Цель составного внешнего ключа из `user_dictionary_items`: слово можно
  -- положить только в свою папку, и это держит сама схема, без подзапроса в
  -- политике.
  unique (id, user_id)
);

-- Две папки «Еда» и «еда» у одного человека — почти наверняка опечатка, а в
-- списке выбора папки их не различить.
create unique index user_dictionary_folders_user_name_key
  on public.user_dictionary_folders (user_id, lower(btrim(name)));

create table public.user_dictionary_items (
  id                  uuid        primary key default gen_random_uuid(),
  folder_id           uuid        not null,
  user_id             uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  dictionary_entry_id bigint      references public.dictionary_entries (id) on delete set null,
  headword            text        not null check (char_length(headword) between 1 and 64),
  reading             text,
  created_at          timestamptz not null default now(),
  foreign key (folder_id, user_id)
    references public.user_dictionary_folders (id, user_id) on delete cascade
);

-- В одной папке слово один раз. `coalesce` — как в ключе самого словаря:
-- у части статей чтения нет, а два `null` уникальный индекс не сравнивает.
create unique index user_dictionary_items_folder_word_key
  on public.user_dictionary_items (folder_id, headword, coalesce(reading, ''));
-- Поиск по своему словарю и ответ на «в каких папках уже лежит это слово».
create index user_dictionary_items_user_headword_idx
  on public.user_dictionary_items (user_id, headword text_pattern_ops);
create index user_dictionary_items_dict_idx
  on public.user_dictionary_items (dictionary_entry_id);

create trigger user_dictionary_folders_touch before update on public.user_dictionary_folders
  for each row execute function public.touch_updated_at();

alter table public.user_dictionary_folders enable row level security;
alter table public.user_dictionary_items   enable row level security;

create policy "user_dictionary_folders: read own" on public.user_dictionary_folders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_dictionary_folders: insert own" on public.user_dictionary_folders
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_dictionary_folders: update own" on public.user_dictionary_folders
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "user_dictionary_folders: delete own" on public.user_dictionary_folders
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Своя ли папка, проверяет составной внешний ключ выше: политике хватает
-- владельца строки.
create policy "user_dictionary_items: read own" on public.user_dictionary_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_dictionary_items: insert own" on public.user_dictionary_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_dictionary_items: update own" on public.user_dictionary_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "user_dictionary_items: delete own" on public.user_dictionary_items
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.user_dictionary_folders is
  'Папки своего словаря. Создаёт и называет пользователь.';
comment on table public.user_dictionary_items is
  'Слово в папке своего словаря. Одно слово в нескольких папках — несколько строк.';
