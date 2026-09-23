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

  for (const sense of senses) {
    let current = nests.at(-1);
    if (!current || current.nest !== sense.nest) {
      current = { nest: sense.nest, heading: null, senses: [] };
      nests.push(current);
    }
    if (isHeader(sense)) {
      current.heading = sense.gloss;
    } else {
      current.senses.push({ num: sense.num, gloss: sense.gloss });
    }
  }

  return nests;
}

/** Сколько значений показывать в строке выдачи — остальное в статье. */
const SUMMARY_SENSES = 3;

/**
 * Короткий перевод для строки выдачи: первые значения из `compact`. Если
 * `compact` пуст (статья из одних служебных рубрик), берётся первое значение
 * статьи, чтобы строка не осталась без перевода.
 */
export function entrySummary(entry: Pick<DictionaryEntry, "compact" | "senses">): string {
  if (entry.compact.length > 0) return entry.compact.slice(0, SUMMARY_SENSES).join("; ");
  return entry.senses.find((s) => !isHeader(s))?.gloss ?? "";
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
