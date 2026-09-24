-- Изучение слов (#57, #59): журнал ответов и пары путаницы.
--
-- Журнал пишется сырым с первого дня: по нему потом дообучаются веса модели
-- памяти и проверяется гипотеза продукта, а задним числом его не собрать
-- (docs/learning/vocabulary-engine.md, разделы 4 и 10). Одна строка — один
-- ответ на одно упражнение, со всем, что было на экране, и с памятью до и
-- после.
--
-- Пара путаницы — отдельный объект со своим расписанием: пока 买 и 卖 не
-- различаются стабильно, интервалы обоих слов ограничены интервалом пары
-- (раздел 5). Партнёра может не быть в словаре пользователя (выбрал
-- вариант-дистрактор), поэтому стороны пары — заголовок и чтение, а ссылки на
-- лексемы — когда они есть.
--
-- Обе таблицы пишет только сервер (Edge Function `review-submit`, #61);
-- клиент читает своё.

-- ---------------------------------------------------------- пары путаницы

create table public.confusion_pairs (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  -- Стороны в каноническом порядке (A < B, см. ниже), чтобы у пары была одна строка.
  headword_a       text        not null check (char_length(headword_a) between 1 and 64),
  reading_a        text,
  headword_b       text        not null check (char_length(headword_b) between 1 and 64),
  reading_b        text,
  lexeme_a         uuid,
  lexeme_b         uuid,
  -- Сколько раз вместо A ответили B и наоборот.
  count_ab         integer     not null default 0 check (count_ab >= 0),
  count_ba         integer     not null default 0 check (count_ba >= 0),
  last_confused_at timestamptz,
  -- pending  — путаница замечена, порог интервенции не достигнут;
  -- active   — интервенция была, пара в расписании и ограничивает интервалы слов;
  -- watch    — пара держится (S ≥ 7), ограничение снято, проверки идут внутри обычных заданий;
  -- resolved — различается стабильно.
  status           text        not null default 'pending'
    constraint confusion_pairs_status_kind
    check (status in ('pending', 'active', 'watch', 'resolved')),
  -- Память пары — те же формулы, что у навыка; пусто до первой интервенции.
  stability        real        check (stability > 0),
  difficulty       real        check (difficulty between 1 and 10),
  last_review      timestamptz,
  due              timestamptz,
  -- Успешные различения подряд на растущих интервалах; 3 → resolved.
  resolve_streak   smallint    not null default 0 check (resolve_streak between 0 and 3),
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Порядок побайтовый (`collate "C"`), а не по локали базы: сервер ставит
  -- стороны в том же порядке простым сравнением строк по кодовым точкам.
  constraint confusion_pairs_canonical
    check ((headword_a collate "C", coalesce(reading_a, '') collate "C")
         < (headword_b collate "C", coalesce(reading_b, '') collate "C")),
  constraint confusion_pairs_user_pair_key
    unique nulls not distinct (user_id, headword_a, reading_a, headword_b, reading_b),
  constraint confusion_pairs_scheduled
    check (status = 'pending' or (stability is not null and difficulty is not null and due is not null)),
  foreign key (lexeme_a, user_id)
    references public.learning_lexemes (id, user_id) on delete set null (lexeme_a),
  foreign key (lexeme_b, user_id)
    references public.learning_lexemes (id, user_id) on delete set null (lexeme_b)
);

create index confusion_pairs_user_due_idx on public.confusion_pairs (user_id, due)
  where status in ('active', 'watch');
create index confusion_pairs_lexeme_a_idx on public.confusion_pairs (lexeme_a);
create index confusion_pairs_lexeme_b_idx on public.confusion_pairs (lexeme_b);

create trigger confusion_pairs_touch before update on public.confusion_pairs
  for each row execute function public.touch_updated_at();

alter table public.confusion_pairs enable row level security;

create policy "confusion_pairs: read own" on public.confusion_pairs
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.confusion_pairs from anon, authenticated;

-- --------------------------------------------------------- журнал ответов

create table public.review_events (
  id           bigint      generated always as identity primary key,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  -- Сессия «Сегодня» или раунд папки; клиент создаёт id при старте.
  session_id   uuid        not null,
  -- Ключ идемпотентности: повтор того же запроса (сеть) не засчитывается дважды.
  request_id   uuid        not null,
  lexeme_id    uuid,
  pair_id      uuid        references public.confusion_pairs (id) on delete cascade,
  -- Навык, память которого обновил ответ; пусто у заданий на пару.
  skill        text
    constraint review_events_skill_kind check (skill in ('read', 'pinyin', 'write', 'use')),
  -- Код упражнения из каталога (R1, P2, W1, C2, X2, intro…).
  exercise     text        not null check (char_length(exercise) between 1 and 16),
  -- Что было на экране: вопрос, предложение, подсказки.
  prompt       jsonb       not null default '{}'::jsonb,
  options      text[],
  expected     text,
  answer       text,
  outcome      text        not null
    constraint review_events_outcome_kind
    check (outcome in ('ok', 'blank', 'confusion', 'tone', 'syllable',
                       'form_similar', 'homophone', 'order', 'wrong', 'seen')),
  -- С каким словом спутали (заголовок), если outcome — путаница.
  partner      text,
  latency_ms   integer     check (latency_ms >= 0),
  -- 1 Again · 2 Hard · 3 Good · 4 Easy; пусто у неоценочных (знакомство).
  rating       smallint    check (rating between 1 and 4),
  -- Память до и после: без неё журнал не годится для дообучения модели.
  r_before     real        check (r_before between 0 and 1),
  s_before     real,
  s_after      real,
  d_before     real,
  d_after      real,
  device       text        check (char_length(device) <= 32),
  created_at   timestamptz not null default now(),
  constraint review_events_subject check (lexeme_id is not null or pair_id is not null),
  constraint review_events_request_key unique (user_id, request_id),
  foreign key (lexeme_id, user_id)
    references public.learning_lexemes (id, user_id) on delete cascade
);

create index review_events_user_created_idx on public.review_events (user_id, created_at desc);
create index review_events_lexeme_idx on public.review_events (lexeme_id, created_at desc);
create index review_events_pair_idx on public.review_events (pair_id) where pair_id is not null;

alter table public.review_events enable row level security;

create policy "review_events: read own" on public.review_events
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.review_events from anon, authenticated;

comment on table public.confusion_pairs is
  'Пары слов, которые пользователь путает. Своё расписание; пока пара active, интервалы обоих слов не растут дальше её. Пишет только сервер.';
comment on table public.review_events is
  'Журнал всех ответов в упражнениях: что показали, что ответили, тип ошибки, память до и после. Пишет только сервер.';
