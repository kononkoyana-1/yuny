/**
 * Перевод фразы в поиске (#75, #76): язык, ключ кэша, разбор китайской фразы
 * на слова словаря — кодом, а не моделью. Чистые функции; база и ИИ — в
 * `phrase-translate`.
 */
import { formatPinyin, maxMatch, parsePinyin, usableGloss } from "./learning/mod.ts";

export const MAX_PHRASE = 200;

const HAN = /\p{Script=Han}/u;
const CYRILLIC = /[А-Яа-яЁё]/;

export type Direction = "zh-ru" | "ru-zh";

/** Направление по письменности: есть иероглифы — с китайского; кириллица — с русского. */
export function directionOf(text: string): Direction | null {
  if (HAN.test(text)) return "zh-ru";
  if (CYRILLIC.test(text)) return "ru-zh";
  return null;
}

/** Ключ кэша: пробелы схлопнуты, русский — в нижнем регистре, ё = е. */
export function normalizePhrase(text: string): string {
  const t = text.normalize("NFC").replace(/\s+/g, " ").trim();
  return HAN.test(t) ? t.replace(/\s+/g, "") : t.toLocaleLowerCase("ru").replace(/ё/g, "е");
}

/** Статья словаря для разбора: чтение, короткий список значений, уровень HSK. */
export interface DictWord {
  reading: string | null;
  compact: string[];
  hskLevel: number | null;
}

export interface PhraseWord {
  /** Слово как во фразе; знак препинания — `punct: true`. */
  text: string;
  reading: string | null;
  /** Короткое значение по-русски; нет — `null`. */
  meaning: string | null;
  /** Есть статья в словаре — можно открыть. */
  inDictionary: boolean;
  punct: boolean;
}

/** Делится ли слово целиком на слова HSK (我想 → 我 + 想). */
function splitsIntoHsk(word: string, hsk: ReadonlyMap<string, number>): boolean {
  const chars = [...word];
  if (chars.length < 2) return false;
  const reach = [true, ...chars.map(() => false)];
  for (let i = 0; i < chars.length; i++) {
    if (!reach[i]) continue;
    for (let j = i + 1; j <= chars.length; j++) {
      if (j - i < chars.length && hsk.has(chars.slice(i, j).join(""))) reach[j] = true;
    }
  }
  return reach[chars.length];
}

/** Первое чтение статьи со знаками тонов: «hǎo, hào» → «hǎo». */
function firstReading(reading: string | null): string | null {
  const first = reading?.split(/[,;]/)[0]?.trim();
  const syl = first ? parsePinyin(first) : null;
  return syl ? formatPinyin(syl) : first || null;
}

/**
 * Разбор фразы: самое длинное слово словаря слева направо (до 4 знаков).
 * Слово словаря — статья с русским значением или слово HSK; статья, которая
 * целиком делится на слова HSK и сама не HSK (我想), — сочетание: режется.
 * Неизвестный знак — отдельным элементом без перевода.
 */
export function segmentPhrase(
  zh: string,
  dict: ReadonlyMap<string, DictWord>,
  hsk: ReadonlyMap<string, number>,
): PhraseWord[] {
  const russian = (w: string) => (dict.get(w)?.compact ?? []).some((c) => CYRILLIC.test(c));
  const isWord = (w: string) => hsk.has(w) || (russian(w) && !splitsIntoHsk(w, hsk));
  return maxMatch(zh.replace(/\s+/g, ""), isWord).map((text) => {
    if (!HAN.test(text)) return { text, reading: null, meaning: null, inDictionary: false, punct: true };
    const entry = dict.get(text);
    const meaning = entry?.compact.map((c) => usableGloss(c)).find((g) => g !== null) ?? null;
    return { text, reading: firstReading(entry?.reading ?? null), meaning, inDictionary: !!entry, punct: false };
  });
}

/** Пиньинь фразы — из чтений слов, не от модели; у неизвестного знака — «?». */
export function phrasePinyin(words: PhraseWord[]): string {
  return words.filter((w) => !w.punct).map((w) => w.reading ?? "?").join(" ");
}

/** Подстроки из иероглифов длиной 1–4 — кандидаты в слова словаря. */
export function phraseSubstrings(zh: string): string[] {
  const out = new Set<string>();
  for (const run of zh.match(/\p{Script=Han}+/gu) ?? []) {
    const chars = [...run];
    for (let i = 0; i < chars.length; i++) {
      for (let len = 1; len <= 4 && i + len <= chars.length; len++) out.add(chars.slice(i, i + len).join(""));
    }
  }
  return [...out];
}
