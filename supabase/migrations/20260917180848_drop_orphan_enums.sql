-- Типы пережили свои таблицы: `drop table` их не уносит, и после сброса в
-- схеме остались висеть девять enum'ов прежнего продукта — cefr_level,
-- mission_status, skill, mascot_mood и остальные. Ни один из них не
-- используется ни в одной колонке.
drop type if exists public.activity_status;
drop type if exists public.activity_type;
drop type if exists public.cefr_level;
drop type if exists public.evidence_strength;
drop type if exists public.goal_status;
drop type if exists public.mascot_mood;
drop type if exists public.mission_status;
drop type if exists public.skill;
drop type if exists public.skill_trend;

-- Остаются: job_kind, job_status, material_kind, material_status.
