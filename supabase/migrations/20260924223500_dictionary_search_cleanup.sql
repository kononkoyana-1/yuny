-- Чистка выдачи словаря: три бага с живого сайта (2026-09-24).
--
-- 1. Пояснения в скобках.
-- На «Москва» выпадали «Выхино (станция метро, Москва)», «МКАД (в Москве)»,
-- «Клин (город в Московской области)»; на «Россия» — десятки городов с
-- пометой «(город …, Россия)». Слово стояло только в пояснении в скобках, а
-- поиск считал это совпадением.
--
-- Теперь текст в круглых и квадратных скобках при сравнении не учитывается:
--   * кандидаты полнотекста должны совпасть и после удаления пояснений;
--   * «целым словом» (rank 1) и поиск стоп-слов — тоже по тексту без пояснений;
--   * rank 0 уже сравнивал значение без скобок (миграция 20260923220858).
--
-- 2. Статьи без перевода на русский. В срезе БКРС 432 тыс. из 915 тыс. статей
--    толкуют слово только по-китайски (или по-английски): «说得 — 说；可以说。».
--    Ученику, который учит китайский через русский, они — шум. В выдачу по
--    иероглифам и пиньиню они попадают только при точном совпадении слова:
--    человек набрал ровно его, и лучше показать «перевода на русский нет»,
--    чем пустоту. Значения не по-русски не показывает и клиент.
--
-- 3. Статьи без чтения. У 536 тыс. статей чтения нет (别跑 — «Не убегайте»).
--    Чтение собирается из частей слова по тому же словарю: самое длинное
--    слово с чтением слева направо (别 + 跑 → «bié pǎo»). У многозначного
--    знака берётся первое чтение статьи, а служебные 的, 得, 地, 了, 着, 们,
--    么, 吗, 呢, 吧 не в начале слова читаются в лёгком тоне (说得 → «shuō de»).
--    Не нашлась хоть одна часть — чтения нет, как раньше.

