-- Слова из файла прямо в свой словарь (редакция 2026-09-23: Главная скрыта,
-- загрузка файла нужна только ради слов).
--
-- 1. Новый вид фоновой задачи — `words_extract` (`supabase/functions/words-extract`).
--    Модуль при этом не создаётся.
-- 2. У слова в папке появляется свой перевод. Если в файле рядом со словом был
--    написан перевод, он и показывается в папке первым: так ученик видит то,
--    что учил, а полная статья БКРС остаётся по нажатию. Слова, которых нет в
--    словаре, сохраняются с переводом из файла или от модели — у них другого
--    и нет. Слово, добавленное из поиска по словарю, перевода не несёт: у него
--    есть статья.
-- 3. Уникальность слова в папке — обычным ограничением с `nulls not distinct`
--    вместо индекса по `coalesce(reading, '')`. Смысл тот же, но на такое
--    ограничение может опереться `on conflict`: список слов из файла
--    сохраняется одной вставкой, и слова, уже лежащие в папке, пропускаются,
--    а не роняют всю вставку.

alter type public.job_kind add value if not exists 'words_extract';

alter table public.user_dictionary_items
  add column translation text
    constraint user_dictionary_items_translation_len
    check (translation is null or char_length(translation) between 1 and 300);

drop index public.user_dictionary_items_folder_word_key;
alter table public.user_dictionary_items
  add constraint user_dictionary_items_folder_word_key
  unique nulls not distinct (folder_id, headword, reading);
