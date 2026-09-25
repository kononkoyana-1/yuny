-- Данные о знаках (#74, docs/learning/data-sources.md, «Чего не хватает», п. 3):
-- число черт — для стартовой сложности слова, разбор на компоненты и
-- этимология — для строки «卖 = 十 + 买» и подсказки в карточке пары.
--
-- Источник — Make Me a Hanzi (github.com/skishore/makemeahanzi):
-- `dictionary.txt` (LGPL-3) — разбор IDS, ключ, этимология; `graphics.txt`
-- (Arphic Public License) — черты, отсюда их число. Заливает
-- `scripts/hanzi-import.mjs` (Actions → «Hanzi import»), только знаки,
-- которые встречаются в `dictionary_entries.headword`. Сырые файлы в
-- репозитории не лежат.
--
-- decomposition — IDS как в источнике: «⿱十买»; «？» — часть не определена.
-- components — знаки из разбора (один уровень, без «？»): {十,买}.
-- Этимология: тип ideographic / pictographic / pictophonetic; у
-- pictophonetic — смысловая (semantic) и звуковая (phonetic) части. Английские
-- `hint` источника не храним: подсказку по-русски строит код.

create table public.hanzi_chars (
  character          text        primary key check (char_length(character) = 1),
  stroke_count       smallint    check (stroke_count between 1 and 64),
  decomposition      text,
  radical            text,
  etymology_type     text
    constraint hanzi_chars_etymology_kind
      check (etymology_type in ('ideographic', 'pictographic', 'pictophonetic')),
  etymology_semantic text,
  etymology_phonetic text,
  components         text[]      not null default '{}',
  updated_at         timestamptz not null default now()
);

create trigger hanzi_chars_touch before update on public.hanzi_chars
  for each row execute function public.touch_updated_at();

-- Только сервер: клиенту разбор приходит внутри задания `pair_card`.
alter table public.hanzi_chars enable row level security;
revoke all on public.hanzi_chars from anon, authenticated;

comment on table public.hanzi_chars is
  'Знаки: число черт, разбор IDS, этимология (Make Me a Hanzi, LGPL-3 / Arphic, #74). Пишет только импорт.';
