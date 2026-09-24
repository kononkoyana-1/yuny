-- Изучение слов (#61): запись одного ответа — одной транзакцией.
--
-- `review-submit` решает, что меняется (чистая функция `planSubmit`), и
-- отдаёт план сюда: навыки, пары путаницы и строка журнала пишутся вместе
-- или не пишутся вовсе. Вызывает только сервер (service_role).
--
-- Повтор того же запроса (`request_id`) ничего не меняет и возвращает
-- `duplicate`. Два разных ответа по одному слову наперегонки: навык пишется,
-- только если `reps` в базе тот же, что видел сервер, иначе ошибка 40001 —
-- функция перечитывает и считает заново.
--
-- p = {
--   user_id, request_id, session_id, lexeme_id, skill, exercise, prompt,
--   options, expected, answer, outcome, partner, latency_ms, rating,
--   r_before, s_before, s_after, d_before, d_after, device,
--   event_pair_id,          -- пара события, если уже известна
--   event_pair_write,       -- или индекс в pairs
--   skills: [{ skill, reps_before, stability, difficulty, last_review, due,
--              reps, lapses, contexts_passed, unlocked_at }],
--   pairs:  [{ id, headword_a, reading_a, headword_b, reading_b, lexeme_a,
--              lexeme_b, inc_ab, inc_ba, confused_at, set_state, status,
--              stability, difficulty, last_review, due, resolve_streak }]
-- }
-- → { duplicate, pair_ids }

create function public.learning_apply_review(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid       uuid := (p->>'user_id')::uuid;
  s         jsonb;
  pr        jsonb;
  pair_ids  uuid[] := '{}';
  pid       uuid;
  event_pid uuid;
  n         integer;
begin
  if exists (select 1 from public.review_events
              where user_id = uid and request_id = (p->>'request_id')::uuid) then
    return jsonb_build_object('duplicate', true, 'pair_ids', '[]'::jsonb);
  end if;

  -- Навыки: вставка новой строки или обновление при неизменном reps.
  for s in select * from jsonb_array_elements(coalesce(p->'skills', '[]'::jsonb)) loop
    if s->'reps_before' is null or jsonb_typeof(s->'reps_before') = 'null' then
      insert into public.skill_states
        (lexeme_id, user_id, skill, stability, difficulty, last_review, due, reps, lapses,
         contexts_passed, unlocked_at)
      values ((p->>'lexeme_id')::uuid, uid, s->>'skill', (s->>'stability')::real,
              (s->>'difficulty')::real, (s->>'last_review')::timestamptz, (s->>'due')::timestamptz,
              (s->>'reps')::integer, (s->>'lapses')::integer, (s->>'contexts_passed')::integer,
              (s->>'unlocked_at')::timestamptz)
      on conflict (lexeme_id, skill) do nothing;
    else
      update public.skill_states
         set stability       = (s->>'stability')::real,
             difficulty      = (s->>'difficulty')::real,
             last_review     = (s->>'last_review')::timestamptz,
             due             = (s->>'due')::timestamptz,
             reps            = (s->>'reps')::integer,
             lapses          = (s->>'lapses')::integer,
             contexts_passed = (s->>'contexts_passed')::integer
       where lexeme_id = (p->>'lexeme_id')::uuid
         and user_id = uid
         and skill = s->>'skill'
         and reps = (s->>'reps_before')::integer;
    end if;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'stale skill state' using errcode = '40001';
    end if;
  end loop;

  -- Пары: счётчики путаницы прибавляются, память и статус — если set_state.
  for pr in select * from jsonb_array_elements(coalesce(p->'pairs', '[]'::jsonb)) loop
    insert into public.confusion_pairs as c
      (user_id, headword_a, reading_a, headword_b, reading_b, lexeme_a, lexeme_b,
       count_ab, count_ba, last_confused_at, status, stability, difficulty, last_review, due,
       resolve_streak, resolved_at)
    values (uid, pr->>'headword_a', pr->>'reading_a', pr->>'headword_b', pr->>'reading_b',
            (pr->>'lexeme_a')::uuid, (pr->>'lexeme_b')::uuid,
            (pr->>'inc_ab')::integer, (pr->>'inc_ba')::integer, (pr->>'confused_at')::timestamptz,
            case when (pr->>'set_state')::boolean then pr->>'status' else 'pending' end,
            case when (pr->>'set_state')::boolean then (pr->>'stability')::real end,
            case when (pr->>'set_state')::boolean then (pr->>'difficulty')::real end,
            case when (pr->>'set_state')::boolean then (pr->>'last_review')::timestamptz end,
            case when (pr->>'set_state')::boolean then (pr->>'due')::timestamptz end,
            case when (pr->>'set_state')::boolean then (pr->>'resolve_streak')::smallint else 0 end,
            case when (pr->>'set_state')::boolean and pr->>'status' = 'resolved' then now() end)
    on conflict on constraint confusion_pairs_user_pair_key do update
       set count_ab         = c.count_ab + excluded.count_ab,
           count_ba         = c.count_ba + excluded.count_ba,
           last_confused_at = coalesce(excluded.last_confused_at, c.last_confused_at),
           lexeme_a         = coalesce(c.lexeme_a, excluded.lexeme_a),
           lexeme_b         = coalesce(c.lexeme_b, excluded.lexeme_b),
           status           = case when (pr->>'set_state')::boolean then excluded.status else c.status end,
           stability        = case when (pr->>'set_state')::boolean then excluded.stability else c.stability end,
           difficulty       = case when (pr->>'set_state')::boolean then excluded.difficulty else c.difficulty end,
           last_review      = case when (pr->>'set_state')::boolean then excluded.last_review else c.last_review end,
           due              = case when (pr->>'set_state')::boolean then excluded.due else c.due end,
           resolve_streak   = case when (pr->>'set_state')::boolean then excluded.resolve_streak else c.resolve_streak end,
           resolved_at      = case when (pr->>'set_state')::boolean
                                   then case when excluded.status = 'resolved'
                                             then coalesce(c.resolved_at, now()) end
                                   else c.resolved_at end
    returning c.id into pid;
    pair_ids := pair_ids || pid;
  end loop;

  event_pid := coalesce(
    (p->>'event_pair_id')::uuid,
    case when p->'event_pair_write' is not null and jsonb_typeof(p->'event_pair_write') = 'number'
         then pair_ids[(p->>'event_pair_write')::integer + 1] end);

  -- Последним: гонка двух одинаковых запросов упадёт здесь на уникальном
  -- ключе, и вся транзакция откатится.
  insert into public.review_events
    (user_id, session_id, request_id, lexeme_id, pair_id, skill, exercise, prompt, options,
     expected, answer, outcome, partner, latency_ms, rating, r_before, s_before, s_after,
     d_before, d_after, device)
  values (uid, (p->>'session_id')::uuid, (p->>'request_id')::uuid, (p->>'lexeme_id')::uuid,
          event_pid, p->>'skill', p->>'exercise', coalesce(p->'prompt', '{}'::jsonb),
          case when jsonb_typeof(p->'options') = 'array'
               then array(select jsonb_array_elements_text(p->'options')) end,
          p->>'expected', p->>'answer', p->>'outcome', p->>'partner',
          (p->>'latency_ms')::integer, (p->>'rating')::smallint, (p->>'r_before')::real,
          (p->>'s_before')::real, (p->>'s_after')::real, (p->>'d_before')::real,
          (p->>'d_after')::real, p->>'device');

  return jsonb_build_object('duplicate', false, 'pair_ids', to_jsonb(pair_ids));
end;
$$;

revoke execute on function public.learning_apply_review(jsonb) from public, anon, authenticated;
grant execute on function public.learning_apply_review(jsonb) to service_role;

comment on function public.learning_apply_review(jsonb) is
  'Запись одного ответа (#61): навыки, пары путаницы, журнал — одной транзакцией. Только service_role.';
