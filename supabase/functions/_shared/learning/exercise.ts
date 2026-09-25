/**
 * Задание для клиента и его билет (#63): форма — exercise.design.md §1,
 * схема — `packages/shared/schemas/study.ts`. Чистые функции: варианты уже
 * выбраны (`pickOptions`), здесь — тексты, ключ, подписи тона и разбор.
 */
import type { ExerciseCode } from "./config.ts";
import type { Classified, OptionMeta, WordKey } from "./classify.ts";
import { type Candidate, type OptionKind, pickOptions } from "./distractors.ts";
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
  intro?: {
    example: null;
    char_notes: { char: string; known_in: string[] }[];
    actions: "ok" | "know_or_remember";
  };
  pair?: {
    a: PairSide;
    b: PairSide;
    difference: string | null;
    mnemonic: string | null;
    collocations: [string, string] | null;
  };
  key?: { option_id?: string; pinyin?: string };
  is_retry: boolean;
}

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

/** Знаки слова и другие слова пользователя с ними («Знак 买 уже есть в ваших словах: 买东西»). */
export function charNotes(headword: string, own: string[]): { char: string; known_in: string[] }[] {
  return [...new Set(headword)].map((char) => ({
    char,
    known_in: own.filter((w) => w !== headword && w.includes(char)).slice(0, 3),
  }));
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
  /** Для знакомства: заголовки слов пользователя. */
  ownHeadwords?: string[];
  /** Задание на пару: рендерер обычный, в память — как X*. */
  render?: RenderCode;
}

/** Задание по коду; `null` — вариантов не хватило, нужен другой формат. */
export function buildExercise(input: BuildInput): Built | null {
  const { word, code } = input;
  const base = { is_retry: !!input.retry };
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
          intro: { example: null, char_notes: charNotes(word.headword, input.ownHeadwords ?? []), actions: "know_or_remember" },
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
  const m: Partial<Record<string, ExerciseCode>> = { R2: "R1", P2: "P1", W2: "W1", R1: "R1", P1: "P1", W1: "W1" };
  return m[code] ?? null;
}

/** Замена, если вариантов не хватило: без вариантов тот же навык. */
export function withoutOptions(code: ExerciseCode): ExerciseCode | null {
  const m: Partial<Record<string, ExerciseCode>> = { R1: "R2", P1: "P2" };
  return m[code] ?? null;
}

/** Карточка «Разберём пару». Различие и мнемоника — только проверенные (#71); пока `null`. */
export function buildPairCard(a: StudyWord, b: StudyWord, pairId: string): Built {
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
      pair: { a: side(a), b: side(b), difference: null, mnemonic: null, collocations: null },
      is_retry: false,
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
