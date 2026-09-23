-- Поиск по-русски: находить базовые слова и ставить главные значения выше.
--
-- Два бага с живого сайта (2026-09-23, диагностика — workflow db-query):
--
-- 1. Самые нужные ученику слова не находились вовсе. `plainto_tsquery(
--    'russian', …)` выбрасывает стоп-слова snowball: «есть», «быть»,
--    «хорошо», «много», «один», «два», «можно», «нельзя», «всегда»… — запрос
--    из одного такого слова становится пустым и не совпадает ни с чем
--    («быть» — 0 статей). Индекс без стоп-слов на ~900 тыс. статей строить
--    дорого по месту (TZ.md §14, #44), поэтому для такого запроса ищем без
--    полнотекста — целым словом по статьям со словами HSK: их 4859, это
--    частотная лексика, и именно её ищут по «есть» и «хорошо».
--
-- 2. Выдача шла «кто первым совпал»: точное совпадение одного из значений
--    поднимало редкий знак над частотным (на «дом» — 下舍 выше 家, на
--    «покупать» — 贾, 赎, 打勾 выше 买). Теперь порядок такой:
--      rank 0 — запрос равен отдельному значению («дом, двор» → «дом»; скобки
--               и пометы вроде «*» не мешают);
--      rank 1 — запрос встречается целым словом («торговый дом»);
--      rank 2 — совпал только корень («дома», «домашний»);
--    внутри — сначала слова HSK, у которых совпадение в первых трёх
--    значениях, затем более раннее значение, уровень HSK, более полная
--    статья (число значений — грубая, но честная мера частотности) и более
--    короткое слово.
--
-- Иероглифы и пиньинь ищутся как раньше: тело этих веток не менялось.

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
        union all
        select e.*
          from public.dictionary_entries e
         where pg_catalog.numnode(v_fts) = 0
           and e.hsk_level is not null
           and exists (
                 select 1 from pg_catalog.unnest(e.compact) as c(v)
                  where pg_catalog.lower(c.v) ~ v_word
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
                 where pg_catalog.lower(u.v) ~ v_word) as word_pos
          from hits h
      )
      select s.id, s.headword, public.dict_reading(s.reading), s.senses, s.compact, s.hsk_level,
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
