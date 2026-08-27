-- OAuth providers do not use our `display_name` metadata key: Google sends
-- `full_name`/`name`, Apple sends `full_name`. Without this, every social
-- signup landed on the "Learner" default.
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
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      -- Last resort: the local part of the email, never the whole address.
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Learner'
    )
  )
  on conflict (id) do nothing;

  insert into public.mascot_states (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Backfill the accounts that already landed on the default.
update public.profiles p
   set display_name = coalesce(
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         nullif(u.raw_user_meta_data ->> 'name', ''),
         p.display_name
       )
  from auth.users u
 where u.id = p.id
   and p.display_name = 'Learner';
