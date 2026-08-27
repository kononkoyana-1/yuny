-- Phase 5: "One Mission = one textbook chapter". A single nullable FK is
-- the whole schema change needed to connect a Mission to the content
-- pipeline (TZ.md-external task's own wording: "Connect the Mission to the
-- existing processed content"). Nullable so AI-generated missions from
-- `mission-generate` are unaffected; the partial unique index makes seeding
-- idempotent per (goal, chapter) without a new table.
alter table public.missions
  add column content_unit_id uuid references public.content_units (id) on delete set null;

create unique index missions_goal_content_unit_idx
  on public.missions (goal_id, content_unit_id)
  where content_unit_id is not null;
