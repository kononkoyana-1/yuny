-- Content provenance: which learning specification produced this row, and
-- which learning objective it serves (`docs/CONTENT_AGENTS.md` §5.5).
--
-- Why this is not optional bookkeeping. The pipeline's whole claim is a chain:
--
--   Goal → Skill → Learning Objective → Exercise → Assessment
--
-- In git that chain holds, because spec/draft/review share a slug. In the
-- database it breaks: nothing on `content_units`, `knowledge_items`,
-- `generated_exercises` or `assessment_questions` points back at the spec. The
-- practical cost is that an exercise already serving learners cannot be asked
-- what it was ever meant to test, and QA cannot re-check live material after a
-- specification changes. Two nullable text columns buy that back.
--
-- All nullable on purpose: the 103 Open Oregon chapters were imported before
-- any specification existed, and inventing one for them retroactively would be
-- a lie recorded as data.

alter table public.content_units
  add column if not exists spec_id text;

alter table public.knowledge_items
  add column if not exists objective_id text;

alter table public.generated_exercises
  add column if not exists objective_id text;

comment on column public.content_units.spec_id is
  'content/specs/<spec_id>.spec.json that produced this unit. Null for material imported before the content pipeline existed.';
comment on column public.knowledge_items.objective_id is
  'Learning Objective id within the spec of the owning content_unit. Null for pre-pipeline material.';
comment on column public.generated_exercises.objective_id is
  'Learning Objective this exercise assesses. Null for pre-pipeline material.';

create index if not exists content_units_spec_idx on public.content_units (spec_id) where spec_id is not null;

-- --------------------------------------------------- assessment questions
--
-- `cefr_level` and `knowledge_item_id` were originally declared here too, but
-- they had already been applied to the project by a parallel session and are
-- now recorded in 20260828130000_assessment_bank_level.sql, which runs first.
-- Re-declaring them made this file fail against the live database. Only the
-- provenance pair is left here, guarded the same way.

alter table public.assessment_questions
  add column if not exists spec_id      text,
  add column if not exists objective_id text;

-- Idempotent re-seeding needs a conflict target, and this table had none: every
-- re-run of a bank seed inserted duplicates. Two identical prompts in one
-- language is a defect in a measurement instrument regardless — an item that
-- appears twice in one session measures nothing and wastes a learner's budget.
-- If this fails to create, the bank already contains duplicates and they must
-- be resolved before the pipeline can own the table.
create unique index if not exists assessment_questions_language_prompt_key
  on public.assessment_questions (language, prompt);
