/**
 * Задание для клиента и его билет (#63): форма — exercise.design.md §1,
 * схема — `packages/shared/schemas/study.ts`. Чистые функции: варианты уже
 * выбраны (`pickOptions`), здесь — тексты, ключ, подписи тона и разбор.
 */
import type { ExerciseCode } from "./config.ts";
import type { Collocation, ContrastBody } from "./contrast.ts";
import { type ContextSentence, sentenceTiles } from "./context.ts";
import type { Classified, OptionMeta, WordKey } from "./classify.ts";
import { type Candidate, type OptionKind, pickOptions, synonym } from "./distractors.ts";
import { type HanziMap, wordDifference } from "./hanzi.ts";
import { formatPinyin, normalizePinyin, parsePinyin, type Syllable } from "./pinyin.ts";
import type { Ticket, TicketExercise } from "./ticket.ts";

export type RenderCode = "intro" | "R1" | "R2" | "P1" | "P2" | "W1" | "W2" | "C1" | "C2" | "pair_card";

export interface StudyWord extends WordKey {
  lexemeId: string | null;
  translation: string | null;
}

export interface ExerciseBody {
  code: RenderCode;
  lexeme: { headword: string; reading: string | null; tone_label: string | null; translation: string | null } | null;
  options?: { id: string; text: string; kind: "ru" | "pinyin" | "hanzi"; a11y: string }[];
  /** C1 — предложение с пропуском; C2 — только перевод (фраза собирается из плиток). */
  sentence?: { tokens: string[]; blank_index: number | null; ru: string; pinyin?: string };
  tiles?: { id: string; text: string }[];
  intro?: {
    /** Пример из проверенного кэша (#64); нет покрытого предложения — `null`. */
    example: { zh: string; pinyin: string; ru: string } | null;
    char_notes: CharNote[];
    actions: IntroActions;
  };
  pair?: {
    a: PairSide;
    b: PairSide;
    difference: string | null;
    mnemonic: string | null;
    collocations: [string, string] | null;
    collocation_notes: [Collocation, Collocation] | null;
  };
  /** C2: `tokens` — порядок из предложения, `orders` — все допустимые (он первый). */
  key?: { option_id?: string; pinyin?: string; tokens?: string[]; orders?: string[][] };
  is_retry: boolean;
  /** Трудная проверка «Уже знаю» — у клиента чип «Проверка». */
  is_check: boolean;
}

/** «Понятно»; «Запомню» / «Уже знаю»; одна «Запомню» — после проваленной проверки. */
export type IntroActions = "ok" | "know_or_remember" | "remember";

interface PairSide {
  headword: string;
  reading: string | null;
  tone_label: string | null;
  meaning: string | null;
}

/** Билет без полей, которые знает только вызывающий (кто, сессия, срок). */
export type TicketBody = Omit<Ticket, "v" | "uid" | "session_id" | "exp">;

export interface Built {
  body: ExerciseBody;
  ticket: TicketBody;
}

// ------------------------------------------------------------------ тоны

const TONE_SHORT = ["1-й", "2-й", "3-й", "4-й", "лёгкий"];
const TONE_SPOKEN = ["первый тон", "второй тон", "третий тон", "четвёртый тон", "лёгкий тон"];

/** «3-й тон»; у многосложного — по слогам: «4-й + лёгкий». */
export function toneLabel(reading: string | null): string | null {
  const syl = reading ? parsePinyin(reading) : null;
  if (!syl) return null;
  if (syl.length === 1) return syl[0].tone === 5 ? "лёгкий тон" : `${TONE_SHORT[syl[0].tone - 1]} тон`;
  return syl.map((s) => TONE_SHORT[s.tone - 1]).join(" + ");
}

/** Для диктора: «mǎi, третий тон»; многосложное — по слогам. */
export function pinyinA11y(reading: string): string {
  const syl = parsePinyin(reading);
  if (!syl) return reading;
  return syl.map((s: Syllable) => `${formatPinyin([s])}, ${TONE_SPOKEN[s.tone - 1]}`).join("; ");
}

const firstGloss = (g: string | null) => (g ? g.split(";")[0].trim() : null);

