import type { DictionaryEntry, DictionarySense } from "@yuny/shared";

/** Одно значение статьи на экране: номер (если был в БКРС) и текст. */
export interface ArticleSense {
  num: string | null;
  gloss: string;
}

/**
 * Гнездо статьи: римская цифра, заголовок гнезда (часть речи и чтение —
 * «гл. dǎ») и значения под ним. У статьи без гнёзд — ровно одно гнездо с
 * `nest: null` и без заголовка.
 */
export interface ArticleNest {
  nest: string | null;
  heading: string | null;
  senses: ArticleSense[];
}

/**
 * Значение по-русски. В БКРС попадаются значения на китайском («说；可以说。»)
 * и английском — ученику, который учит китайский через русский, они не
 * помогают (баг с живого сайта, 2026-09-24). Такие значения не показываются;
 * то же правило, что `translationText` в `_shared/wordsExtract.ts`.
 */
const RUSSIAN_LETTER = /\p{Script=Cyrillic}/u;

export function isRussianGloss(gloss: string): boolean {
  return RUSSIAN_LETTER.test(gloss);
}

/** Тот же признак, что `isHeader` в `supabase/functions/_shared/wordCards.ts`. */
function isHeader(sense: DictionarySense): boolean {
  return sense.header === true || sense.header === "true";
}

/**
 * Раскладывает `senses` из `dictionary-search` по гнёздам для страницы
 * словаря (TZ.md §11 экран 04). Порядок статьи сохраняется: новое гнездо
 * начинается там, где сменился `nest`, а не собирается сортировкой.
 */
export function articleNests(senses: DictionarySense[]): ArticleNest[] {
  const nests: ArticleNest[] = [];
  // Гнёзда, из которых ушли значения не по-русски.
  const filtered = new Set<ArticleNest>();

  for (const sense of senses) {
    let current = nests.at(-1);
    if (!current || current.nest !== sense.nest) {
      current = { nest: sense.nest, heading: null, senses: [] };
      nests.push(current);
    }
    if (isHeader(sense)) {
      current.heading = sense.gloss;
    } else if (isRussianGloss(sense.gloss)) {
      current.senses.push({ num: sense.num, gloss: sense.gloss });
    } else {
      filtered.add(current);
    }
  }

  // Гнездо, в котором не осталось значений по-русски, не показывается.
  return nests.filter((n) => n.senses.length > 0 || !filtered.has(n));
}

/** Сколько значений показывать в строке выдачи — остальное в статье. */
const SUMMARY_SENSES = 3;

/**
 * Короткий перевод для строки выдачи: первые значения из `compact` по-русски.
 * Если таких нет (статья из одних служебных рубрик), берётся первое значение
 * статьи по-русски; нет и его — пустая строка, и экран пишет, что перевода
 * на русский в словаре нет.
 */
export function entrySummary(entry: Pick<DictionaryEntry, "compact" | "senses">): string {
  const compact = entry.compact.filter(isRussianGloss);
  if (compact.length > 0) return compact.slice(0, SUMMARY_SENSES).join("; ");
  return entry.senses.find((s) => !isHeader(s) && isRussianGloss(s.gloss))?.gloss ?? "";
}

/** Столько символов значения хранит `user_dictionary_items.translation` (check в миграции). */
export const MAX_SAVED_MEANING = 300;

/**
 * Короткое значение, которое слово уносит с собой в папку (#36): копия на
 * случай, если статью удалят при перезаливке словаря. То же, что строка
 * выдачи, обрезанное до длины колонки; `null`, если значений нет.
 */
export function shortMeaning(entry: Pick<DictionaryEntry, "compact" | "senses">): string | null {
  const summary = entrySummary(entry).trim();
  if (!summary) return null;
  return summary.length <= MAX_SAVED_MEANING
    ? summary
    : summary.slice(0, MAX_SAVED_MEANING - 1).trimEnd() + "…";
}
