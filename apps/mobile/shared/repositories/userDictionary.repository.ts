import type { SavedEntry, UserDictionaryFolder, UserDictionaryItem } from "@yuny/shared";

/**
 * Что нужно, чтобы положить слово в папку: ключ слова, ссылка на статью и,
 * если слово пришло из файла, его перевод оттуда.
 */
export type SaveWordInput = Pick<SavedEntry, "headword" | "reading"> & {
  entryId: number | null;
  translation?: string | null;
};

/**
 * Свой словарь (TZ.md §11 экран 04): папки и слова в них. Клиент пишет в
 * `user_dictionary_folders` и `user_dictionary_items` сам, под RLS — Edge
 * Function для них нет. Любая реализация прогоняет ответ через схемы
 * `@yuny/shared` перед возвратом.
 *
 * Ошибки — `BackendError` с кодом: `folder_name_taken`, когда папка с таким
 * названием уже есть, остальное — `network_error` или `internal_error`.
 */
export interface UserDictionaryRepository {
  /** Все папки пользователя по названию. */
  listFolders(): Promise<UserDictionaryFolder[]>;
  createFolder(name: string): Promise<UserDictionaryFolder>;
  renameFolder(id: string, name: string): Promise<UserDictionaryFolder>;
  /** Удаляет папку вместе со словами в ней. */
  deleteFolder(id: string): Promise<void>;
  /**
   * Все слова всех папок, новые первыми. Словарь одного человека — сотни
   * строк, поэтому он приезжает целиком: по нему же идёт поиск по своему
   * словарю и видно, в каких папках уже лежит слово.
   */
  listItems(): Promise<UserDictionaryItem[]>;
  /** Кладёт слово в папку. Если оно там уже есть — ничего не делает. */
  addItem(folderId: string, word: SaveWordInput): Promise<void>;
  /**
   * Кладёт в папку сразу список слов — одной вставкой. Слова, которые там уже
   * лежат, пропускаются. Возвращает, сколько слов добавилось.
   */
  addItems(folderId: string, words: SaveWordInput[]): Promise<number>;
  removeItem(itemId: string): Promise<void>;
}
