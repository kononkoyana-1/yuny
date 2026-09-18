-- Две правки поиска по словарю, обе видны на первом же запросе.
--
-- 1. Чтения в БКРС разделяются и запятой, и точкой с запятой: у 打 это
--    «dǎ, dá», а у 大 — «dà; dài; tài». Первое чтение выделялось только по
--    запятой, поэтому 大 на запрос `da` не считалось точным совпадением и
--    уходило ниже редких знаков вроде 亣. Режем по обоим разделителям.
--
-- 2. У карточки без транскрипции БКРС ставит в строке чтения заполнитель
--    («_», реже «--» или тире), и первая версия парсера записала его как
--    настоящее чтение. Парсер исправлен, данные чистятся отдельно
--    (`scripts/db-fix-placeholder-readings.mjs`), но правка упёрлась в
--    кончившееся место на диске проекта. Пока она не доехала, чтение без
--    единой буквы не выдаётся наружу: экран словаря показал бы «_» там, где
--    чтения просто нет.

-- Первое чтение статьи к виду для сравнения. Разделителей два: «dǎ, dá» и
-- «dà; dài; tài» — оба встречаются в БКРС.
create function public.dict_first_reading_plain(p_reading text)
returns text language sql immutable parallel safe
set search_path = ''
as $$
  select public.dict_pinyin_plain(
    pg_catalog.split_part(pg_catalog.translate(p_reading, ';', ','), ',', 1)
  )
$$;

-- Чтение наружу: заполнитель — это отсутствие чтения, а не чтение.
create function public.dict_reading(p_reading text)
returns text language sql immutable parallel safe
set search_path = ''
as $$
  select case when p_reading ~ '[[:alpha:]]' then p_reading end
$$;

comment on function public.dict_reading(text) is
  'Чтение статьи или NULL, если вместо чтения стоит заполнитель БКРС.';

create or replace function public.dictionary_search(
  p_query  text,
  p_limit  integer default 20,
  p_offset integer default 0
)
returns table (
  id        bigint,
  headword  text,
  reading   text,
  senses    jsonb,
  compact   text[],
  hsk_level smallint,
  rank      smallint
)
language plpgsql
stable
parallel safe
security invoker
set search_path = ''
as $$
declare
  v_query  text    := pg_catalog.btrim(coalesce(p_query, ''));
  v_limit  integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_plain  text;
begin
  if v_query = '' then
    return;
  end if;

  if v_query ~ '[一-鿿]' then
    return query
      select e.id, e.headword, public.dict_reading(e.reading), e.senses, e.compact, e.hsk_level,
             (case when e.headword = v_query then 0 else 1 end)::smallint
        from public.dictionary_entries e
       where e.headword like public.dict_like_prefix(v_query) escape '\'
       order by (case when e.headword = v_query then 0 else 1 end),
                e.hsk_level asc nulls last,
                pg_catalog.length(e.headword),
                e.headword,
                e.id
       limit v_limit offset v_offset;
    return;
  end if;

  if v_query ~ '[А-Яа-яЁё]' then
    return query
      select e.id, e.headword, public.dict_reading(e.reading), e.senses, e.compact, e.hsk_level,
             2::smallint
        from public.dictionary_entries e
       where pg_catalog.to_tsvector(
               'pg_catalog.russian'::pg_catalog.regconfig,
               public.dict_compact_text(e.compact)
             ) @@ pg_catalog.plainto_tsquery(
               'pg_catalog.russian'::pg_catalog.regconfig,
               v_query
             )
       order by (exists (
                  select 1 from pg_catalog.unnest(e.compact) as c
                   where pg_catalog.lower(c) = pg_catalog.lower(v_query)
                )) desc,
                e.hsk_level asc nulls last,
                pg_catalog.length(e.headword),
                e.headword,
                e.id
       limit v_limit offset v_offset;
    return;
  end if;

  v_plain := public.dict_pinyin_plain(v_query);
  if v_plain is null then
    return;
  end if;

  return query
    select e.id, e.headword, public.dict_reading(e.reading), e.senses, e.compact, e.hsk_level,
           (case
              when e.reading_plain = v_plain
                or public.dict_first_reading_plain(e.reading) = v_plain
              then 0 else 1
            end)::smallint
      from public.dictionary_entries e
     where e.reading_plain like public.dict_like_prefix(v_plain) escape '\'
     order by (case
                 when e.reading_plain = v_plain
                   or public.dict_first_reading_plain(e.reading) = v_plain
                 then 0 else 1
               end),
              e.hsk_level asc nulls last,
              pg_catalog.length(e.headword),
              e.headword,
              e.id
     limit v_limit offset v_offset;
end;
$$;
