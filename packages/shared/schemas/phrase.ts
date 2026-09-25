import { z } from "zod";

/**
 * Перевод фразы из поиска (#76): `phrase-translate`. Перевод — ИИ (общий
 * кэш); разбор на слова и пиньинь — кодом по словарю. Для русского запроса
 * `zh` — китайский перевод, и разбирается он.
 */
export const PhraseWordSchema = z.object({
  text: z.string(),
  reading: z.string().nullable(),
  /** Короткое значение по-русски; нет — `null`. */
  meaning: z.string().nullable(),
  /** Есть статья в словаре — слово можно открыть. */
  in_dictionary: z.boolean(),
  /** Знак препинания — не слово. */
  punct: z.boolean(),
});

export const PhraseTranslationSchema = z.object({
  direction: z.enum(["zh-ru", "ru-zh"]),
  translation: z.string(),
  zh: z.string(),
  pinyin: z.string(),
  words: z.array(PhraseWordSchema),
});

export type PhraseWord = z.infer<typeof PhraseWordSchema>;
export type PhraseTranslation = z.infer<typeof PhraseTranslationSchema>;
