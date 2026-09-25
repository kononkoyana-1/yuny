-- Порядок слов в папке (#70, docs/learning/data-sources.md «Чего не хватает»
-- п. 2): карта папки показывает слова как в файле, а не «новые первыми».
--
-- `position` — номер из одной общей последовательности: сравнивать его имеет
-- смысл только внутри папки, а там он и есть порядок добавления. Клиент его не
-- передаёт — значение по умолчанию раздаётся строкам одной вставки в порядке
-- списка, поэтому слова из файла ложатся в порядке файла, а слово, добавленное
-- вручную, — в конец папки. Пропуски (удалённые слова, `on conflict do
-- nothing`) порядку не мешают.
--
-- Старые строки нумеруются по `created_at`. Внутри одной пачки из файла время
-- одинаковое, и её порядок уже не восстановить — там решает `id`.

create sequence public.user_dictionary_items_position_seq as bigint;

alter table public.user_dictionary_items add column position bigint;

update public.user_dictionary_items i
   set position = n.rn
  from (select id, row_number() over (order by created_at, id) as rn
          from public.user_dictionary_items) n
 where n.id = i.id;

select setval(
  'public.user_dictionary_items_position_seq',
  coalesce((select max(position) from public.user_dictionary_items), 0) + 1,
  false
);

alter table public.user_dictionary_items
  alter column position set default nextval('public.user_dictionary_items_position_seq'),
  alter column position set not null;
alter sequence public.user_dictionary_items_position_seq owned by public.user_dictionary_items.position;
-- Клиент вставляет слова сам, под RLS: значение по умолчанию берётся с его правами.
grant usage on sequence public.user_dictionary_items_position_seq to authenticated, service_role;

-- Слова папки по порядку — карта папки и `learning-overview`.
create index user_dictionary_items_folder_position_idx
  on public.user_dictionary_items (folder_id, position);

comment on column public.user_dictionary_items.position is
  'Порядок добавления слова в папку: из файла — порядок файла, вручную — в конец.';