// --------------------------------------------------------------- задания

function lexemeOf(w: StudyWord) {
  return { headword: w.headword, reading: w.reading, tone_label: toneLabel(w.reading), translation: firstGloss(w.translation) };
}

const KIND: Record<OptionKind, "ru" | "pinyin" | "hanzi"> = { meaning: "ru", pinyin: "pinyin", hanzi: "hanzi" };

function choiceOptions(kind: OptionKind, opts: OptionMeta[]) {
  return opts.map((o, i) => ({
    id: `o${i}`,
    text: o.value,
    kind: KIND[kind],
    a11y: kind === "pinyin" ? pinyinA11y(o.value) : o.value,
  }));
}

/** Статья словаря с заголовком из одного знака (`dictionary_entries`). */
export interface CharEntry {
  headword: string;
  /** Как в словаре: «hǎo, hào» — несколько чтений в одной статье. */
  reading: string | null;
  compact: string[];
  senses?: { nest: string | null; gloss: string; header?: boolean | string }[];
}

/** Заметка о знаке в знакомстве (#88): чтение в этом слове, значение, слова пользователя с этим знаком. */
export interface CharNote {
  char: string;
  reading: string | null;
  meaning: string | null;
  known_in: WordKey[];
}

const HAN = /\p{Script=Han}/u;
const RUSSIAN = /[А-Яа-яЁё]/;
const isHeader = (s: { header?: boolean | string }) => s.header === true || s.header === "true";

/** Одно чтение → слог; «hǎo, hào» → два слога. Многосложное и не-пиньинь пропускаются. */
function entrySyllables(reading: string | null): Syllable[] {
  return (reading ?? "").split(/[,;]/).map((r) => parsePinyin(r)).filter((s) => s?.length === 1).map((s) => s![0]);
}

/** Слог знака в этом слове; `null`, если чтение не делится по знакам (нет чтения, латиница, эр). */
function syllableAt(headword: string, reading: string | null, index: number): Syllable | null {
  const chars = [...headword];
  const syl = reading ? parsePinyin(reading) : null;
  if (!syl || syl.length !== chars.length || !chars.every((c) => HAN.test(c))) return null;
  return syl[index] ?? null;
}

/**
 * Статья и чтение знака в этом слове. Слог слова ищется среди чтений статей:
 * сперва с тем же тоном, потом без тона (服 в 衣服 yīfu — лёгкий тон, в
 * словаре fú). Слога нет — годится только однозначная статья с одним чтением.
 */
function matchEntry(entries: CharEntry[], s: Syllable | null): { entry: CharEntry; syllable: Syllable } | null {
  if (!s) {
    const only = entries.length === 1 ? entrySyllables(entries[0].reading) : [];
    return only.length === 1 ? { entry: entries[0], syllable: only[0] } : null;
  }
  for (const exact of [true, false]) {
    for (const entry of entries) {
      const hit = entrySyllables(entry.reading).find((x) => x.base === s.base && (!exact || x.tone === s.tone));
      if (hit) return { entry, syllable: hit };
    }
  }
  return null;
}

/**
 * Значение знака для этого чтения. У статьи с несколькими чтениями гнёзда
 * подписаны слогом («гл. hào») — берём первое русское значение нужного
 * гнезда; без подписей — `compact`, только если чтение первое в статье
 * (короткий список начинается с него). Нет русского — `null`: не выдумываем.
 */
function meaningFor(entry: CharEntry, syllable: Syllable): string | null {
  const readings = entrySyllables(entry.reading);
  const same = (x: Syllable) => x.base === syllable.base && x.tone === syllable.tone;
  if (readings.length > 1) {
    const senses = entry.senses ?? [];
    const nests = new Set(
      senses.filter((h) => isHeader(h) && h.gloss.split(/[\s,;]+/).some((w) => {
        const p = parsePinyin(w);
        return p?.length === 1 && same(p[0]);
      })).map((h) => h.nest),
    );
    if (nests.size > 0) {
      return senses.find((x) => !isHeader(x) && nests.has(x.nest) && RUSSIAN.test(x.gloss))?.gloss ?? null;
    }
    if (!same(readings[0])) return null;
  }
  return entry.compact.find((c) => RUSSIAN.test(c)) ??
    entry.senses?.find((x) => !isHeader(x) && RUSSIAN.test(x.gloss))?.gloss ?? null;
}

