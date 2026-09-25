/**
 * Данные о знаках (#74): строка разбора пары «卖 = 十 + 买» и подсказка к ней
 * — кодом из Make Me a Hanzi (`hanzi_chars`), без ИИ. Нет данных или разбор
 * неполный («？») — строки нет: ничего не придумываем (data-sources.md).
 */
import type { WordKey } from "./classify.ts";
import { parsePinyin, type Syllable } from "./pinyin.ts";

/** Строка `hanzi_chars`. */
export interface HanziChar {
  character: string;
  strokes: number | null;
  /** IDS: «⿱十买»; `null` — разбора нет. */
  decomposition: string | null;
  radical: string | null;
  etymology: {
    type: "ideographic" | "pictographic" | "pictophonetic";
    semantic: string | null;
    phonetic: string | null;
  } | null;
  /** Знаки из разбора, один уровень, без «？». */
  components: string[];
}

export type HanziMap = ReadonlyMap<string, HanziChar>;

// ------------------------------------------------------------------ IDS

/** Верхний уровень разбора: описатель и части (знак или вложенный IDS). */
interface IdsTop {
  op: string;
  parts: string[];
}

const IDC = /^[⿰-⿻]$/u;
const TERNARY = new Set(["⿲", "⿳"]);
const arity = (c: string) => (IDC.test(c) ? (TERNARY.has(c) ? 3 : 2) : 0);

/** Сколько символов занимает поддерево с позиции `i`; `-1` — IDS битый. */
function span(chars: string[], i: number): number {
  if (i >= chars.length) return -1;
  let len = 1;
  for (let k = 0; k < arity(chars[i]); k++) {
    const sub = span(chars, i + len);
    if (sub < 0) return -1;
    len += sub;
  }
  return len;
}

function top(ids: string | null): IdsTop | null {
  if (!ids) return null;
  const chars = [...ids];
  if (!arity(chars[0]) || span(chars, 0) !== chars.length) return null;
  const parts: string[] = [];
  for (let i = 1; i < chars.length;) {
    const len = span(chars, i);
    parts.push(chars.slice(i, i + len).join(""));
    i += len;
  }
  return { op: chars[0], parts };
}

// --------------------------------------------------------------- сравнение

/** Общие компоненты двух знаков (сам знак тоже в счёт: у 大 и 太 общий 大). */
export function sharedComponents(a: HanziChar | null | undefined, b: HanziChar | null | undefined): string[] {
  if (!a || !b || a.character === b.character) return [];
  const other = new Set([b.character, ...b.components]);
  return [a.character, ...a.components].filter((c, i, all) => other.has(c) && all.indexOf(c) === i);
}

export interface PairDifference {
  /** Знак, который собран из другого: 卖. */
  whole: string;
  /** Знак внутри него: 买. */
  part: string;
  /** Описатель IDS: ⿱. */
  op: string;
  /** Части в порядке разбора: [十, 买]. */
  parts: string[];
  /** Что добавлено к `part`: [十]. */
  added: string[];
  /** «卖 = 十 + 买». */
  formula: string;
}

function contains(whole: HanziChar, part: HanziChar): PairDifference | null {
  const t = top(whole.decomposition);
  if (!t) return null;
  // Только плоский разбор из знаков: вложенный IDS или «？» в строку не вынести.
  if (t.parts.some((p) => [...p].length !== 1 || p === "？")) return null;
  if (t.parts.filter((p) => p === part.character).length !== 1) return null;
  return {
    whole: whole.character,
    part: part.character,
    op: t.op,
    parts: t.parts,
    added: t.parts.filter((p) => p !== part.character),
    formula: `${whole.character} = ${t.parts.join(" + ")}`,
  };
}

/** Один знак собран из другого и добавки: 卖 = 十 + 买, 太 = 大 + 丶. Иначе `null`. */
export function pairDifference(a: HanziChar | null | undefined, b: HanziChar | null | undefined): PairDifference | null {
  if (!a || !b || a.character === b.character) return null;
  return contains(a, b) ?? contains(b, a);
}

// ------------------------------------------------------------- подсказка

