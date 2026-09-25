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
  accountEmail: ["account", "email"] as const,
};
