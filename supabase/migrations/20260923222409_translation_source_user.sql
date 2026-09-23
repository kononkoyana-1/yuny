-- Ещё один источник значения слова в папке: `user` — перевод, который ученик
-- поправил сам в списке слов из файла (решение владельца, 2026-09-23). Статья
-- подписывает его «Ваш перевод».

alter table public.user_dictionary_items
  drop constraint user_dictionary_items_translation_source_kind;
alter table public.user_dictionary_items
  add constraint user_dictionary_items_translation_source_kind
  check (translation_source in ('file', 'dictionary', 'ai', 'user'));
