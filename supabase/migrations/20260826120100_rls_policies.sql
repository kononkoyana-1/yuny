-- Row Level Security (TZ.md §5 "Права клиента").
--
-- Default posture: the client may SELECT its own rows and nothing else.
-- Every write goes through an Edge Function running with the service role,
-- which bypasses RLS. Two deliberate exceptions, both from §5:
--   * `profiles`           - SELECT + UPDATE own row;
--   * `assessment_answers` - INSERT own raw answers (no scoring involved).
-- `auth.uid()` is wrapped in a scalar subselect so Postgres evaluates it once
-- per statement instead of once per row.

alter table public.profiles             enable row level security;
alter table public.goals                enable row level security;
alter table public.goal_outcomes        enable row level security;
alter table public.learning_states      enable row level security;
alter table public.skill_states         enable row level security;
alter table public.missions             enable row level security;
alter table public.activities           enable row level security;
alter table public.activity_responses   enable row level security;
alter table public.feedback             enable row level security;
alter table public.evidence             enable row level security;
alter table public.recommendations      enable row level security;
alter table public.materials            enable row level security;
alter table public.public_resources     enable row level security;
alter table public.mascot_states        enable row level security;
alter table public.jobs                 enable row level security;
alter table public.events               enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_answers   enable row level security;
alter table public.assessment_results   enable row level security;

-- ------------------------------------------------------------- profiles

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ------------------------------------------------ read-own domain tables

create policy "goals: read own"
  on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "goal_outcomes: read own"
  on public.goal_outcomes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "learning_states: read own"
  on public.learning_states for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "skill_states: read own"
  on public.skill_states for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "missions: read own"
  on public.missions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "activities: read own"
  on public.activities for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "feedback: read own"
  on public.feedback for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "evidence: read own"
  on public.evidence for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "recommendations: read own"
  on public.recommendations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "materials: read own"
  on public.materials for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "mascot_states: read own"
  on public.mascot_states for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "jobs: read own"
  on public.jobs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "assessment_results: read own"
  on public.assessment_results for select to authenticated
  using ((select auth.uid()) = user_id);

-- --------------------------------------------------------- assessment RW

create policy "assessment_answers: read own"
  on public.assessment_answers for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "assessment_answers: insert own"
  on public.assessment_answers for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------ public catalogue

create policy "public_resources: read all"
  on public.public_resources for select to authenticated
  using (true);

-- --------------------------------------------------------- server-only
-- `activity_responses`, `events`, and `assessment_questions` intentionally
-- have RLS enabled and zero policies: unreachable for `anon`/`authenticated`,
-- fully available to the service role used by Edge Functions.
-- `correct_index` must never be readable by a client, so the grant is
-- revoked too - belt and braces on top of the empty policy set.
revoke all on public.assessment_questions from anon, authenticated;
revoke all on public.activity_responses   from anon, authenticated;
revoke all on public.events               from anon, authenticated;
