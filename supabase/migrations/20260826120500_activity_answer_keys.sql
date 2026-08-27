-- Answer keys live outside `activities` because the client has SELECT on
-- `activities` and must never receive the key (TZ.md §3 Rule 1 - scoring is
-- server-side only). RLS on, zero policies: service role only.
create table public.activity_answer_keys (
  activity_id uuid        primary key references public.activities (id) on delete cascade,
  key         jsonb       not null,
  created_at  timestamptz not null default now()
);

alter table public.activity_answer_keys enable row level security;
revoke all on public.activity_answer_keys from anon, authenticated;
