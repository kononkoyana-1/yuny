/**
 * Одно место, где живут ключи запросов, чтобы мутация инвалидировала ровно
 * то, что должна. Ключи модулей, уроков и словаря добавятся вместе со
 * своими экранами (TZ.md §18, фазы 1–6).
 */
export const queryKeys = {
  profile: ["profile"] as const,
  dictionarySearch: (query: string) => ["dictionary", "search", query] as const,
  userDictionaryFolders: ["userDictionary", "folders"] as const,
  userDictionaryItems: ["userDictionary", "items"] as const,
  learningSettings: ["learningSettings"] as const,
  today: ["study", "today"] as const,
  folderPlan: (folderId: string) => ["study", "folder", folderId] as const,
  /** Сводки из памяти слов (#70): сбрасываются разом после занятия и правок словаря. */
  overview: ["study", "overview"] as const,
  folderProgress: ["study", "overview", "folders"] as const,
  folderMap: (folderId: string) => ["study", "overview", "folder", folderId] as const,
  wordProgress: (headword: string, reading: string | null) => ["study", "overview", "word", headword, reading ?? ""] as const,
  /**
   * Статья в листе (#79 #80 #84). Под `overview`: в ней слова пользователя со
   * стадиями — сбрасывается вместе со сводками после занятия и правок словаря.
   */
  dictionaryArticle: (headword: string, reading: string | null) =>
    ["study", "overview", "article", headword, reading ?? ""] as const,
  accountEmail: ["account", "email"] as const,
};