/**
 * Знаки слова (#88): чтение знака в этом слове, значение из статьи этого
 * знака и другие слова пользователя с ним («服 fú — одежда · уже есть в ваших
 * словах: 衣服 yīfu»). Статьи нет — чтение из самого слова, значения нет.
 */
export function charNotes(word: WordKey, own: WordKey[], entries: CharEntry[] = []): CharNote[] {
  const chars = [...word.headword];
  return [...new Set(chars.filter((c) => HAN.test(c)))].map((char) => {
    const s = syllableAt(word.headword, word.reading, chars.indexOf(char));
    const hit = matchEntry(entries.filter((e) => e.headword === char), s);
    const known = new Map<string, WordKey>();
    for (const w of own) {
      if (w.headword !== word.headword && w.headword.includes(char) && !known.has(w.headword)) known.set(w.headword, w);
    }
    return {
      char,
      reading: hit ? formatPinyin([hit.syllable]) : s ? formatPinyin([s]) : null,
      meaning: hit ? meaningFor(hit.entry, hit.syllable) : null,
      known_in: [...known.values()].slice(0, 3).map((w) => ({ headword: w.headword, reading: w.reading })),
    };
  });
}

export interface BuildInput {
  code: TicketExercise | "pair_card";
  word: StudyWord;
  /** Кандидаты в варианты (`learning_distractor_pool`). */
  candidates: Candidate[];
  /** Первый круг раунда: слова этого раунда в варианты не брать. */
  exclude?: string[];
  seed: number;
  retry?: boolean;
  check?: "known";
  pairId?: string | null;
  /** Для знакомства: слова пользователя и статьи знаков слова. */
  ownWords?: WordKey[];
  charEntries?: CharEntry[];
  /** Кнопки знакомства; по умолчанию «Запомню» / «Уже знаю». */
  introActions?: IntroActions;
  /** Задание на пару: рендерер обычный, в память — как X*. */
  render?: RenderCode;
  /**
   * Предложение из кэша (#64), уже проверенное на покрытие: для C1, C2 и
   * примера в знакомстве.
   */
  sentence?: ContextSentence | null;
}

