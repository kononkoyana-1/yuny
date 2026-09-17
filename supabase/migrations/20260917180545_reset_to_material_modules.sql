-- Переход на новое ТЗ (редакция от 2026-09-17): приложение больше не ведёт
-- пользователя по цели и дорожной карте, а делает задания из его собственных
-- материалов. Всё, что обслуживало прежний продукт, уходит.
--
-- ВНИМАНИЕ: миграция необратима и удаляет пользовательские данные прежнего
-- продукта (цели, результаты теста, миссии, ответы). Применять сознательно.

-- 1. Триггер регистрации перестаёт заводить строку маскота: таблицы не будет.
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
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Ученик'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2. Домены прежнего продукта. Порядок не важен: cascade снимает зависимости,
--    но перечислено от листьев к корням, чтобы список читался как разбор.
drop table if exists public.activity_responses  cascade;
drop table if exists public.activity_answer_keys cascade;
drop table if exists public.activities          cascade;
drop table if exists public.missions            cascade;
drop table if exists public.evidence            cascade;
drop table if exists public.recommendations     cascade;
drop table if exists public.roadmap_modules     cascade;
drop table if exists public.assessment_answers  cascade;
drop table if exists public.assessment_questions cascade;
drop table if exists public.assessment_results  cascade;
drop table if exists public.assessment_sessions cascade;
drop table if exists public.goal_outcomes       cascade;
drop table if exists public.goal_topics         cascade;
drop table if exists public.goals               cascade;
drop table if exists public.skill_states        cascade;
drop table if exists public.learning_states     cascade;
drop table if exists public.mascot_states       cascade;

-- 3. Контентный пайплайн: открытые учебники, извлечённые единицы и упражнения.
drop table if exists public.generated_exercises cascade;
drop table if exists public.knowledge_items     cascade;
drop table if exists public.content_unit_topics cascade;
drop table if exists public.content_units       cascade;
drop table if exists public.content_sources     cascade;
drop table if exists public.public_resources    cascade;
drop table if exists public.topics              cascade;

-- 4. Профиль. Языковая пара зафиксирована (китайский из русского), выбирать
--    нечего — поля языков уходят. Уровень HSK приходит им на смену.
alter table public.profiles drop column if exists native_language;
alter table public.profiles drop column if exists ui_language;
alter table public.profiles
  add column if not exists hsk_level smallint
  check (hsk_level between 1 and 6);

comment on column public.profiles.hsk_level is
  'Уровень HSK 2.0, выбранный при первом входе. NULL = ещё не спрашивали.';

-- 5. Виды фоновых задач. Прежние пять описывали работу, которой больше нет;
--    строки с ними удаляются вместе с типом (в них нет ничего, что пережило
--    бы удаление своих таблиц).
delete from public.jobs
 where kind in ('goal_analyze', 'assessment_evaluate', 'mission_generate',
                'material_ingest', 'speaking_assess');

alter type public.job_kind rename to job_kind_old;
create type public.job_kind as enum ('module_parse', 'lesson_generate');
alter table public.jobs
  alter column kind type public.job_kind using kind::text::public.job_kind;
drop type public.job_kind_old;

-- Остаются: profiles, materials, jobs, events, feedback.
-- Таблицы нового продукта (modules, lessons, tasks, dictionary_entries,
-- hsk_words и остальные из TZ.md §12) приезжают своими миграциями в фазах 1-3.
