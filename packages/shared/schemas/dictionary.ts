import { z } from "zod";

import { HskLevelSchema } from "./profile";

/**
 * Словарь БКРС и поиск по нему (TZ.md §11 экран 04, §14).
 *
 * Поле поиска одно, а письменностей три, поэтому вид запроса определяет
 * сервер и возвращает его вместе с результатом: экрану это нужно для пустого
 * состояния — «иероглиф не найден» и «перевод не найден» подсказывают разное.
 */
export const DictionaryQueryKindSchema = z.enum(["hanzi", "pinyin", "russian"]);

/**
 * Одно значение статьи. `nest` — римское гнездо части речи у частотных знаков,
 * `num` — номер значения внутри гнезда, `header` — пометы и заголовок гнезда.
 * У большинства статей заполнен только `gloss`: гнёзда есть примерно у 4%.
 */
export const DictionarySenseSchema = z.object({
  nest: z.string().nullable(),
  num: z.string().nullable(),
  gloss: z.string(),
  header: z.string().nullish(),
});

export const DictionaryEntrySchema = z.object({
  id: z.number().int(),
  headword: z.string().min(1),
  reading: z.string().nullable(),
  senses: z.array(DictionarySenseSchema),
  /** До шести значений без служебных рубрик — для карточек и промптов. */
  compact: z.array(z.string()),
  hsk_level: HskLevelSchema.nullable(),
  /** 0 — точное совпадение, 1 — префикс, 2 — попадание в перевод. */
  rank: z.number().int().min(0).max(2),
});

/**
 * Сервер всё равно зажимает эти границы сам; здесь они — чтобы экран не слал
 * заведомо пустой запрос.
 *
 * Страница меньше пятидесяти не случайно: признак «есть ещё» функция получает,
 * запрашивая на строку больше страницы, а `public.dictionary_search` режет
 * выдачу по пятидесяти. Сорок оставляет этой лишней строке место.
 */
export const DictionarySearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(64),
  limit: z.number().int().min(1).max(40).optional(),
  offset: z.number().int().min(0).optional(),
});

/**
 * Общего числа найденного здесь нет намеренно: `count(*)` по миллиону строк
 * стоит дороже самой выдачи, а листалке хватает признака «есть ещё».
 */
export const DictionarySearchResponseSchema = z.object({
  query: z.string(),
  kind: DictionaryQueryKindSchema,
  limit: z.number().int(),
  offset: z.number().int(),
  has_more: z.boolean(),
  items: z.array(DictionaryEntrySchema),
});

export type DictionaryQueryKind = z.infer<typeof DictionaryQueryKindSchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;
export type DictionaryEntry = z.infer<typeof DictionaryEntrySchema>;
export type DictionarySearchRequest = z.infer<typeof DictionarySearchRequestSchema>;
export type DictionarySearchResponse = z.infer<typeof DictionarySearchResponseSchema>;
