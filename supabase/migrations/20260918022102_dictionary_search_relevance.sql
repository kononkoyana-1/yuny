-- Осмысленность выдачи словаря (TZ.md §11, экран 04).
--
-- Первая редакция сортировала попадания по длине заголовка, и на запрос `da`
-- 打 — первый иероглиф HSK 1 — оказывался на третьей странице. Две причины,
-- обе чинятся здесь.
--
-- 1. У частотных знаков несколько чтений, и `reading_plain` склеивает их в
--    одну строку: у 打 это «dada», а не «da», поэтому точным совпадением оно
--    не считалось. Теперь точным считается и совпадение с первым чтением.
-- 2. Частотность взять было неоткуда. Теперь есть: `hsk_level` проставлен по
--    таблице `hsk_words`, и слово из HSK идёт выше слова, которого нет ни в
--    одном уровне.
--
-- Обе проверки считаются только по строкам, которые уже отобрал индекс, —
-- на план запроса они не влияют.

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

  -- Иероглифы: точное совпадение заголовка выше префикса. Вхождения внутрь
  -- заголовка здесь нет намеренно — `%за%` не берёт ни один индекс, а слова
  -- длиннее четырёх знаков в базу и не заливались (TZ.md §14).
  if v_query ~ '[一-鿿]' then
    return query
      select e.id, e.headword, e.reading, e.senses, e.compact, e.hsk_level,
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

  -- Кириллица: ищем по короткому списку значений. Там перевод, а не пояснения
  -- и пометы, поэтому попадания осмысленные, а индекс втрое меньше, чем по
  -- всей статье. Статья, где запрос — целое значение, идёт выше статьи, где он
  -- попался внутри длинного перевода.
  if v_query ~ '[А-Яа-яЁё]' then
    return query
      select e.id, e.headword, e.reading, e.senses, e.compact, e.hsk_level, 2::smallint
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

  -- Латиница: пиньинь. Тона в запросе не обязательны и не мешают.
  v_plain := public.dict_pinyin_plain(v_query);
  if v_plain is null then
    return;
  end if;

  return query
    select e.id, e.headword, e.reading, e.senses, e.compact, e.hsk_level,
           (case
              when e.reading_plain = v_plain
                or public.dict_pinyin_plain(pg_catalog.split_part(e.reading, ',', 1)) = v_plain
              then 0 else 1
            end)::smallint
      from public.dictionary_entries e
     where e.reading_plain like public.dict_like_prefix(v_plain) escape '\'
     order by (case
                 when e.reading_plain = v_plain
                   or public.dict_pinyin_plain(pg_catalog.split_part(e.reading, ',', 1)) = v_plain
                 then 0 else 1
               end),
              e.hsk_level asc nulls last,
              pg_catalog.length(e.headword),
              e.headword,
              e.id
     limit v_limit offset v_offset;
end;
$$;

-- Уровень HSK на статье словаря: слово живёт в `hsk_words`, здесь — копия
-- ради сортировки и ради того, чтобы карточка показывала уровень без второго
-- запроса. Девять слов входят в два уровня — берём меньший: он говорит, когда
-- слово встречается впервые.
--
-- Функцией, а не разовым `update`, потому что заливка словаря идёт пачками и
-- продолжается после обрыва: проставить уровни один раз в миграции значило бы
-- оставить без них всё, что доехало позже. `scripts/db-import.mjs` зовёт её
-- последним шагом каждого прогона.
create function public.dict_backfill_hsk_level()
returns integer language plpgsql
set search_path = ''
as $$
declare
  v_rows integer;
begin
  update public.dictionary_entries e
     set hsk_level = h.level
    from (select word, min(level)::smallint as level from public.hsk_words group by word) h
   where e.headword = h.word
     and e.hsk_level is distinct from h.level;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

comment on function public.dict_backfill_hsk_level() is
  'Проставляет dictionary_entries.hsk_level по hsk_words. Идемпотентна.';

-- Пишет в словарь — значит, зовёт её только заливщик, а не клиент.
revoke execute on function public.dict_backfill_hsk_level() from public;
grant execute on function public.dict_backfill_hsk_level() to service_role;

select public.dict_backfill_hsk_level();
