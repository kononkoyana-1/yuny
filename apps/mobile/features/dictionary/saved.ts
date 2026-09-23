import type { SavedEntry, TranslationSource, UserDictionaryItem } from "@yuny/shared";
import { shortMeaning } from "./article";
import { pinyinPlain, queryKind, readingsPlain } from "@/shared/lib/dictionaryText";

/**
 * Слово своего словаря вместе со всеми папками, где оно лежит. Одно слово в
 * трёх папках — три строки `user_dictionary_items`, но на экране это одно
 * слово.
 */
export interface SavedWord {
  key: string;
  headword: string;
  reading: string | null;
  /** Статья словаря или `null`, если после перезаливки её больше нет. */
  entry: SavedEntry | null;
  /** Сохранённое значение слова — из той строки, где оно есть. */
  translation: string | null;
  /** Откуда `translation`; `null` у слов, сохранённых до хранения источника. */
  translationSource: TranslationSource | null;
  items: UserDictionaryItem[];
}

/** Ключ слова — заголовок и чтение, как у самого словаря и у уникального индекса папки. */
export function wordKey(headword: string, reading: string | null): string {
  return `${headword}\u0000${reading ?? ""}`;
}

/** Строки в порядке `items` (новые первыми), склеенные по слову. */
export function groupSavedWords(items: UserDictionaryItem[]): SavedWord[] {
  const byKey = new Map<string, SavedWord>();
  for (const item of items) {
    const key = wordKey(item.headword, item.reading);
    const word = byKey.get(key);
    if (word) {
      word.items.push(item);
      word.entry ??= item.entry;
      if (word.translation === null && item.translation !== null) {
        word.translation = item.translation;
        word.translationSource = item.translation_source;
      }
    } else {
      byKey.set(key, {
        key,
        headword: item.headword,
        reading: item.reading,
        entry: item.entry,
        translation: item.translation,
        translationSource: item.translation_source,
        items: [item],
      });
    }
  }
  return [...byKey.values()];
}

/** Сколько слов в каждой папке. */
export function folderCounts(items: UserDictionaryItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.folder_id, (counts.get(item.folder_id) ?? 0) + 1);
  return counts;
}

/**
 * Поиск по своему словарю тем же полем, что и по БКРС: иероглиф ищется по
 * началу и внутри слова, пиньинь — по началу любого из чтений без тонов,
 * русский — по своему переводу и значениям статьи. Весь свой словарь уже на клиенте, поэтому
 * ищется здесь, без запроса.
 */
export function searchSaved(words: SavedWord[], query: string): SavedWord[] {
  const trimmed = query.trim();
  if (trimmed === "") return [];

  const kind = queryKind(trimmed);
  if (kind === "hanzi") return words.filter((w) => w.headword.includes(trimmed));

  if (kind === "pinyin") {
    const needle = pinyinPlain(trimmed);
    if (needle === "") return [];
    return words.filter((w) => readingsPlain(w.reading).some((r) => r.startsWith(needle)));
  }

  const needle = trimmed.toLocaleLowerCase("ru");
  return words.filter(
    (w) =>
      (w.translation?.toLocaleLowerCase("ru").includes(needle) ?? false) ||
      (w.entry?.senses ?? []).some((s) => s.gloss.toLocaleLowerCase("ru").includes(needle)),
  );
}

/**
 * Строка над статьёй, которая называет сохранённое значение слова и его
 * источник, или `null`, если показывать нечего:
 *
 *   * из файла и от модели — всегда: это не то, что написано в статье;
 *   * копия статьи — только когда самой статьи больше нет, иначе она
 *     повторяла бы статью под собой;
 *   * без источника (сохранено раньше) — если отличается от статьи.
 */
export type TranslationLineKind = "file" | "ai" | "dictionary" | "saved";

export function translationLine(word: {
  entry: SavedEntry | null;
  translation?: string | null;
  translationSource?: TranslationSource | null;
}): { kind: TranslationLineKind; text: string } | null {
  const text = word.translation;
  if (!text) return null;
  switch (word.translationSource) {
    case "file":
    case "ai":
      return { kind: word.translationSource, text };
    case "dictionary":
      return word.entry ? null : { kind: "dictionary", text };
    default:
      return word.entry && text === shortMeaning(word.entry) ? null : { kind: "saved", text };
  }
}