-- Пояснения в скобках: «Выхино (станция метро, Москва)» → «Выхино ».
-- Дважды — для одного уровня вложенности «(… (…) …)».
create or replace function public.dict_strip_notes(text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select pg_catalog.regexp_replace(
           pg_catalog.regexp_replace(
             pg_catalog.regexp_replace($1, '\([^()]*\)', ' ', 'g'),
             '\([^()]*\)', ' ', 'g'),
           '\[[^]]*\]', ' ', 'g')
$$;

-- Есть ли в статье значение по-русски.
create or replace function public.dict_has_russian(text[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$ select public.dict_compact_text($1) ~ '[А-Яа-яЁё]' $$;

-- Чтение слова, собранное из частей (п. 3 шапки). Только для статей без чтения.
create or replace function public.dict_guess_reading(p_headword text)
returns text
language plpgsql
stable
parallel safe
set search_path = ''
as $$
declare
  v_len   integer := pg_catalog.char_length(p_headword);
  v_pos   integer := 1;
  v_take  integer;
  v_piece text;
  v_found text;
  v_parts text[] := '{}';
begin
  if p_headword is null or p_headword !~ '^[一-鿿]+$' or v_len > 12 then
    return null;
  end if;
  while v_pos <= v_len loop
    v_found := null;
    v_take  := null;
    for n in reverse least(4, v_len - v_pos + 1) .. 1 loop
      v_piece := pg_catalog.substr(p_headword, v_pos, n);
      if n = 1 and v_pos > 1 then
        v_found := case v_piece
                     when '的' then 'de' when '得' then 'de' when '地' then 'de'
                     when '了' then 'le' when '着' then 'zhe' when '们' then 'men'
                     when '么' then 'me' when '吗' then 'ma' when '呢' then 'ne'
                     when '吧' then 'ba'
                   end;
      end if;
      if v_found is null then
        select pg_catalog.btrim(pg_catalog.split_part(pg_catalog.translate(e.reading, ';', ','), ',', 1))
          into v_found
          from public.dictionary_entries e
         where e.headword = v_piece
           and public.dict_reading(e.reading) is not null
         order by e.hsk_level asc nulls last, e.id
         limit 1;
      end if;
      if v_found is not null then
        v_take := n;
        exit;
      end if;
    end loop;
    if v_take is null then
      return null;
    end if;
    v_parts := v_parts || v_found;
    v_pos := v_pos + v_take;
  end loop;
  return pg_catalog.array_to_string(v_parts, ' ');
end;
$$;

-- Чтение наружу: своё, а если его нет — собранное из частей.
create or replace function public.dict_entry_reading(p_reading text, p_headword text)
returns text
language sql
stable
parallel safe
set search_path = ''
as $$ select coalesce(public.dict_reading(p_reading), public.dict_guess_reading(p_headword)) $$;

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
  v_ru     text;
  v_word   text;
  v_fts    tsquery;
begin
  if v_query = '' then
    return;
  end if;

  if v_query ~ '[一-鿿]' then
    return query
      select e.id, e.headword, public.dict_entry_reading(e.reading, e.headword), e.senses, e.compact, e.hsk_level,
             (case when e.headword = v_query then 0 else 1 end)::smallint
        from public.dictionary_entries e
       where e.headword like public.dict_like_prefix(v_query) escape '\'
         and (e.headword = v_query or public.dict_has_russian(e.compact))
       order by (case when e.headword = v_query then 0 else 1 end),
                e.hsk_level asc nulls last,
                pg_catalog.length(e.headword),
                e.headword,
                e.id
       limit v_limit offset v_offset;
    return;
  end if;

  if v_query ~ '[А-Яа-яЁё]' then
    -- Запрос для сравнения со значениями: нижний регистр, только буквы,
    -- пробелы и дефисы («дом?» — это «дом»), одиночные пробелы.
    v_ru := pg_catalog.btrim(pg_catalog.regexp_replace(
              pg_catalog.regexp_replace(pg_catalog.lower(v_query), '[^[:alpha:][:space:]-]', '', 'g'),
              '\s+', ' ', 'g'));
    -- Целое слово: слева и справа не буква. Спецсимволы регулярки в запросе
    -- экранируются — в поле могут набрать что угодно.
    v_word := '(^|[^[:alpha:]])'
           || pg_catalog.regexp_replace(v_ru, '([.*+?^${}()|\[\]\\])', '\\\1', 'g')
           || '($|[^[:alpha:]])';
    v_fts := pg_catalog.plainto_tsquery('pg_catalog.russian'::pg_catalog.regconfig, v_query);

    return query
      with hits as (
        -- Кандидаты: полнотекст по индексу, а если запрос целиком из
        -- стоп-слов — целое слово среди статей HSK (см. шапку, п. 1).
        select e.*
          from public.dictionary_entries e
         where pg_catalog.numnode(v_fts) > 0
           and pg_catalog.to_tsvector(
                 'pg_catalog.russian'::pg_catalog.regconfig,
                 public.dict_compact_text(e.compact)
               ) @@ v_fts
           -- Совпадение только в пояснении в скобках — не совпадение.
           and pg_catalog.to_tsvector(
                 'pg_catalog.russian'::pg_catalog.regconfig,
                 public.dict_strip_notes(public.dict_compact_text(e.compact))
               ) @@ v_fts
        union all
        select e.*
          from public.dictionary_entries e
         where pg_catalog.numnode(v_fts) = 0
           and e.hsk_level is not null
           and exists (
                 select 1 from pg_catalog.unnest(e.compact) as c(v)
                  where public.dict_strip_notes(pg_catalog.lower(c.v)) ~ v_word
               )
      ),
      scored as (
        select h.*,
               -- Первое значение, где запрос — отдельный пункт.
               (select min(u.o)
                  from pg_catalog.unnest(h.compact) with ordinality as u(v, o)
                 where exists (
                         select 1
                           from pg_catalog.regexp_split_to_table(
                                  pg_catalog.regexp_replace(
                                    pg_catalog.lower(u.v), '\([^)]*\)|\[[^]]*\]|\*', '', 'g'),
                                  '[,;]') as part(p)
                          where pg_catalog.regexp_replace(pg_catalog.btrim(part.p), '\s+', ' ', 'g') = v_ru
                       )) as unit_pos,
               -- Первое значение, где запрос встречается целым словом.
               (select min(u.o)
                  from pg_catalog.unnest(h.compact) with ordinality as u(v, o)
                 where public.dict_strip_notes(pg_catalog.lower(u.v)) ~ v_word) as word_pos
          from hits h
      )
      select s.id, s.headword, public.dict_entry_reading(s.reading, s.headword), s.senses, s.compact, s.hsk_level,
             (case when s.unit_pos is not null then 0
                   when s.word_pos is not null then 1
                   else 2 end)::smallint as rank
        from scored s
       -- 7 — это rank: по имени нельзя, в plpgsql оно совпадает с выходным столбцом.
       order by 7,
                (s.hsk_level is not null and coalesce(s.unit_pos, s.word_pos) <= 3) desc,
                coalesce(s.unit_pos, s.word_pos) asc nulls last,
                s.hsk_level asc nulls last,
                pg_catalog.cardinality(s.compact) desc,
                pg_catalog.length(s.headword),
                s.headword,
                s.id
       limit v_limit offset v_offset;
    return;
  end if;

  v_plain := public.dict_pinyin_plain(v_query);
  if v_plain is null then
    return;
  end if;

  return query
    select e.id, e.headword, public.dict_entry_reading(e.reading, e.headword), e.senses, e.compact, e.hsk_level,
           (case
              when e.reading_plain = v_plain
                or public.dict_first_reading_plain(e.reading) = v_plain
              then 0 else 1
            end)::smallint
      from public.dictionary_entries e
     where e.reading_plain like public.dict_like_prefix(v_plain) escape '\'
       and public.dict_has_russian(e.compact)
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
