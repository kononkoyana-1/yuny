-- Stage 3: CEFR on the learner side, the roadmap, and the two links the
-- personalised-lesson design needs (docs/onboarding-v2.md §3).
--
-- The taxonomy half of stage 3 (cefr_level enum, topics, content_unit_topics,
-- content_units.cefr_level) already shipped in 20260828120000, and the
-- assessment-bank half in 20260828130000. This is the remainder.

-- ------------------------------------------------------------------ goals
--
-- Two different things, deliberately kept apart: what the learner claims
-- about themselves, and what the goal actually demands. Onboarding screen 03
-- writes the first; `goal-analyze` decides the second (TZ.md §3 Rule 1 - the
-- client never derives a language requirement).
alter table public.goals
  add column declared_cefr public.cefr_level,
  add column required_cefr public.cefr_level;

-- ---------------------------------------------------------- learning state
--
-- What the assessment concluded, and how much weight that conclusion carries.
-- Confidence matters: a verdict from four questions and a verdict from
-- fifteen are not the same claim, and the roadmap should be able to tell.
alter table public.learning_states
  add column assessed_cefr   public.cefr_level,
  add column cefr_confidence numeric(4, 3) check (cefr_confidence between 0 and 1);

-- --------------------------------------------------------- roadmap modules
--
-- Generated per goal, not global: a roadmap for "travel around Europe" and
-- one for "work in an international company" must not be the same list in a
-- different order. `topic_id` is nullable so a foundation module (which
-- teaches basics rather than a theme) still fits the table.
create table public.roadmap_modules (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id)   on delete cascade,
  goal_id     uuid        not null references public.goals (id) on delete cascade,
  topic_id    uuid                 references public.topics (id) on delete set null,
  position    integer     not null,
  title       text        not null,
  why         text        not null,
  target_cefr public.cefr_level not null,
  kind        text        not null default 'topic'
                check (kind in ('foundation', 'topic')),
  status      text        not null default 'locked'
                check (status in ('locked', 'available', 'in_progress', 'completed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (goal_id, position)
);
create index roadmap_modules_goal_status_idx on public.roadmap_modules (goal_id, status);

-- A mission belongs to at most one module. Nullable because missions predate
-- the roadmap and `mission-generate` can still produce one without it.
alter table public.missions
  add column roadmap_module_id uuid references public.roadmap_modules (id) on delete set null;
create index missions_roadmap_module_idx on public.missions (roadmap_module_id);

-- -------------------------------------------------------------- evidence
--
-- Without this column "the lesson includes what you got wrong" is not
-- implementable: evidence records that the learner is weak at vocabulary,
-- but not that they are weak at the word "departure". Nullable because
-- evidence from open-ended work has no single knowledge item behind it.
alter table public.evidence
  add column knowledge_item_id uuid references public.knowledge_items (id) on delete set null;
create index evidence_knowledge_item_idx on public.evidence (knowledge_item_id);

-- ----------------------------------------------------- assessment sessions
--
-- The adaptive ladder's state lives here rather than in client state: which
-- band to serve next is an educational decision, and TZ.md §3 Rule 1 keeps
-- those on the server. It also survives the learner closing the app midway.
create table public.assessment_sessions (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id)   on delete cascade,
  goal_id        uuid        not null references public.goals (id) on delete cascade,
  declared_cefr  public.cefr_level not null,
  current_cefr   public.cefr_level not null,
  served_count   integer     not null default 0,
  budget_seconds integer     not null default 600,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  status         text        not null default 'active'
                   check (status in ('active', 'complete', 'abandoned')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index assessment_sessions_goal_status_idx on public.assessment_sessions (goal_id, status);

-- ------------------------------------------------------------------- RLS
--
-- Same posture as every other domain table: read your own rows, write only
-- through an Edge Function with the service role (TZ.md §5, §3 Rule 3).
alter table public.roadmap_modules     enable row level security;
alter table public.assessment_sessions enable row level security;

create policy "roadmap_modules: read own"
  on public.roadmap_modules for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "assessment_sessions: read own"
  on public.assessment_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create trigger roadmap_modules_touch     before update on public.roadmap_modules
  for each row execute function public.touch_updated_at();
create trigger assessment_sessions_touch before update on public.assessment_sessions
  for each row execute function public.touch_updated_at();
