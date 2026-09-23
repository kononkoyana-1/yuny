import type { ExtractedWord, SavedTranslationSource } from "@yuny/shared";

/** Слово в списке из файла вместе с правкой ученика, если она есть. */
export type ReviewWord = ExtractedWord & { edited: boolean };

/** Столько символов перевода хранит колонка `translation`. */
export const MAX_TRANSLATION = 300;

/**
 * Перевод, который ученик ввёл сам, к виду для списка: пробелы по краям и
 * повторные — прочь. Пустой — не перевод (`null`): кнопка «Сохранить» тогда
 * недоступна, а не сохраняет пустое место.
 */
export function cleanTranslation(text: string): string | null {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, MAX_TRANSLATION) : null;
}

/**
 * Слова из файла с учётом правок. Правка, равная исходному переводу, — не
 * правка: слово остаётся с прежним источником.
 */
export function applyEdits(words: ExtractedWord[], edits: ReadonlyMap<string, string>): ReviewWord[] {
  return words.map((word) => {
    const edit = edits.get(word.word);
    return edit !== undefined && edit !== word.translation
      ? { ...word, translation: edit, edited: true }
      : { ...word, edited: false };
  });
}

/** Источник, с которым слово уйдёт в папку: поправленное — `user`. */
export function savedSource(word: ReviewWord): SavedTranslationSource {
  return word.edited ? "user" : word.source;
}
