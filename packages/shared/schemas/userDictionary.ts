import { z } from "zod";

import { DictionaryEntrySchema } from "./dictionary";

/**
 * Свой словарь (TZ.md §11 экран 04, §12): папки пользователя и слова в них.
 * Таблицы — `user_dictionary_folders` и `user_dictionary_items`; клиент
 * пишет в них сам, под RLS, без Edge Function.
 */

/** Те же границы, что у `user_dictionary_folders_name_len` в миграции. */
export const FolderNameSchema = z.string().trim().min(1).max(60);

export const UserDictionaryFolderSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  created_at: z.string(),
});

/**
 * Статья, к которой ведёт слово в папке. Без `rank` — это не выдача поиска —
 * и без `hsk_level`: на экране словаря уровень не показывается (TZ.md §4),
 * и забирать его незачем.
 */
export const SavedEntrySchema = DictionaryEntrySchema.pick({
  id: true,
  headword: true,
  reading: true,
  senses: true,
  compact: true,
});

/**
 * Слово в папке. Ключ слова — `headword` и `reading`, как у самого словаря;
 * `entry` — статья по ссылке, `null`, если после перезаливки словаря статьи
 * с этим id больше нет.
 */
export const UserDictionaryItemSchema = z.object({
  id: z.uuid(),
  folder_id: z.uuid(),
  headword: z.string().min(1),
  reading: z.string().nullable(),
  /**
   * Копия короткого значения, которую слово уносит в папку (#36): перевод из
   * файла, короткое значение статьи или перевод модели, если статьи нет. Если
   * статью удалят при перезаливке словаря, слово не останется без значения.
   * `null` только у слов, сохранённых до этого правила.
   */
  translation: z.string().nullable(),
  created_at: z.string(),
  entry: SavedEntrySchema.nullable(),
});

export type UserDictionaryFolder = z.infer<typeof UserDictionaryFolderSchema>;
export type SavedEntry = z.infer<typeof SavedEntrySchema>;
export type UserDictionaryItem = z.infer<typeof UserDictionaryItemSchema>;
