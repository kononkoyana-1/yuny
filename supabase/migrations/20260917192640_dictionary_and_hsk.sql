-- Словарь (TZ.md §14) и костяк слов HSK 2.0 (TZ.md §4).
--
-- Статья хранится один раз — структурой в `senses`. Отрисованный текст для
-- страницы словаря собирается из неё на клиенте: держать его отдельной
-- колонкой значило бы платить за те же 84 МБ дважды.

create table public.dictionary_entries (
  id             bigserial   primary key,
  headword       text        not null,
  -- Чтение как в словаре, с тонами: «dǎ, dá».
  reading        text,
  -- То же чтение без тонов и пробелов: по нему ищут те, кто набирает latinicej.
  reading_plain  text,
  -- [{ nest, num, gloss, header }] в порядке чтения статьи.
  senses         jsonb       not null,
  -- До шести переводов без служебных рубрик — идёт в промпты и в карточки.
  compact        text[]      not null default '{}',
  hsk_level      smallint,
  created_at     timestamptz not null default now()
);

-- array_to_string у Postgres помечен STABLE, а индексному выражению нужен
-- IMMUTABLE. Своя обёртка ровно для этого: склейка массива строк от состояния
-- базы не зависит.
create function public.dict_compact_text(text[])
returns text language sql immutable parallel safe
set search_path = ''
as $$ select array_to_string($1, ' ') $$;

create unique index dictionary_entries_headword_reading_key
  on public.dictionary_entries (headword, coalesce(reading, ''));
create index dictionary_entries_headword_prefix_idx
  on public.dictionary_entries (headword text_pattern_ops);
create index dictionary_entries_reading_plain_idx
  on public.dictionary_entries (reading_plain text_pattern_ops);
-- Поиск по русскому переводу идёт по короткому списку значений: там перевод, а
-- не пояснения, и индекс втрое меньше, чем по всей статье.
create index dictionary_entries_ru_idx
  on public.dictionary_entries
  using gin (to_tsvector('russian', public.dict_compact_text(compact)));
create index dictionary_entries_hsk_level_idx
  on public.dictionary_entries (hsk_level) where hsk_level is not null;

comment on table public.dictionary_entries is
  'Срез 大БКРС: заголовки до четырёх иероглифов, без блоков примеров.';

create table public.hsk_words (
  word       text     not null,
  level      smallint not null check (level between 1 and 6),
  primary key (word, level)
);

comment on table public.hsk_words is
  'HSK 2.0: 5000 слов. Девять слов законно встречаются на двух уровнях — это разные чтения одного знака, поэтому ключ составной.';

alter table public.dictionary_entries enable row level security;
alter table public.hsk_words          enable row level security;

-- Словарь одинаков для всех: авторизованный читает, пишет только service role.
create policy dictionary_entries_read on public.dictionary_entries
  for select to authenticated using (true);
create policy hsk_words_read on public.hsk_words
  for select to authenticated using (true);
