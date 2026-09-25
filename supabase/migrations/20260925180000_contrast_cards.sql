-- Контрастные карточки пар путаницы (#71, vocabulary-engine.md §5):
-- генерируются один раз на пару и кэшируются для всех пользователей.
-- Стороны — в том же каноническом порядке, что в `confusion_pairs`.
--
-- body (ready): { "collocations": [ { "zh", "pinyin", "ru" }, { … } ] } —
-- по одной коллокации на слово A и B, проверенные кодом (знак слова в
-- коллокации, чтение слова в её пиньине). failed — ИИ не дал годного
-- ответа; повтор генерации — не раньше чем через сутки.

create table public.contrast_cards (
  id          uuid        primary key default gen_random_uuid(),
  headword_a  text        not null check (char_length(headword_a) between 1 and 64),
  reading_a   text,
  headword_b  text        not null check (char_length(headword_b) between 1 and 64),
  reading_b   text,
  status      text        not null default 'pending'
    constraint contrast_cards_status_kind check (status in ('pending', 'ready', 'failed')),
  body        jsonb,
  model       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint contrast_cards_canonical
    check ((headword_a collate "C", coalesce(reading_a, '') collate "C")
         < (headword_b collate "C", coalesce(reading_b, '') collate "C")),
  constraint contrast_cards_pair_key
    unique nulls not distinct (headword_a, reading_a, headword_b, reading_b),
  constraint contrast_cards_ready_body check (status <> 'ready' or body is not null)
);

create trigger contrast_cards_touch before update on public.contrast_cards
  for each row execute function public.touch_updated_at();

-- Только сервер: клиенту карточка приходит внутри задания `pair_card`.
alter table public.contrast_cards enable row level security;
revoke all on public.contrast_cards from anon, authenticated;

comment on table public.contrast_cards is
  'Контрастные карточки пар путаницы, общий кэш на всех пользователей (#71). Пишет только сервер.';
