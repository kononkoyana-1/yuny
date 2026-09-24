-- Имя в профиле — от 1 до 40 символов без крайних пробелов (#40, настройки).
--
-- Экран настроек проверяет длину сам, но клиентская проверка не защищает от
-- прямого запроса к PostgREST: клиент пишет `profiles` напрямую под RLS.
-- `not valid` — старые строки не проверяются: имена из входа через Google
-- могли прийти длиннее. Новые записи и правки — проверяются.
alter table public.profiles
  add constraint profiles_display_name_len
  check (char_length(btrim(display_name)) between 1 and 40) not valid;
