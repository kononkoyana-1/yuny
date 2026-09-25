-- Граф знака (#84): слова из 2–3 знаков, в которые входит знак, — для статьи
-- знака в листе словаря. Слова пользователя и ранжирование «свои → HSK →
-- остальные» собирает `dictionary-search` (action `article`,
-- `_shared/dictionaryArticle.ts`); здесь — только кандидаты из словаря.
--
-- Поиск «знак где угодно в заголовке» по `like '%看%'` — полный проход по
-- 915 тыс. статей. Вместо него — GIN по массиву знаков заголовка, и только по
-- тем статьям, что годятся в граф: 2–3 знака и есть значение по-русски.

-- Знаки заголовка массивом: «看书» → {看,书}. Для индексного выражения нужна IMMUTABLE.
create function public.dict_chars(text)
returns text[]
language sql
immutable
parallel safe
set search_path = ''
as $$ select pg_catalog.regexp_split_to_array($1, '') $$;

create index dictionary_entries_chars_idx
  on public.dictionary_entries using gin (public.dict_chars(headword))
  where pg_catalog.char_length(headword) between 2 and 3
    and public.dict_has_russian(compact);

-- Частоты слов в срезе БКРС нет. Порядок-заместитель: слова HSK по уровню,
-- дальше короче, дальше богаче значениями (у частых слов статьи длиннее).
-- Один заголовок — одна строка (у разных чтений — первая по тому же порядку).
create function public.dictionary_char_words(
  p_char  text,
  p_limit integer default 40
)
returns table (headword text, reading text, gloss text, hsk_level smallint)
language sql
stable
parallel safe
security invoker
set search_path = ''
as $$
  -- Чтение собирается после отбора: у статьи без чтения это запрос по частям слова.
  select t.headword, public.dict_entry_reading(t.reading, t.headword), t.gloss, t.hsk_level
    from (
      select w.*
        from (
          select distinct on (e.headword)
                 e.headword,
                 e.reading,
                 public.dict_first_russian(e.compact) as gloss,
                 e.hsk_level,
                 pg_catalog.cardinality(e.compact) as senses
            from public.dictionary_entries e
           where public.dict_chars(e.headword) @> array[p_char]
             and pg_catalog.char_length(e.headword) between 2 and 3
             and public.dict_has_russian(e.compact)
             and pg_catalog.char_length(p_char) = 1
           order by e.headword, e.hsk_level asc nulls last, pg_catalog.cardinality(e.compact) desc, e.id
        ) w
       order by w.hsk_level asc nulls last,
                pg_catalog.char_length(w.headword),
                w.senses desc,
                w.headword
       limit least(greatest(coalesce(p_limit, 40), 1), 100)
    ) t
   order by t.hsk_level asc nulls last,
            pg_catalog.char_length(t.headword),
            t.senses desc,
            t.headword
$$;

revoke execute on function public.dictionary_char_words(text, integer) from public, anon, authenticated;
grant execute on function public.dictionary_char_words(text, integer) to service_role;

comment on function public.dictionary_char_words(text, integer) is
  'Слова из 2–3 знаков со значением по-русски, в которые входит знак (#84). Порядок: HSK → короче → больше значений.';
