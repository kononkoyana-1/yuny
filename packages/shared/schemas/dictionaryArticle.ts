import { z } from "zod";

import { HskLevelSchema } from "./profile";
import { StageSchema } from "./study";
import { SavedEntrySchema } from "./userDictionary";

/**
 * Статья в листе словаря (словарь 2.0, #75): `dictionary-search` с
 * `action: "article"`. Всё считает сервер (`_shared/dictionaryArticle.ts`):
 * клиент только рисует.
 */
export const DictionaryArticleRequestSchema = z.object({
  headword: z.string().trim().min(1).max(16),
  reading: z.string().nullable(),
});

/** Знак в строке состава слова (#79): «电 diàn «электричество»». */
export const CompositionCharSchema = z.object({
  char: z.string().min(1),
  /** Чтение знака в этом слове. */
  reading: z.string().nullable(),
  /** Одно-два коротких значения по-русски; `null` — русского в статье знака нет. */
  meaning: z.string().nullable(),
  /** Чтение статьи знака как в словаре («hǎo, hào») — по нему она откроется; `null` — статьи нет. */
  entry_reading: z.string().nullable(),
  /** Все русские значения знака для этого чтения — карточка знака в составе. */
  meanings: z.array(z.string()).default([]),
});

/** Слово со знаком — луч графа (#84). */
export const CharWordSchema = z.object({
  headword: z.string().min(1),
  reading: z.string().nullable(),
  meaning: z.string().nullable(),
  hsk_level: HskLevelSchema.nullable(),
  /** Где стоит знак: сторона луча. */
  position: z.enum(["start", "middle", "end"]),
  /** Слово в папках пользователя. */
  mine: z.boolean(),
  /** Стадия памяти — только у слов пользователя. */
  stage: StageSchema.nullable(),
});

export const DictionaryArticleSchema = z.object({
  headword: z.string(),
  reading: z.string().nullable(),
  /** Статья словаря; `null` — такого заголовка в словаре нет. */
  entry: SavedEntrySchema.nullable(),
  /** Уровень HSK 2.0 (#80): из статьи или из списка `hsk_words`. */
  hsk_level: HskLevelSchema.nullable(),
  /** Состав слова (#79); у слова из одного знака — пусто. */
  composition: z.array(CompositionCharSchema),
  /** Слова с этим знаком (#84): только у статьи знака, иначе `null`. Свои — первыми. */
  char_words: z.array(CharWordSchema).nullable(),
});

export type DictionaryArticleRequest = z.infer<typeof DictionaryArticleRequestSchema>;
export type CompositionChar = z.infer<typeof CompositionCharSchema>;
export type CharWord = z.infer<typeof CharWordSchema>;
export type DictionaryArticle = z.infer<typeof DictionaryArticleSchema>;
