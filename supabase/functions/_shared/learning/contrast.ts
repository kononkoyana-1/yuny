/**
 * Контрастная карточка пары (#71, vocabulary-engine.md §5): по одной
 * коллокации на каждое слово пары — от ИИ, но в карточку попадает только то,
 * что прошло проверку кодом (data-sources.md: ИИ + проверка, общий кэш).
 *
 * Строка разбора «卖 = 十 + 买» и подсказка к ней строятся кодом из данных о
 * знаках (#74, `hanzi.ts`), не ИИ.
 */
import type { WordKey } from "./classify.ts";
import { formatPinyin, parsePinyin, type Syllable } from "./pinyin.ts";

export interface Collocation {
  zh: string;
  pinyin: string;
  ru: string;
}

export interface ContrastBody {
  /** [для слова A, для слова B] — порядок сторон пары. */
  collocations: [Collocation, Collocation];
}

const HAN = /^\p{Script=Han}+$/u;
const CYRILLIC = /[А-Яа-яЁё]/;
const MAX_ZH = 8;
const MAX_RU = 60;

/** Первое чтение из словарного «piányi, biànyí». */
function firstReading(reading: string | null): Syllable[] | null {
  const first = reading?.split(/[,;]/)[0]?.trim();
  return first ? parsePinyin(first) : null;
}

/** Слог коллокации совпадает со слогом слова; лёгкий тон в сочетании допустим (东西 dōngxi). */
const sameSyllable = (x: Syllable, y: Syllable) => x.base === y.base && (x.tone === y.tone || x.tone === 5 || y.tone === 5);

/** Пиньинь со знаками тонов, слова — как их разделил ИИ: «mai3 dong1xi» → «mǎi dōngxi». */
function marked(pinyin: string): string {
  return pinyin.trim().split(/\s+/).map((w) => formatPinyin(parsePinyin(w) ?? [])).join(" ");
}

/**
 * Годится ли коллокация для слова: только иероглифы, не длиннее 8, содержит
 * само слово и не содержит партнёра (иначе коллокация сама путает), пиньинь —
 * по слогу на знак, а на месте слова — его чтение из словаря.
 */
export function checkCollocation(raw: unknown, word: WordKey, partner: WordKey): Collocation | null {
  if (!raw || typeof raw !== "object") return null;
  const { zh, pinyin, ru } = raw as Record<string, unknown>;
  if (typeof zh !== "string" || typeof pinyin !== "string" || typeof ru !== "string") return null;
  const text = zh.trim();
  const chars = [...text];
  if (!HAN.test(text) || chars.length > MAX_ZH || chars.length <= [...word.headword].length) return null;
  const at = text.indexOf(word.headword);
  if (at < 0) return null;
  if (!word.headword.includes(partner.headword) && text.includes(partner.headword)) return null;

  const syllables = parsePinyin(pinyin);
  if (!syllables || syllables.length !== chars.length) return null;
  const own = firstReading(word.reading);
  if (own) {
    const start = [...text.slice(0, at)].length;
    if (own.length !== [...word.headword].length) return null;
    if (!own.every((s, i) => sameSyllable(s, syllables[start + i]))) return null;
  }

  const meaning = ru.trim();
  if (!CYRILLIC.test(meaning) || meaning.length > MAX_RU) return null;
  return { zh: text, pinyin: marked(pinyin), ru: meaning };
}

/** Ответ ИИ → тело карточки; хоть одна коллокация не прошла — карточки нет. */
export function checkContrast(raw: unknown, a: WordKey, b: WordKey): ContrastBody | null {
  const list = (raw as { collocations?: unknown })?.collocations;
  if (!Array.isArray(list) || list.length !== 2) return null;
  const ca = checkCollocation(list[0], a, b);
  const cb = checkCollocation(list[1], b, a);
  return ca && cb ? { collocations: [ca, cb] } : null;
}

/** Тело из кэша (`contrast_cards.body`) — ещё раз через ту же проверку. */
export function readContrast(body: unknown, a: WordKey, b: WordKey): ContrastBody | null {
  return checkContrast(body, a, b);
}
