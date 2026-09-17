-- Which topics a goal actually asked for.
--
-- The roadmap deliberately never records this, and that is the gap this table
-- closes. `rankTopics` is handed only the topics that already have reviewed
-- material at the learner's bands — the model "is never asked what content
-- ought to exist, which is how a map ends up promising a module with nothing
-- behind it" (_shared/roadmap.ts). Correct for building a route, and it means
-- a learner who needed "at a restaurant" at B1 and found nothing leaves no
-- trace anywhere: the route is silently one module shorter and the system
-- never learns that the topic was wanted.
--
-- `analyzeGoal` already produces exactly that list, filtered down to canonical
-- slugs, and then drops it into the job payload where nothing reads it. This
-- table is where it lands instead, so "what should we author next" becomes a
-- query over real demand rather than a guess over the taxonomy.
--
-- Deliberately NOT a queue and NOT a status: nothing here says whether the
-- content was ever written. It is a record of what was asked for; what exists
-- is counted from `knowledge_items` at report time, so the two can never
-- drift out of step.

create table public.goal_topics (
  goal_id    uuid        not null references public.goals (id)  on delete cascade,
  topic_id   uuid        not null references public.topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, topic_id)
);

create index goal_topics_topic_idx on public.goal_topics (topic_id);

-- The band the demand is for is the goal's own `required_cefr`, joined at
-- report time rather than copied here: one fact, one place. A goal's required
-- level is decided once by `goal-analyze` and never rewritten, so the join is
-- as stable as a copy would have been and cannot disagree with the goal row.

-- Same posture as the content taxonomy: RLS on, no policies, service role
-- only. No client feature reads this — it exists for authoring decisions, and
-- exposing "topics we have nothing for" to the app would be a product choice,
-- not a side effect of this migration.
alter table public.goal_topics enable row level security;
revoke all on public.goal_topics from anon, authenticated;