const PLACES: Record<string, string[]> = {
  "⿰": ["слева", "справа"],
  "⿱": ["сверху", "снизу"],
  "⿲": ["слева", "посередине", "справа"],
  "⿳": ["сверху", "посередине", "снизу"],
};

/** Первое чтение из словарного «piányi, biànyí», по слогу на знак. */
function syllablesOf(w: WordKey): Syllable[] | null {
  const first = w.reading?.split(/[,;]/)[0]?.trim();
  const syl = first ? parsePinyin(first) : null;
  return syl && syl.length === [...w.headword].length ? syl : null;
}

/**
 * Подсказка по-русски из этимологии: «卖 — сверху 十, снизу 买: читается
 * похоже на 买». Звуковая часть — только если это знак-партнёр и чтения
 * правда совпадают по слогу (фонетик часто врёт, vocabulary-engine.md §5);
 * смысловая — только если это добавка. Иначе `null`.
 */
export function pairMnemonic(
  d: PairDifference,
  whole: HanziChar,
  sound: { whole: Syllable | null; part: Syllable | null },
): string | null {
  const ety = whole.etymology;
  if (ety?.type !== "pictophonetic") return null;
  const hints: string[] = [];
  if (ety.phonetic === d.part && sound.whole && sound.part && sound.whole.base === sound.part.base) {
    hints.push(sound.whole.tone === sound.part.tone ? `читается так же, как ${d.part}` : `читается похоже на ${d.part}`);
  }
  if (ety.semantic && ety.semantic !== ety.phonetic && d.added.includes(ety.semantic)) {
    hints.push(`смысловая часть ${ety.semantic}`);
  }
  if (!hints.length) return null;
  const places = PLACES[d.op];
  const layout = places?.length === d.parts.length ? d.parts.map((p, i) => `${places[i]} ${p}`).join(", ") : null;
  return `${d.whole} — ${[layout, hints.join(", ")].filter(Boolean).join(": ")}`;
}

// ------------------------------------------------------------------ слова

/**
 * Строка разбора и подсказка для пары слов. Односложные — сравниваем знаки;
 * многосложные одной длины, различающиеся одним знаком, — этот знак
 * (买东西 / 卖东西). Иначе строки нет.
 */
export function wordDifference(a: WordKey, b: WordKey, chars: HanziMap): { difference: string | null; mnemonic: string | null } {
  const none = { difference: null, mnemonic: null };
  const ca = [...a.headword];
  const cb = [...b.headword];
  if (ca.length !== cb.length) return none;
  const diff = ca.flatMap((c, i) => (c === cb[i] ? [] : [i]));
  if (diff.length !== 1) return none;
  const i = diff[0];
  const d = pairDifference(chars.get(ca[i]), chars.get(cb[i]));
  if (!d) return none;
  const wholeIsA = d.whole === ca[i];
  const sa = syllablesOf(a)?.[i] ?? null;
  const sb = syllablesOf(b)?.[i] ?? null;
  const mnemonic = pairMnemonic(d, chars.get(d.whole)!, { whole: wholeIsA ? sa : sb, part: wholeIsA ? sb : sa });
  return { difference: d.formula, mnemonic };
}

/** Число черт для стартовой сложности: самый сложный знак слова; нет данных — `null`. */
export function maxStrokes(headword: string, chars: HanziMap): number | null {
  const known = [...headword].map((c) => chars.get(c)?.strokes).filter((n): n is number => typeof n === "number");
  return known.length ? Math.max(...known) : null;
}

/** Строка из базы → `HanziChar`; поля с неожиданными типами — как отсутствующие. */
export function readHanzi(row: Record<string, unknown>): HanziChar | null {
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  const character = str(row.character);
  if (!character) return null;
  const type = row.etymology_type;
  return {
    character,
    strokes: typeof row.stroke_count === "number" ? row.stroke_count : null,
    decomposition: str(row.decomposition),
    radical: str(row.radical),
    etymology: type === "ideographic" || type === "pictographic" || type === "pictophonetic"
      ? { type, semantic: str(row.etymology_semantic), phonetic: str(row.etymology_phonetic) }
      : null,
    components: Array.isArray(row.components) ? row.components.filter((c): c is string => typeof c === "string") : [],
  };
}
