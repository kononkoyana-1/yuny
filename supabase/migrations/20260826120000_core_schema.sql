-- Yuny core schema (TZ.md §5 "Модель данных").
-- Every domain table carries `user_id` and has RLS enabled (see 20260826120100).
-- Writes are Edge-Function-only unless §5 grants the client a right explicitly.

-- ---------------------------------------------------------------- enums

create type public.goal_status       as enum ('draft', 'active', 'paused', 'completed');
create type public.skill             as enum ('speaking', 'listening', 'vocabulary', 'grammar', 'reading', 'writing');
create type public.skill_trend       as enum ('improving', 'stable', 'declining');
create type public.mission_status    as enum ('pending', 'active', 'completed', 'skipped');
create type public.activity_type     as enum (
  'vocabulary_choice', 'vocabulary_recall', 'grammar_practice', 'reading_comprehension',
  'listening_comprehension', 'speaking_response', 'speaking_roleplay', 'writing_response'
);
create type public.activity_status   as enum ('pending', 'in_progress', 'completed');
create type public.evidence_strength as enum ('weak', 'moderate', 'strong');
create type public.material_kind     as enum ('pdf', 'image', 'text', 'url');
create type public.material_status   as enum ('queued', 'processing', 'ready', 'failed');
create type public.job_kind          as enum ('goal_analyze', 'assessment_evaluate', 'mission_generate', 'material_ingest', 'speaking_assess');
create type public.job_status        as enum ('queued', 'running', 'done', 'failed');
create type public.mascot_mood       as enum ('neutral', 'thinking', 'celebrating', 'resting');

-- ------------------------------------------------------- shared triggers

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --------------------------------------------------------------- tables

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  native_language text        not null default 'en',
  ui_language     text        not null default 'en',
  display_name    text        not null default 'Learner',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.goals (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  raw_input        text        not null,
  title            text        not null,
  target_language  text        not null,
  deadline         date        not null,
  daily_minutes    integer     not null check (daily_minutes > 0 and daily_minutes <= 480),
  status           public.goal_status not null default 'draft',
  readiness_label  text,
  readiness_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index goals_user_id_status_idx on public.goals (user_id, status);
-- At most one active goal per user - `getActive()` must never be ambiguous.
create unique index goals_one_active_per_user_idx on public.goals (user_id) where status = 'active';

create table public.goal_outcomes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  goal_id     uuid        not null references public.goals (id) on delete cascade,
  label       text        not null,
  description text        not null,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique (goal_id, position)
);
create index goal_outcomes_goal_id_idx on public.goal_outcomes (goal_id);

