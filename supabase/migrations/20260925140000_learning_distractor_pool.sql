-- Изучение слов (#62): кандидаты в неверные варианты для упражнений с выбором.
--
-- Отдаёт по несколько кандидатов из каждого источника, от сильного к слабому
-- (vocabulary-engine.md, раздел 3). Выбор, фильтр синонимов и порядок — в
-- `_shared/learning/distractors.ts`. Вызывает сборщик сессии (service_role).
--
--   pair        — пара путаницы пользователя (кроме решённых)
--   shared_char — слово его словаря с общим знаком
--   same_sound  — слово его словаря с тем же звучанием без тонов
--   homophone   — омофон из словаря той же длины
--   form        — слово HSK с общим знаком той же длины
--   user        — любое своё слово
--   level       — слово того же уровня HSK
--
-- Значение — перевод из словаря пользователя, иначе первое русское значение
-- статьи. Кандидаты без русского значения годятся только для знака и пиньиня —
-- их отсекает выбор вариантов, не эта функция.

-- Первое русское значение из короткого списка статьи.
create function public.dict_first_russian(text[])
returns text language sql immutable parallel safe
set search_path = ''
as $$ select c from unnest($1) c where c ~ '[А-Яа-яЁё]' limit 1 $$;

create function public.learning_distractor_pool(
  p_user     uuid,
  p_headword text,
  p_reading  text,
  p_hsk      smallint default null,
  p_limit    integer  default 12
)
returns table (headword text, reading text, gloss text, source text)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select p_headword as h,
           public.dict_pinyin_plain(p_reading) as plain,
           char_length(p_headword) as len,
           array(select c from regexp_split_to_table(p_headword, '') c) as chars
  ),
  mine as (
    select l.headword, l.reading,
           coalesce(l.translation,
                    (select public.dict_first_russian(e.compact) from public.dictionary_entries e
                      where e.id = l.dictionary_entry_id)) as gloss
      from public.learning_lexemes l, target t
     where l.user_id = p_user and l.headword <> t.h
  ),
  pairs as (
    select case when c.headword_a = t.h then c.headword_b else c.headword_a end as headword,
           case when c.headword_a = t.h then c.reading_b else c.reading_a end as reading,
           case when c.headword_a = t.h then c.lexeme_b else c.lexeme_a end as lexeme
      from public.confusion_pairs c, target t
     where c.user_id = p_user
       and c.status <> 'resolved'
       and ((c.headword_a = t.h and c.reading_a is not distinct from p_reading)
         or (c.headword_b = t.h and c.reading_b is not distinct from p_reading))
  )
  (select p.headword, p.reading,
          coalesce(l.translation,
                   (select public.dict_first_russian(e.compact) from public.dictionary_entries e
                     where e.headword = p.headword
                       and e.reading is not distinct from p.reading limit 1)),
          'pair'
     from pairs p
     left join public.learning_lexemes l on l.id = p.lexeme
    limit p_limit)
  union all
  (select m.headword, m.reading, m.gloss, 'shared_char'
     from mine m, target t
    where exists (select 1 from unnest(t.chars) c where strpos(m.headword, c) > 0)
    order by random() limit p_limit)
  union all
  (select m.headword, m.reading, m.gloss, 'same_sound'
     from mine m, target t
    where t.plain is not null and public.dict_pinyin_plain(m.reading) = t.plain
    order by random() limit p_limit)
  union all
  (select e.headword, e.reading, public.dict_first_russian(e.compact), 'homophone'
     from public.dictionary_entries e, target t
    where t.plain is not null
      and e.reading_plain = t.plain
      and e.headword <> t.h
      and char_length(e.headword) = t.len
      and public.dict_has_russian(e.compact)
    order by e.hsk_level nulls last, random() limit p_limit)
  union all
  (select e.headword, e.reading, public.dict_first_russian(e.compact), 'form'
     from public.dictionary_entries e, target t
    where e.hsk_level is not null
      and e.headword <> t.h
      and char_length(e.headword) = t.len
      and exists (select 1 from unnest(t.chars) c where strpos(e.headword, c) > 0)
    order by random() limit p_limit)
  union all
  (select m.headword, m.reading, m.gloss, 'user'
     from mine m
    order by random() limit p_limit)
  union all
  (select e.headword, e.reading, public.dict_first_russian(e.compact), 'level'
     from public.dictionary_entries e, target t
    where e.hsk_level = coalesce(p_hsk, 1)
      and e.headword <> t.h
      and char_length(e.headword) = t.len
    order by random() limit p_limit)
$$;

revoke execute on function public.learning_distractor_pool(uuid, text, text, smallint, integer)
  from public, anon, authenticated;
grant execute on function public.learning_distractor_pool(uuid, text, text, smallint, integer)
  to service_role;

comment on function public.learning_distractor_pool(uuid, text, text, smallint, integer) is
  'Кандидаты в неверные варианты по источникам (#62). Выбор — в distractors.ts. Только service_role.';
