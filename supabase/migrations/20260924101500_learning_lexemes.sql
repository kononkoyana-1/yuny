-- Изучение слов (#57, #58): память — у слова, а не у строки в папке.
--
-- Одно слово может лежать в трёх папках — это три строки
-- `user_dictionary_items`, а помнит его человек одинаково. Поэтому слово
-- ученика — отдельная строка `learning_lexemes` (одна на пользователя,
-- заголовок и чтение), и строки папок ссылаются на неё. Память по навыкам —
-- `skill_states`, настройки ежедневных повторений — `learning_settings`.
-- Модель — docs/learning/vocabulary-engine.md, раздел 1 и приложение A.
--
-- Кто что пишет:
--   * лексему создаёт триггер, когда слово кладут в папку, — клиенту не нужно
--     о ней знать; клиент может поменять только `goal` («только читать»);
--   * `skill_states` пишет только сервер (Edge Function `review-submit`,
--     #61) — клиенту память не доверяем;
--   * `learning_settings` клиент пишет сам: это выбор человека, а не
--     учебное состояние.
--
-- Слово убрали из последней папки — лексема и её память остаются: вернут
-- слово в словарь — продолжит с того же места, а журнал ответов (#59) не
-- теряет ссылку. В повторения попадают только лексемы, у которых есть хотя
-- бы одна строка в папке.

-- ------------------------------------------------------------- лексемы

create table public.learning_lexemes (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users (id) on delete cascade,
  headword            text        not null check (char_length(headword) between 1 and 64),
  reading             text,
  dictionary_entry_id bigint      references public.dictionary_entries (id) on delete set null,
  -- Смысл, в котором слово учится: перевод из последней строки папки, у
  -- которой он есть. По нему генерируется контекст (#64).
  translation         text
    constraint learning_lexemes_translation_len
    check (translation is null or char_length(translation) between 1 and 300),
  -- `read_only` — навык «Пишу» не открывается (раздел 1 модели).
  goal                text        not null default 'full'
    constraint learning_lexemes_goal_kind check (goal in ('full', 'read_only')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint learning_lexemes_user_word_key unique nulls not distinct (user_id, headword, reading),
  unique (id, user_id)
);

create trigger learning_lexemes_touch before update on public.learning_lexemes
  for each row execute function public.touch_updated_at();

-- Перенос: лексема на каждое уже сохранённое слово. Перевод — из самой
-- свежей строки, где он есть; статья — любая непустая.
insert into public.learning_lexemes (user_id, headword, reading, dictionary_entry_id, translation, created_at)
select i.user_id,
       i.headword,
       i.reading,
       (array_agg(i.dictionary_entry_id order by i.created_at desc)
          filter (where i.dictionary_entry_id is not null))[1],
       (array_agg(i.translation order by i.created_at desc)
          filter (where i.translation is not null))[1],
       min(i.created_at)
  from public.user_dictionary_items i
 group by i.user_id, i.headword, i.reading;

alter table public.user_dictionary_items add column lexeme_id uuid;

update public.user_dictionary_items i
   set lexeme_id = l.id
  from public.learning_lexemes l
 where l.user_id = i.user_id
   and l.headword = i.headword
   and l.reading is not distinct from i.reading;

alter table public.user_dictionary_items
  alter column lexeme_id set not null,
  add constraint user_dictionary_items_lexeme_fk
    foreign key (lexeme_id, user_id)
    references public.learning_lexemes (id, user_id) on delete cascade;

create index user_dictionary_items_lexeme_idx on public.user_dictionary_items (lexeme_id);

-- Слово кладут в папку (или меняют ему заголовок, чтение, перевод) —
-- находим или создаём лексему. Владелец берётся из строки папки: его уже
-- проверил RLS `user_dictionary_items`. `security definer` — потому что
-- клиенту писать в `learning_lexemes` напрямую нельзя.
create function public.user_dictionary_item_lexeme()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learning_lexemes as l (user_id, headword, reading, dictionary_entry_id, translation)
  values (new.user_id, new.headword, new.reading, new.dictionary_entry_id, new.translation)
  on conflict on constraint learning_lexemes_user_word_key do update
     set translation         = coalesce(excluded.translation, l.translation),
         dictionary_entry_id = coalesce(l.dictionary_entry_id, excluded.dictionary_entry_id)
  returning l.id into new.lexeme_id;
  return new;
end;
$$;

revoke execute on function public.user_dictionary_item_lexeme() from public, anon, authenticated;

create trigger user_dictionary_items_lexeme
  before insert or update of headword, reading, translation, dictionary_entry_id
  on public.user_dictionary_items
  for each row execute function public.user_dictionary_item_lexeme();

alter table public.learning_lexemes enable row level security;

create policy "learning_lexemes: read own" on public.learning_lexemes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "learning_lexemes: update own" on public.learning_lexemes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Из всей строки клиент меняет только цель.
revoke insert, update, delete on public.learning_lexemes from anon, authenticated;
grant update (goal) on public.learning_lexemes to authenticated;

-- ------------------------------------------------------- память по навыкам

-- Строки нет — навык ещё не открыт. Числа — модель FSRS: `stability` — через
-- сколько дней вероятность вспомнить падает до 90%, `difficulty` — 1..10.
create table public.skill_states (
  lexeme_id       uuid        not null,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  skill           text        not null
    constraint skill_states_skill_kind check (skill in ('read', 'pinyin', 'write', 'use')),
  stability       real        not null check (stability > 0),
  difficulty      real        not null check (difficulty between 1 and 10),
  last_review     timestamptz,
  due             timestamptz not null,
  reps            integer     not null default 0 check (reps >= 0),
  lapses          integer     not null default 0 check (lapses >= 0),
  -- Для «Использую»: в скольких разных предложениях навык подтверждён.
  contexts_passed integer     not null default 0 check (contexts_passed >= 0),
  unlocked_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (lexeme_id, skill),
  foreign key (lexeme_id, user_id)
    references public.learning_lexemes (id, user_id) on delete cascade
);

create index skill_states_user_due_idx on public.skill_states (user_id, due);

create trigger skill_states_touch before update on public.skill_states
  for each row execute function public.touch_updated_at();

alter table public.skill_states enable row level security;

create policy "skill_states: read own" on public.skill_states
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.skill_states from anon, authenticated;

-- ---------------------------------------------------- настройки повторений

-- Строки нет — действуют значения по умолчанию. Клиент создаёт её сам при
-- первом выборе в окне «Повторим?».
create table public.learning_settings (
  user_id         uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  -- Минуты на «Сегодня»: последний выбор в окне «Повторим?», по умолчанию 10.
  session_minutes smallint    not null default 10
    constraint learning_settings_session_minutes check (session_minutes in (5, 10, 15)),
  -- Потолок новых слов в день; реальная квота ниже, если завтра много повторений.
  max_new         smallint    not null default 8 check (max_new between 0 and 30),
  -- Цель удержания FSRS.
  retention       real        not null default 0.90 check (retention between 0.80 and 0.95),
  -- День (по часам пользователя), когда окно «Повторим?» уже показывали.
  last_prompt_on  date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger learning_settings_touch before update on public.learning_settings
  for each row execute function public.touch_updated_at();

alter table public.learning_settings enable row level security;

create policy "learning_settings: read own" on public.learning_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "learning_settings: insert own" on public.learning_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "learning_settings: update own" on public.learning_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.learning_lexemes is
  'Слово ученика: одна строка на заголовок и чтение, сколько бы папок его ни держало. Память — в skill_states.';
comment on table public.skill_states is
  'Память по навыкам слова (FSRS). Пишет только сервер; строки нет — навык не открыт.';
comment on table public.learning_settings is
  'Настройки ежедневных повторений: минуты «Сегодня», потолок новых слов, цель удержания.';