create table public.learning_states (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  goal_id    uuid        not null unique references public.goals (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_states (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  learning_state_id uuid        not null references public.learning_states (id) on delete cascade,
  skill             public.skill not null,
  level             numeric(4, 3) not null check (level between 0 and 1),
  confidence        numeric(4, 3) not null check (confidence between 0 and 1),
  trend             public.skill_trend not null default 'stable',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (learning_state_id, skill)
);

create table public.missions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  goal_id           uuid        not null references public.goals (id) on delete cascade,
  title             text        not null,
  purpose           text        not null,
  why               text        not null,
  primary_skill     public.skill not null,
  estimated_minutes integer     not null check (estimated_minutes > 0),
  status            public.mission_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index missions_goal_id_status_idx on public.missions (goal_id, status);

create table public.activities (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  mission_id uuid        not null references public.missions (id) on delete cascade,
  type       public.activity_type not null,
  payload    jsonb       not null default '{}'::jsonb,
  position   integer     not null default 0,
  status     public.activity_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, position)
);
create index activities_mission_id_idx on public.activities (mission_id);

create table public.activity_responses (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  activity_id  uuid        not null references public.activities (id) on delete cascade,
  payload      jsonb       not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index activity_responses_activity_id_idx on public.activity_responses (activity_id);

create table public.feedback (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users (id) on delete cascade,
  activity_response_id uuid        not null unique references public.activity_responses (id) on delete cascade,
  went_well            text        not null,
  improve              text        not null,
  example              text,
  created_at           timestamptz not null default now()
);

create table public.evidence (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  goal_id     uuid        not null references public.goals (id) on delete cascade,
  activity_id uuid        references public.activities (id) on delete set null,
  skill       public.skill not null,
  strength    public.evidence_strength not null,
  payload     jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index evidence_goal_id_skill_idx on public.evidence (goal_id, skill);

create table public.recommendations (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  goal_id         uuid        not null references public.goals (id) on delete cascade,
  mission_id      uuid        references public.missions (id) on delete cascade,
  reason          text        not null,
  skills_affected public.skill[] not null default '{}',
  created_at      timestamptz not null default now()
);
create index recommendations_goal_id_created_at_idx on public.recommendations (goal_id, created_at desc);

create table public.materials (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  kind           public.material_kind not null,
  storage_path   text,
  source_url     text,
  title          text        not null,
  status         public.material_status not null default 'queued',
  extracted_text text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- A material is either a Storage object (pdf/image) or a remote/inline source.
  check (storage_path is not null or source_url is not null or extracted_text is not null)
);
create index materials_user_id_created_at_idx on public.materials (user_id, created_at desc);

-- Curated, non-user-owned catalogue (TZ.md §5 - "SELECT (публичные)").
create table public.public_resources (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  source_url  text        not null,
  description text        not null,
  skills      public.skill[] not null default '{}',
  language    text        not null,
  created_at  timestamptz not null default now()
);

create table public.mascot_states (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null unique references auth.users (id) on delete cascade,
  stage           smallint    not null default 1 check (stage between 1 and 5),
  mood            public.mascot_mood not null default 'neutral',
  growth_progress numeric(4, 3) not null default 0 check (growth_progress between 0 and 1),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Async job ledger (TZ.md §6 "Асинхронные операции"). Client subscribes via
-- Realtime and never polls.
create table public.jobs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  kind       public.job_kind not null,
  status     public.job_status not null default 'queued',
  input      jsonb       not null default '{}'::jsonb,
  result     jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_user_id_created_at_idx on public.jobs (user_id, created_at desc);

create table public.events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users (id) on delete cascade,
  name       text        not null,
  payload    jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_name_created_at_idx on public.events (name, created_at desc);

-- --------------------------------------------------- assessment (screen 06)
-- `correct_index` never leaves the server: the client has no SELECT right on
-- this table at all, questions are served by the `assessment-next` Edge
-- Function (TZ.md §3 Rule 1 - scoring is never client-side).
create table public.assessment_questions (
  id            uuid        primary key default gen_random_uuid(),
  language      text        not null,
  skill         public.skill not null,
  prompt        text        not null,
  options       text[]      not null check (array_length(options, 1) >= 2),
  correct_index integer     not null check (correct_index >= 0),
  difficulty    smallint    not null default 2 check (difficulty between 1 and 5),
  position      integer     not null default 0,
  created_at    timestamptz not null default now()
);
create index assessment_questions_language_position_idx on public.assessment_questions (language, position);

create table public.assessment_answers (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  goal_id        uuid        not null references public.goals (id) on delete cascade,
  question_id    uuid        not null references public.assessment_questions (id) on delete cascade,
  selected_index integer     not null check (selected_index >= 0),
  created_at     timestamptz not null default now(),
  unique (goal_id, question_id)
);

create table public.assessment_results (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  goal_id           uuid        not null references public.goals (id) on delete cascade,
  learning_state_id uuid        not null references public.learning_states (id) on delete cascade,
  stronger_skill    public.skill not null,
  needs_work_skill  public.skill not null,
  priority_label    text        not null,
  focus_areas       text[]      not null check (array_length(focus_areas, 1) >= 1),
  created_at        timestamptz not null default now()
);
create index assessment_results_goal_id_idx on public.assessment_results (goal_id, created_at desc);

-- ----------------------------------------------------- updated_at triggers

create trigger profiles_touch        before update on public.profiles        for each row execute function public.touch_updated_at();
create trigger goals_touch           before update on public.goals           for each row execute function public.touch_updated_at();
create trigger learning_states_touch before update on public.learning_states for each row execute function public.touch_updated_at();
create trigger skill_states_touch    before update on public.skill_states    for each row execute function public.touch_updated_at();
create trigger missions_touch        before update on public.missions        for each row execute function public.touch_updated_at();
create trigger activities_touch      before update on public.activities      for each row execute function public.touch_updated_at();
create trigger materials_touch       before update on public.materials       for each row execute function public.touch_updated_at();
create trigger mascot_states_touch   before update on public.mascot_states   for each row execute function public.touch_updated_at();
create trigger jobs_touch            before update on public.jobs            for each row execute function public.touch_updated_at();

-- A skill_state change must bump its parent learning_state (TZ.md §5 -
-- `learning_states.updated_at` is what the client renders as "last updated").
create or replace function public.touch_learning_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.learning_states
     set updated_at = now()
   where id = coalesce(new.learning_state_id, old.learning_state_id);
  return null;
end;
$$;

create trigger skill_states_touch_parent
after insert or update or delete on public.skill_states
for each row execute function public.touch_learning_state();

-- ------------------------------------------------- new-user provisioning
-- Every signup (including anonymous) gets a profile and a mascot, so the
-- client never has to handle "row does not exist yet".
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
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Learner')
  )
  on conflict (id) do nothing;

  insert into public.mascot_states (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