function rngOf(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Плитки C2 вперемешку: порядок не совпадает ни с одним допустимым, иначе
 * фраза собрана заранее. Все перестановки допустимы (два слова местами) —
 * `null`.
 */
export function shuffleTiles(tiles: string[], orders: string[][], seed: number): string[] | null {
  const rand = rngOf(seed);
  const same = (xs: string[]) => orders.some((o) => o.join("\u0000") === xs.join("\u0000"));
  for (let attempt = 0; attempt < 12; attempt++) {
    const out = [...tiles];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (!same(out)) return out;
  }
  const reversed = [...tiles].reverse();
  return same(reversed) ? null : reversed;
}

/** Задание по коду; `null` — вариантов не хватило, нужен другой формат. */
export function buildExercise(input: BuildInput): Built | null {
  const { word, code } = input;
  const base = { is_retry: !!input.retry, is_check: input.check === "known" };
  const ticket = (exercise: TicketExercise, expected: string, options?: OptionMeta[]): TicketBody => ({
    exercise,
    lexeme_id: word.lexemeId,
    pair_id: input.pairId ?? null,
    target: { headword: word.headword, reading: word.reading },
    options,
    expected,
    ...(input.retry ? { retry: true } : {}),
    ...(input.check ? { check: input.check } : {}),
  });
  const choice = (render: RenderCode, kind: OptionKind, count: number, memory: TicketExercise): Built | null => {
    const opts = pickOptions({
      kind,
      target: { headword: word.headword, reading: word.reading, gloss: word.translation },
      candidates: input.candidates,
      count,
      exclude: input.exclude,
      seed: input.seed,
    });
    if (!opts) return null;
    const right = opts.findIndex((o) => o.headword === word.headword && o.reading === word.reading);
    return {
      body: { ...base, code: render, lexeme: lexemeOf(word), options: choiceOptions(kind, opts), key: { option_id: `o${right}` } },
      ticket: ticket(memory, opts[right].value, opts),
    };
  };

  switch (code) {
    case "intro":
      return {
        body: {
          ...base,
          code: "intro",
          lexeme: lexemeOf(word),
          intro: {
            example: input.sentence
              ? { zh: input.sentence.zh, pinyin: input.sentence.pinyin, ru: input.sentence.ru }
              : null,
            char_notes: charNotes(word, input.ownWords ?? [], input.charEntries),
            actions: input.introActions ?? "know_or_remember",
          },
        },
        ticket: ticket("intro", firstGloss(word.translation) ?? word.headword),
      };
    case "R1":
      return choice("R1", "meaning", 3, "R1");
    case "P1":
      return word.reading ? choice("P1", "pinyin", 3, "P1") : null;
    case "W1":
      return choice("W1", "hanzi", 5, "W1");
    case "W2":
      return choice("W2", "hanzi", 5, "W2");
    case "R2":
      return {
        body: { ...base, code: "R2", lexeme: lexemeOf(word) },
        ticket: ticket("R2", [firstGloss(word.translation), word.reading].filter(Boolean).join(" · ")),
      };
    case "P2": {
      const key = word.reading ? normalizePinyin(word.reading) : null;
      if (!key) return null;
      return {
        body: { ...base, code: "P2", lexeme: lexemeOf(word), key: { pinyin: key } },
        ticket: ticket("P2", word.reading!),
      };
    }
    case "C1": {
      // Пропуск с выбором: варианты — знаки (как в W*), но не слова самой
      // фразы и не синонимы: второй верный ответ в пропуск встал бы тоже.
      const s = input.sentence;
      if (!s) return null;
      const inSentence = new Set(s.tokens);
      const candidates = input.candidates.filter((c) =>
        !inSentence.has(c.headword) && !(c.gloss && word.translation && synonym(c.gloss.split(";")[0], word.translation))
      );
      const opts = pickOptions({
        kind: "hanzi",
        target: { headword: word.headword, reading: word.reading, gloss: word.translation },
        candidates,
        count: 3,
        exclude: input.exclude,
        seed: input.seed,
      });
      if (!opts) return null;
      const right = opts.findIndex((o) => o.headword === word.headword && o.reading === word.reading);
      return {
        body: {
          ...base,
          code: "C1",
          lexeme: lexemeOf(word),
          // Пиньинь фразы не показываем: в нём чтение пропущенного слова.
          sentence: { tokens: s.tokens, blank_index: s.targetIndex, ru: s.ru },
          options: choiceOptions("hanzi", opts),
          key: { option_id: `o${right}` },
        },
        ticket: {
          ...ticket("C1", opts[right].value, opts),
          ...(s.id ? { context_id: s.id } : {}),
          prompt: { zh: s.zh, ru: s.ru },
        },
      };
    }
    case "C2": {
      // Сборка фразы: плитки — слова без пунктуации; верны порядок фразы и
      // допустимые порядки от генератора.
      const s = input.sentence;
      if (!s || s.tier !== "T2") return null;
      const tiles = sentenceTiles(s);
      if (tiles.length < 3) return null;
      const orders = [tiles, ...s.altOrders];
      const shown = shuffleTiles(tiles, orders, input.seed);
      if (!shown) return null;
      return {
        body: {
          ...base,
          code: "C2",
          lexeme: lexemeOf(word),
          sentence: { tokens: [], blank_index: null, ru: s.ru },
          tiles: shown.map((text, i) => ({ id: `t${i}`, text })),
          key: { tokens: tiles, orders },
        },
        ticket: {
          ...ticket("C2", s.zh),
          expected_orders: orders,
          tiles: shown,
          ...(s.id ? { context_id: s.id } : {}),
          prompt: { zh: s.zh, ru: s.ru },
        },
      };
    }
    case "X1":
      return choice(input.render ?? "R1", "meaning", 3, "X1");
    case "X2":
      return choice(input.render ?? "W2", "hanzi", 5, "X2");
    default:
      return null;
  }
}

/** Лёгкий формат того же навыка — для повтора после ошибки и когда трудный не собрать. */
export function easierCode(code: ExerciseCode | "intro"): ExerciseCode | null {
  const m: Partial<Record<string, ExerciseCode>> = {
    R2: "R1",
    P2: "P1",
    W2: "W1",
    R1: "R1",
    P1: "P1",
    W1: "W1",
    C2: "C1",
    C1: "C1",
  };
  return m[code] ?? null;
}

/** Замена, если вариантов не хватило: без вариантов тот же навык. */
export function withoutOptions(code: ExerciseCode): ExerciseCode | null {
  const m: Partial<Record<string, ExerciseCode>> = { R1: "R2", P1: "P2" };
  return m[code] ?? null;
}

const NO_CHARS: HanziMap = new Map();

/**
 * Карточка «Разберём пару». Коллокации — из проверенного кэша (`contrast`, #71);
 * строка различия «卖 = 十 + 买» и подсказка — кодом из данных о знаках
 * (`chars`, #74); нет данных — `null`.
 */
export function buildPairCard(
  a: StudyWord,
  b: StudyWord,
  pairId: string,
  contrast: ContrastBody | null = null,
  chars: HanziMap = NO_CHARS,
): Built {
  const { difference, mnemonic } = wordDifference(a, b, chars);
  const side = (w: StudyWord): PairSide => ({
    headword: w.headword,
    reading: w.reading,
    tone_label: toneLabel(w.reading),
    meaning: firstGloss(w.translation),
  });
  return {
    body: {
      code: "pair_card",
      lexeme: null,
      pair: {
        a: side(a),
        b: side(b),
        difference,
        mnemonic,
        collocations: contrast ? [contrast.collocations[0].zh, contrast.collocations[1].zh] : null,
        collocation_notes: contrast ? contrast.collocations : null,
      },
      is_retry: false,
      is_check: false,
    },
    ticket: {
      exercise: "intro",
      lexeme_id: null,
      pair_id: pairId,
      target: { headword: a.headword, reading: a.reading },
      expected: `${a.headword} · ${b.headword}`,
    },
  };
}

// ---------------------------------------------------------------- разбор

export type ResultOutcome = "correct" | "partial" | "wrong" | "seen";

export function resultOutcome(c: Classified): ResultOutcome {
  if (c.outcome === "seen") return "seen";
  if (c.outcome === "ok") return c.grade?.kind === "error" ? "partial" : "correct";
  return c.outcome === "tone" ? "partial" : "wrong";
}

/**
 * Строки разбора: тёплые, без кодов ошибок (TZ §14). Что именно не так и
 * как отличить; «вы ошиблись» не пишем — это и так видно по цвету.
 */
export function explanation(
  c: Classified,
  target: StudyWord,
  partnerMeaning: string | null,
): string[] {
  const reading = target.reading ?? "";
  const meaning = firstGloss(target.translation);
  switch (c.outcome) {
    case "tone":
      return [`Слог верный, тон другой: ${reading} — ${toneLabel(reading) ?? ""}.`.replace(" — .", ".")];
    case "syllable":
      return reading ? [`${target.headword} читается ${reading}.`] : [];
    case "confusion":
    case "homophone":
    case "form_similar": {
      if (!c.partner) break;
      const p = c.partner;
      const lines = [
        `${target.headword} ${reading} — «${meaning ?? "?"}», а ${p.headword} ${p.reading ?? ""} — «${partnerMeaning ?? "?"}».`
          .replace(/\s+—/g, " —"),
      ];
      if (c.outcome === "homophone") lines.push("Звучат похоже — различаются тоном и знаком.");
      if (c.outcome === "form_similar") lines.push("Знаки похожи — присмотритесь к различию.");
      return lines;
    }
    case "blank":
    case "wrong":
      return meaning ? [`${target.headword}${reading ? ` ${reading}` : ""} — «${meaning}».`] : [];
  }
  if (c.grade?.kind === "error" && c.grade.error === "second_try") return ["Верно со второй попытки — слово вернётся пораньше."];
  return [];
}
