-- Разовая починка слов, уже сохранённых с переводом не по-русски.
--
-- До исправления `words-extract` (перевод из файла засчитывается, только если
-- он по-русски) слова из китайско-английского учебника легли в папки с
-- английским переводом — баг с живого сайта, 2026-09-23. Таким словам, у
-- которых есть статья БКРС, ставим короткое значение статьи — то же, что
-- предлагает словарь при загрузке: первые три значения через «; », не длиннее
-- колонки. Слова без статьи не трогаем: русского значения для них в базе нет,
-- лучше английский перевод, чем никакого.

update public.user_dictionary_items i
   set translation = left(array_to_string(e.compact[1:3], '; '), 300),
       translation_source = 'dictionary'
  from public.dictionary_entries e
 where e.id = i.dictionary_entry_id
   and i.translation is not null
   and i.translation !~ '[А-Яа-яЁё]'
   and cardinality(e.compact) > 0
   and array_to_string(e.compact[1:3], '; ') <> '';
