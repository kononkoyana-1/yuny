import type { DictionaryQueryKind } from "@yuny/shared";

/**
 * Разбор строки поиска на клиенте. Выдачу БКРС определяет сервер
 * (`supabase/functions/dictionary-search/search.ts`) — эти правила повторяют
 * его для того, что сервер не видит: поиска по своему словарю, который целиком
 * лежит на клиенте, и мок-репозитория.
 */

/** CJK Unified Ideographs — тот же диапазон, что у сервера и парсера словаря. */
const HANZI = /[一-鿿]/;
const CYRILLIC = /[Ѐ-ӿ]/;

export function queryKind(query: string): DictionaryQueryKind {
  if (HANZI.test(query)) return "hanzi";
  if (CYRILLIC.test(query)) return "russian";
  return "pinyin";
}

/**
 * Пиньинь без тонов, пробелов и апострофов, в нижнем регистре: `hànzì`,
 * `hàn zì` и `hanzi` — один запрос. Как `pinyinPlain` на сервере.
 */
export function pinyinPlain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

/**
 * Каждое чтение статьи отдельно: у «hǎo, hào» их два, и `hao` должен найти
 * оба, а `haoh` — ни одного.
 */
export function readingsPlain(reading: string | null): string[] {
  return (reading ?? "").split(/[,;]/).map(pinyinPlain).filter(Boolean);
}

const TONE_MARKS: Record<string, string> = { "1": "̄", "2": "́", "3": "̌", "4": "̀" };
const MARK_TONES: Record<string, string> = { "̄": "1", "́": "2", "̌": "3", "̀": "4" };

/** Слог с тоном цифрой → со знаком: знак на a/e, в «ou» на o, иначе на последней гласной. */
function markSyllable(letters: string, tone: string): string {
  const base = letters.toLowerCase().replace(/u:|v/g, "ü");
  const mark = TONE_MARKS[tone];
  if (!mark) return base;
  const at =
    base.search(/[ae]/) >= 0
      ? base.search(/[ae]/)
      : base.includes("ou")
        ? base.indexOf("o")
        : Math.max(...["i", "o", "u", "ü"].map((v) => base.lastIndexOf(v)));
  if (at < 0) return base;
  return (base.slice(0, at + 1) + mark + base.slice(at + 1)).normalize("NFC");
}

/**
 * Предпросмотр ввода P2 (exercise.design.md §4.5): `mai3 → mǎi`, `lv4 → lǜ`,
 * `nü3 → nǚ`, `ma5 → ma`. Только отображение — ответ проверяет сервер.
 */
export function pinyinWithMarks(input: string): string {
  return input.replace(/([a-zA-ZüÜ:]+)([1-5])/g, (_, letters: string, tone: string) => markSyllable(letters, tone));
}

/**
 * Пиньинь в сравнимом виде: буквы без тонов (ü как v) и тоны по порядку,
 * лёгкий тон не пишется. `mǎi`, `mai3` и `MAI3` дают одно и то же.
 */
export function pinyinCanonical(text: string): string {
  const tones: string[] = [];
  const letters = text
    .normalize("NFD")
    .replace(/ü|u:|ü/gi, "v")
    .replace(/[̀-ͯ]/g, (m) => {
      if (MARK_TONES[m]) tones.push(MARK_TONES[m]);
      return "";
    })
    .replace(/[1-5]/g, (d) => {
      if (d !== "5") tones.push(d);
      return "";
    })
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
  return `${letters}|${tones.join("")}`;
}

const HANZI_ANY = /[一-鿿]/;

/** В поле пиньиня попали иероглифы — включена китайская раскладка (§4.5). */
export function hasHanzi(text: string): boolean {
  return HANZI_ANY.test(text);
}
