-- Предложения со словом (#64, vocabulary-engine.md §7): пишет ИИ, проверяет
-- код, хранятся один раз для всех пользователей. Под пользователя их
-- подбирает сервер при сборке занятия: берёт только те, где все слова кроме
-- целевого ему знакомы (`_shared/learning/context.ts`).
--
-- context_batches — заказ генерации на слово в одном смысле: занят (pending),
-- готов (ready) или не удался (failed, повтор не раньше чем через сутки).
-- `rounds` — сколько раз генерировали: если готовые предложения не подходят
-- пользователю по словам, заказывается ещё пачка с его знакомыми словами
-- (не больше трёх раз на слово).
--
-- context_sentences — проверенные предложения: нарезка на слова по словарю
-- (`tokens`), уровни HSK слов (`token_levels`, null — вне HSK, пунктуация
-- или само слово), место слова (`target_index`), другие допустимые порядки
-- плиток (`alt_orders`), самый высокий HSK среди остальных слов (`hsk_max`,
-- null — есть слово вне HSK). T1 — коллокация, T2 — простое предложение.

create table public.context_batches (
  id          uuid        primary key default gen_random_uuid(),
  headword    text        not null check (char_length(headword) between 1 and 64),
  reading     text,
  -- Смысл: первое значение перевода в нижнем регистре (`senseKey`); '' — перевода нет.
  sense_key   text        not null default '' check (char_length(sense_key) <= 80),
  status      text        not null default 'pending'
    constraint context_batches_status_kind check (status in ('pending', 'ready', 'failed')),
  rounds      smallint    not null default 1 check (rounds between 1 and 10),
  model       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint context_batches_word_key unique nulls not distinct (headword, reading, sense_key)
);

create trigger context_batches_touch before update on public.context_batches
  for each row execute function public.touch_updated_at();

create table public.context_sentences (
  id            uuid        primary key default gen_random_uuid(),
  batch_id      uuid        not null references public.context_batches (id) on delete cascade,
  headword      text        not null check (char_length(headword) between 1 and 64),
  reading       text,
  sense_key     text        not null default '',
  tier          text        not null constraint context_sentences_tier_kind check (tier in ('T1', 'T2')),
  zh            text        not null check (char_length(zh) between 2 and 40),
  pinyin        text        not null check (char_length(pinyin) between 1 and 200),
  ru            text        not null check (char_length(ru) between 1 and 140),
  tokens        text[]      not null,
  token_levels  smallint[]  not null,
  target_index  smallint    not null,
  alt_orders    jsonb       not null default '[]'::jsonb,
  hsk_max       smallint    check (hsk_max between 0 and 6),
  model         text,
  validated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint context_sentences_tokens_len check (cardinality(tokens) = cardinality(token_levels)),
  constraint context_sentences_target check (target_index >= 0 and target_index < cardinality(tokens)),
  constraint context_sentences_word_zh_key unique nulls not distinct (headword, reading, sense_key, zh)
);

create index context_sentences_word_idx on public.context_sentences (headword, reading, sense_key);
create index context_sentences_batch_idx on public.context_sentences (batch_id);

-- Только сервер: клиенту предложение приходит внутри задания (C1, C2, пример
-- в знакомстве).
alter table public.context_batches enable row level security;
alter table public.context_sentences enable row level security;
revoke all on public.context_batches from anon, authenticated;
revoke all on public.context_sentences from anon, authenticated;

-- Фоновая догенерация для слов пользователя — строкой в журнале задач.
alter type public.job_kind add value if not exists 'context_generate';

comment on table public.context_batches is
  'Заказы генерации предложений на слово в одном смысле (#64). Пишет только сервер.';
comment on table public.context_sentences is
  'Предложения со словом от ИИ, проверенные кодом; общий кэш на всех пользователей (#64). Пишет только сервер.';
