-- Откуда у слова в папке его значение (`translation`): написано в файле
-- (`file`), скопировано из статьи БКРС (`dictionary`) или дано моделью, потому
-- что слова нет в словаре (`ai`). Решение владельца от 2026-09-23: хранить
-- источник, чтобы статья честно подписывала перевод — «Перевод из файла»
-- и «Перевод ИИ» это разные обещания ученику.
--
-- `null` — у слов без значения и у сохранённых до этой миграции.

alter table public.user_dictionary_items
  add column translation_source text
    constraint user_dictionary_items_translation_source_kind
    check (translation_source in ('file', 'dictionary', 'ai'));
