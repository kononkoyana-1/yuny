import { z } from "zod";

import { MATERIAL_LIMITS, MaterialFileSchema } from "./module";

/**
 * Слова из загруженного файла (`words-extract`, редакция 2026-09-23: Главная
 * скрыта, загрузка нужна только ради слов для своего словаря).
 */

/** Тот же запрос, что у `module-create`: файлы уже лежат в Storage. */
export const WordsExtractRequestSchema = z.object({
  material_id: z.uuid(),
  files: z.array(MaterialFileSchema).min(1).max(MATERIAL_LIMITS.maxFiles),
});

export const WordsExtractResponseSchema = z.object({
  job_id: z.uuid(),
  kind: z.literal("words_extract"),
  material_id: z.uuid(),
});

/**
 * Откуда перевод: написан в самом файле, предложен словарём БКРС (в файле
 * были только иероглифы) или дан моделью — у слова нет ни статьи, ни
 * перевода в файле.
 */
export const TranslationSourceSchema = z.enum(["file", "dictionary", "ai"]);

export const ExtractedWordSchema = z.object({
  word: z.string().min(1),
  reading: z.string().nullable(),
  translation: z.string().min(1).max(300),
  source: TranslationSourceSchema,
  /** Статья БКРС, которой соответствует слово; `null` — слова в словаре нет. */
  entry_id: z.number().int().nullable(),
});

/** Результат задачи `words_extract`. `title` — предложенное название папки. */
export const WordsExtractResultSchema = z.object({
  title: z.string(),
  words: z.array(ExtractedWordSchema).min(1),
});

export type WordsExtractRequest = z.infer<typeof WordsExtractRequestSchema>;
export type WordsExtractResponse = z.infer<typeof WordsExtractResponseSchema>;
export type TranslationSource = z.infer<typeof TranslationSourceSchema>;
export type ExtractedWord = z.infer<typeof ExtractedWordSchema>;
export type WordsExtractResult = z.infer<typeof WordsExtractResultSchema>;
