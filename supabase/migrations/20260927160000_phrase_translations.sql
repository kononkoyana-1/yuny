-- Перевод фразы в поиске (#76): общий кэш на всех пользователей по
-- нормализованному тексту и направлению. created_by — чей запрос создал
-- запись: по нему лимит новых переводов на пользователя в час (кэш — без лимита).

create table public.phrase_translations (
  id          uuid        primary key default gen_random_uuid(),
  text_norm   text        not null check (char_length(text_norm) between 1 and 200),
  direction   text        not null constraint phrase_translations_direction check (direction in ('zh-ru', 'ru-zh')),
  translation text        not null check (char_length(translation) between 1 and 400),
  model       text,
  created_by  uuid        references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint phrase_translations_key unique (text_norm, direction)
);

create index phrase_translations_created_by_idx on public.phrase_translations (created_by, created_at);

-- Только сервер: клиенту перевод приходит из `phrase-translate`.
alter table public.phrase_translations enable row level security;
revoke all on public.phrase_translations from anon, authenticated;

comment on table public.phrase_translations is
  'Перевод фраз из поиска, общий кэш (#76). Пишет только phrase-translate.';
