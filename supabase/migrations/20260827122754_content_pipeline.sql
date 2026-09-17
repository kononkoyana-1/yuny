-- Content pipeline (open educational resources → generated exercises).
--
-- Pipeline: Source → Raw Content → Parsed Content → Structured Knowledge →
-- Exercises. Deliberately NOT wired to `materials` (learner-uploaded Library
-- items, per-user) or `activities` (per-learner Mission instances) — this is
-- curated reference content, admin-imported, with no client exposure yet
-- (all four tables: RLS on, zero policies, service role only — same pattern
-- already used for `assessment_questions`/`activity_answer_keys`).
--
-- Provenance is structural, not denormalized: every knowledge_item points at
-- the content_unit it came from, every generated_exercise points at the
-- knowledge_item it came from. A single join answers "where in the source
-- did this come from" for anything the pipeline produces.

create table public.content_sources (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  author         text        not null,
  source_url     text        not null unique,
  license        text        not null,
  license_url    text,
  -- Which adapter knows how to fetch+parse this source. Adding a second
  -- Pressbooks book needs zero code — just another row with a different
  -- `parser_config.book_slug`. A genuinely new platform needs one new
  -- adapter function, not a schema change.
  parser         text        not null,
  parser_config  jsonb       not null default '{}'::jsonb,
  status         text        not null default 'registered'
                   check (status in ('registered', 'processing', 'ready', 'failed')),
  status_error   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One row per structural unit of a source (chapter / front-matter /
-- back-matter). Raw and parsed forms live as separate columns on the same
-- row rather than separate tables — at this scale (tens to low hundreds of
-- units per source) that is simpler than a join and still keeps "raw" and
-- "processed" cleanly distinct.
create table public.content_units (
  id              uuid        primary key default gen_random_uuid(),
  source_id       uuid        not null references public.content_sources (id) on delete cascade,
  -- The source platform's own id/slug for this unit — the re-import key.
  external_id     text        not null,
  kind            text        not null check (kind in ('front-matter', 'chapter', 'back-matter')),
  part_title      text,
  title           text        not null,
  position        integer     not null default 0,
  unit_url        text,
  -- Raw Content.
  raw_html        text,
  raw_fetched_at  timestamptz,
  -- Parsed Content: array of { type: 'heading'|'paragraph'|'exercise', level?, text }.
  parsed_blocks   jsonb,
  parsed_at       timestamptz,
  word_count      integer,
  status          text        not null default 'fetched'
                    check (status in ('fetched', 'parsed', 'failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source_id, external_id)
);
create index content_units_source_id_idx on public.content_units (source_id, position);

-- Structured Knowledge: vocabulary / grammar / topic / example, one table
-- for all four kinds rather than four tables — a new kind needs a new
-- `kind` value, not a migration.
create table public.knowledge_items (
  id              uuid        primary key default gen_random_uuid(),
  content_unit_id uuid        not null references public.content_units (id) on delete cascade,
  kind            text        not null check (kind in ('vocabulary', 'grammar', 'topic', 'example')),
  -- Normalized identity for idempotent re-extraction (e.g. lower(trim(word))).
  dedup_key       text        not null,
  data            jsonb       not null,
  -- source_derived: pulled verbatim from the unit's own text, nothing
  -- invented. ai_generated: the model inferred or authored it (a written
  -- definition, a composed example). TZ.md §3 Rule 1's spirit applied to
  -- content, not just scoring: never let generated material pass as quoted.
  origin          text        not null check (origin in ('source_derived', 'ai_generated')),
  status          text        not null default 'draft' check (status in ('draft', 'validated')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (content_unit_id, kind, dedup_key)
);
create index knowledge_items_unit_kind_idx on public.knowledge_items (content_unit_id, kind);

-- Exercises generated from one knowledge item. Deliberately not `activities`
-- — these are unassigned drafts with no learner, no mission, no position in
-- a Mission flow. Wiring a validated exercise into a real Mission is a
-- later, separate decision (TZ.md §9's registry), not this pipeline's job.
create table public.generated_exercises (
  id                uuid        primary key default gen_random_uuid(),
  knowledge_item_id uuid        not null references public.knowledge_items (id) on delete cascade,
  type              text        not null check (type in ('multiple_choice', 'fill_blank')),
  payload           jsonb       not null,
  status            text        not null default 'draft' check (status in ('draft', 'validated')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (knowledge_item_id, type)
);

alter table public.content_sources     enable row level security;
alter table public.content_units       enable row level security;
alter table public.knowledge_items     enable row level security;
alter table public.generated_exercises enable row level security;

-- No client UI yet (this phase is pipeline-only) — service role only,
-- matching the existing zero-policy pattern.
revoke all on public.content_sources     from anon, authenticated;
revoke all on public.content_units       from anon, authenticated;
revoke all on public.knowledge_items     from anon, authenticated;
revoke all on public.generated_exercises from anon, authenticated;

create trigger content_sources_touch     before update on public.content_sources     for each row execute function public.touch_updated_at();
create trigger content_units_touch       before update on public.content_units       for each row execute function public.touch_updated_at();
create trigger knowledge_items_touch     before update on public.knowledge_items     for each row execute function public.touch_updated_at();
create trigger generated_exercises_touch before update on public.generated_exercises for each row execute function public.touch_updated_at();
