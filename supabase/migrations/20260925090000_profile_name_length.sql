-- Имя в профиле — от 1 до 40 символов без крайних пробелов (#40, настройки).
--
-- Экран настроек проверяет длину сам, но клиентская проверка не защищает от
-- прямого запроса к PostgREST: клиент пишет `profiles` напрямую под RLS.
-- `not valid` — старые строки не проверяются: имена из входа через Google
-- могли прийти длиннее. Новые записи и правки — проверяются.
alter table public.profiles
  add constraint profiles_display_name_len
  check (char_length(btrim(display_name)) between 1 and 40) not valid;

-- Имя при регистрации приходит от провайдера входа (Google отдаёт полное
-- имя) и тоже обязано уложиться в 1–40 символов — иначе проверка выше
-- сорвала бы регистрацию. Пробелы по краям убираются, длинное имя
-- обрезается; пустое — «Ученик», как было.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    pg_catalog.left(
      coalesce(
        nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(pg_catalog.btrim(pg_catalog.split_part(coalesce(new.email, ''), '@', 1)), ''),
        'Ученик'
      ),
      40
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
