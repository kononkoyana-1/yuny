-- Assessment bank: CEFR band + provenance back to the knowledge item.
--
-- RECORDED AFTER THE FACT. These columns were applied straight to the project
-- while promoting exercises into the bank, and the migration file did not get
-- written at the time. That is the defect this file repairs: a schema change
-- that exists only in the database is invisible to every other developer, and
-- a parallel session went on to write the same two columns into its own
-- migration because nothing in the repository said they were taken.
--
-- Guarded with `if not exists` so it is safe to run against the project it was
-- extracted from as well as a clean database.
--
-- `cefr_level` is what makes the adaptive ladder implementable (see
-- docs/onboarding-v2.md §5): serving three questions at declared-1 / declared /
-- declared+1 requires knowing which band a question belongs to. `difficulty`
-- (1..5) is a neighbouring but different claim — how hard an item is *within*
-- its band — and the backfill below treats the two as aligned only because the
-- bank was authored that way from the start (1=A1 … 5=C1).

alter table public.assessment_questions
  add column if not exists cefr_level        public.cefr_level,
  add column if not exists knowledge_item_id uuid references public.knowledge_items (id) on delete set null;

update public.assessment_questions
set cefr_level = (array['A1','A2','B1','B2','C1']::public.cefr_level[])[difficulty]
where cefr_level is null and difficulty between 1 and 5;

create index if not exists assessment_questions_cefr_skill_idx
  on public.assessment_questions (language, cefr_level, skill);
