-- Content taxonomy: CEFR levels and canonical topics.
--
-- Pulled forward from what `docs/plan-tasks.md` called stage 3, because
-- stage 2 (tagging chapters by level and topic) cannot run before the
-- columns it writes to exist. The rest of the stage-3 migration (goals,
-- learning_states, roadmap_modules, evidence, assessment_sessions) stays
-- where it is — this file is only what tagging needs.
--
-- Design note, and the whole point of `topics` being its own table: topics
-- are CANONICAL and source-independent. If a topic were just a column on
-- content_units, "transport" would mean "chapters 4-6 of book 1" and a
-- roadmap built from it would be a table of contents wearing a costume —
-- exactly the failure already fixed once in mission-generate. A shared
-- vocabulary lets one module draw material from several books.

create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- Nullable: a unit is untagged until someone (or the pipeline) judges it,
-- and an untagged unit must not silently read as A1.
alter table public.content_units
  add column cefr_level public.cefr_level;

create index content_units_cefr_level_idx on public.content_units (cefr_level);

create table public.topics (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  label       text        not null,
  -- Coarse grouping for presentation only; module ordering is decided by
  -- goal relevance and level, never by this.
  category    text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Many-to-many on purpose: a chapter about buying fruit at a market teaches
-- both food and shopping, and a roadmap module for either should be able to
-- reach it.
create table public.content_unit_topics (
  content_unit_id uuid not null references public.content_units (id) on delete cascade,
  topic_id        uuid not null references public.topics (id)        on delete cascade,
  primary key (content_unit_id, topic_id)
);
create index content_unit_topics_topic_idx on public.content_unit_topics (topic_id);

-- Same posture as the rest of the content pipeline: RLS on, no policies,
-- service role only. There is no client-facing topic browser, and adding one
-- would be a product decision (TZ.md §7 rejects a lesson catalogue), not a
-- side effect of this migration.
alter table public.topics              enable row level security;
alter table public.content_unit_topics enable row level security;
revoke all on public.topics              from anon, authenticated;
revoke all on public.content_unit_topics from anon, authenticated;

create trigger topics_touch before update on public.topics
  for each row execute function public.touch_updated_at();
