-- Поиск по словарю одним полем (TZ.md §11, экран 04): иероглиф, пиньинь и
-- русский перевод ищет одна функция, потому что поле у пользователя одно.
--
-- Разбор идёт по письменности ввода, а не по флажку в запросе: иероглифы
-- ищутся по заголовку, латиница — по чтению без тонов, кириллица — по
-- короткому списку значений. Три ветки вместо одного `or` на три поля не
-- вкусовщина: у каждой свой индекс, а `or` через три индекса на 1,9 млн строк
-- планировщик сводит к последовательному чтению таблицы.

-- Пиньинь без тонов: `hànzì` → `hanzi`. То же самое делает клиент перед
-- запросом, и то же самое сделал импортёр, заполняя `reading_plain`, —
-- правило одно на все три места.
create function public.dict_pinyin_plain(p_text text)
returns text language sql immutable parallel safe
set search_path = ''
as $$
  select nullif(
    pg_catalog.regexp_replace(
      pg_catalog.translate(
        pg_catalog.lower(p_text),
        'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹḿ',
        'aaaaeeeeiiiioooouuuuuuuuunnnm'
      ),
      '[^a-z]', '', 'g'
    ),
    ''
  )
$$;

comment on function public.dict_pinyin_plain(text) is
  'Чтение к виду для поиска: без тонов, без пробелов, в нижнем регистре.';

-- `%` и `_` в запросе — это то, что пользователь набрал, а не подстановочные
-- знаки. Экранируем их, иначе «100%» превращается в «найди вообще всё».
create function public.dict_like_prefix(p_text text)
returns text language sql immutable parallel safe
set search_path = ''
as $$
  select pg_catalog.replace(
           pg_catalog.replace(
             pg_catalog.replace(p_text, '\', '\\'),
             '%', '\%'),
           '_', '\_') || '%'
$$;

create function public.dictionary_search(
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
                pg_catalog.length(e.headword),
                e.headword,
                e.id
       limit v_limit offset v_offset;
    return;
  end if;

  -- Кириллица: ищем по короткому списку значений. Там перевод, а не пояснения
  -- и пометы, поэтому попадания осмысленные, а индекс втрое меньше, чем по
  -- всей статье.
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
       order by pg_catalog.length(e.headword),
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
           (case when e.reading_plain = v_plain then 0 else 1 end)::smallint
      from public.dictionary_entries e
     where e.reading_plain like public.dict_like_prefix(v_plain) escape '\'
     order by (case when e.reading_plain = v_plain then 0 else 1 end),
              pg_catalog.length(e.headword),
              e.headword,
              e.id
     limit v_limit offset v_offset;
end;
$$;

comment on function public.dictionary_search(text, integer, integer) is
  'Словарь одним полем: иероглиф, пиньинь или русский перевод (TZ.md §11, экран 04).';

-- Читать словарь может любой вошедший — ровно как и сами таблицы.
grant execute on function public.dictionary_search(text, integer, integer) to authenticated;
