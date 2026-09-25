/**
 * Статья словаря в листе (словарь 2.0, #75): состав слова (#79), уровень HSK
 * (#80) и слова, в которые входит знак (#84). Чистые функции — без базы и
 * сети, покрыты `dictionaryArticle_test.ts`. Чтение и значение знака — те же
 * правила, что у заметок о знаках в знакомстве (`learning/exercise.ts`, #88).
 */
import {
  type CharEntry,
  formatPinyin,
  matchEntry,
  meaningFor,
  meaningsFor,
  parsePinyin,
  type Stage,
  syllableAt,
} from "./learning/mod.ts";

const HAN = /\p{Script=Han}/u;
const RUSSIAN = /[А-Яа-яЁё]/;

/** Знак в строке состава: «电 diàn «электричество»». */
export interface CompositionChar {
  char: string;
  /** Чтение знака в этом слове; `null` — не делится по слогам и статьи нет. */
  reading: string | null;
  /** Одно-два коротких значения по-русски; `null` — в статье знака русского нет. */
  meaning: string | null;
  /**
   * Чтение статьи знака, как оно записано в словаре («hǎo, hào»): по нему
   * клиент открывает именно эту статью. `null` — статьи знака нет.
   */
  entry_reading: string | null;
  /** Все русские значения знака для этого чтения (`meaningsFor`). */
  meanings: string[];
}

/**
 * Короткое значение: первый пункт до «;», в нём — не больше двух вариантов
 * через запятую, без пояснений в скобках. «хороший, добрый, прекрасный» →
 * «хороший, добрый».
 */
export function shortGloss(gloss: string | null): string | null {
  if (!gloss) return null;
  const first = gloss.split(/[;；]/)[0]
    .replace(/\([^()]*\)|\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = first.split(/\s*,\s*/).filter((p) => p !== "");
  const out = parts.slice(0, 2).join(", ").replace(/[.:]+$/, "").trim();
  return out && RUSSIAN.test(out) ? out : null;
}

/**
 * Состав слова (#79): каждый знак — по порядку, с повторами (谢谢 — два
 * знака). Чтение — слог чтения слова, иначе первое чтение статьи знака;
 * значение — из статьи знака для этого чтения (`meaningFor`). У слова из
 * одного знака состава нет.
 */
export function composition(headword: string, reading: string | null, entries: CharEntry[]): CompositionChar[] {
  const chars = [...headword];
  if (chars.filter((c) => HAN.test(c)).length < 2) return [];
  return chars.flatMap((char, index) => {
    if (!HAN.test(char)) return [];
    const s = syllableAt(headword, reading, index);
    const own = entries.filter((e) => e.headword === char);
    // Слог слова не нашёлся среди чтений статей (или слога нет) — первое чтение первой статьи.
    const hit = matchEntry(own, s) ?? firstReading(own);
    return [{
      char,
      reading: s ? formatPinyin([s]) : hit ? formatPinyin([hit.syllable]) : null,
      meaning: hit ? shortGloss(meaningFor(hit.entry, hit.syllable)) : null,
      // Все значения — карточка знака в составе показывает их, как выдача поиска.
      meanings: hit ? meaningsFor(hit.entry, hit.syllable) : [],
      entry_reading: hit ? hit.entry.reading : own[0]?.reading ?? null,
    }];
  });
}

function firstReading(entries: CharEntry[]) {
  for (const entry of entries) {
    const first = parsePinyin((entry.reading ?? "").split(/[,;]/)[0] ?? "");
    if (first?.length === 1) return { entry, syllable: first[0] };
  }
  return null;
}

// ------------------------------------------------------------ граф знака

/** Где стоит знак в слове: сторона луча в графе (#84). */
export type CharPosition = "start" | "middle" | "end";

export function charPosition(headword: string, char: string): CharPosition {
  const chars = [...headword];
  if (chars[0] === char) return "start";
  if (chars.at(-1) === char) return "end";
  return "middle";
}

/** Слово-кандидат из словаря (`dictionary_char_words`), уже в порядке частоты. */
export interface DictWordRow {
  headword: string;
  reading: string | null;
  gloss: string | null;
  hsk_level: number | null;
}

/** Слово пользователя со знаком: из его папок, со стадией памяти. */
export interface OwnWordRow {
  headword: string;
  reading: string | null;
  gloss: string | null;
  hsk_level: number | null;
  stage: Stage;
}

export interface CharWord {
  headword: string;
  reading: string | null;
  meaning: string | null;
  hsk_level: number | null;
  position: CharPosition;
  /** Слово лежит в папках пользователя. */
  mine: boolean;
  /** Стадия памяти — только у слов пользователя (#70). */
  stage: Stage | null;
}

/** Лучей в графе; остальное клиент показывает списком «ещё N». */
export const CHAR_WORDS_LIMIT = 40;

/**
 * Слова со знаком (#84): сначала слова пользователя (в том порядке, в каком
 * пришли), потом слова HSK по уровню, потом остальные — в порядке словаря
 * (`dictionary_char_words`: короче и богаче значениями — раньше). Сам знак,
 * чужие слова без русского значения и повторы заголовка отбрасываются.
 */
export function charWords(char: string, own: OwnWordRow[], dict: DictWordRow[], limit = CHAR_WORDS_LIMIT): CharWord[] {
  const seen = new Set<string>([char]);
  const out: CharWord[] = [];
  const push = (w: DictWordRow, mine: boolean, stage: Stage | null) => {
    if (seen.has(w.headword) || !w.headword.includes(char)) return;
    const meaning = shortGloss(w.gloss);
    if (!mine && !meaning) return;
    seen.add(w.headword);
    out.push({
      headword: w.headword,
      reading: w.reading,
      meaning,
      hsk_level: w.hsk_level,
      position: charPosition(w.headword, char),
      mine,
      stage,
    });
  };
  for (const w of own) push(w, true, w.stage);
  const byLevel = dict.map((w, i) => ({ w, i })).sort((a, b) =>
    (a.w.hsk_level ?? 99) - (b.w.hsk_level ?? 99) || a.i - b.i
  );
  for (const { w } of byLevel) push(w, false, null);
  return out.slice(0, limit);
}

/**
 * Уровень HSK слова (#80): у статьи он проставлен при импорте; нет — по списку
 * `hsk_words` (у одного слова бывает два уровня — берём меньший).
 */
export function hskLevelOf(entryLevel: number | null | undefined, listLevels: number[]): number | null {
  if (entryLevel) return entryLevel;
  return listLevels.length ? Math.min(...listLevels) : null;
}
