import {
  FolderNameSchema,
  UserDictionaryFolderSchema,
  UserDictionaryItemSchema,
  type UserDictionaryFolder,
  type UserDictionaryItem,
} from "@yuny/shared";
import { z } from "zod";
import { BackendError } from "@/shared/lib/backendError";
import { uuid } from "@/shared/lib/uuid";
import type { UserDictionaryRepository } from "../userDictionary.repository";
import { delay } from "./delay";
import { mockDictionary } from "./dictionary.fixtures";

/**
 * Свой словарь в памяти: живёт до перезагрузки страницы. Две папки и три
 * слова для старта — одно из них (好) лежит в обеих, как это бывает у
 * настоящего пользователя.
 */
const folders: UserDictionaryFolder[] = [
  { id: "7c1f5a2e-3b4d-4e8f-9a01-2b3c4d5e6f70", name: "Еда", created_at: "2026-09-20T10:00:00.000Z" },
  { id: "8d2a6b3f-4c5e-4f90-8b12-3c4d5e6f7a81", name: "Урок 3", created_at: "2026-09-21T10:00:00.000Z" },
];

function entryFor(headword: string) {
  const entry = mockDictionary.find((e) => e.headword === headword);
  if (!entry) return null;
  const { id, reading, senses, compact } = entry;
  return { id, headword, reading, senses, compact };
}

/**
 * Как последовательность `user_dictionary_items.position`: общий счётчик,
 * порядок добавления внутри папки. Стартовые слова пронумерованы по
 * `created_at`, как при переносе старых строк.
 */
let nextPosition = 1;

function item(folderId: string, headword: string, createdAt: string, position: number): UserDictionaryItem {
  const entry = entryFor(headword);
  return {
    id: uuid(),
    folder_id: folderId,
    headword,
    reading: entry?.reading ?? null,
    // Как `shortMeaning` в features/dictionary/article.ts — копия значения (#36).
    translation: entry ? entry.compact.slice(0, 3).join("; ") : null,
    translation_source: entry ? "dictionary" : null,
    position,
    created_at: createdAt,
    entry,
  };
}

const seed: [folder: number, headword: string, createdAt: string][] = [
  [0, "好吃", "2026-09-22T09:00:00.000Z"],
  [0, "好", "2026-09-21T09:00:00.000Z"],
  [1, "好", "2026-09-21T08:00:00.000Z"],
  [1, "打电话", "2026-09-20T08:00:00.000Z"],
  [1, "多少钱", "2026-09-20T07:00:00.000Z"],
  [1, "便宜", "2026-09-20T06:00:00.000Z"],
  [1, "买", "2026-09-20T05:00:00.000Z"],
  [1, "一路平安", "2026-09-20T04:00:00.000Z"],
  [1, "上海", "2026-09-20T03:00:00.000Z"],
];

// Списком — новые первыми, как отдаёт `listItems` на сервере.
let items: UserDictionaryItem[] = [...seed]
  .sort((a, b) => a[2].localeCompare(b[2]))
  .map(([folder, headword, createdAt]) => item(folders[folder]!.id, headword, createdAt, nextPosition++))
  .reverse();

function nameTaken(name: string, exceptId?: string): boolean {
  const key = name.trim().toLocaleLowerCase("ru");
  return folders.some((f) => f.id !== exceptId && f.name.trim().toLocaleLowerCase("ru") === key);
}

export const mockUserDictionaryRepository: UserDictionaryRepository = {
  async listFolders() {
    const sorted = [...folders].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    return delay(z.array(UserDictionaryFolderSchema).parse(sorted), 250);
  },

  async createFolder(name) {
    const clean = FolderNameSchema.parse(name);
    await delay(undefined, 250);
    if (nameTaken(clean)) throw new BackendError("folder_name_taken");
    const folder = { id: uuid(), name: clean, created_at: new Date().toISOString() };
    folders.push(folder);
    return UserDictionaryFolderSchema.parse(folder);
  },

  async renameFolder(id, name) {
    const clean = FolderNameSchema.parse(name);
    await delay(undefined, 250);
    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new BackendError("internal_error");
    if (nameTaken(clean, id)) throw new BackendError("folder_name_taken");
    folder.name = clean;
    return UserDictionaryFolderSchema.parse(folder);
  },

  async deleteFolder(id) {
    await delay(undefined, 250);
    const index = folders.findIndex((f) => f.id === id);
    if (index >= 0) folders.splice(index, 1);
    items = items.filter((i) => i.folder_id !== id);
  },

  async listItems() {
    return delay(z.array(UserDictionaryItemSchema).parse(items), 250);
  },

  async addItem(folderId, word) {
    await this.addItems(folderId, [word]);
  },

  async addItems(folderId, words) {
    await delay(undefined, 200);
    let added = 0;
    for (const word of words) {
      const exists = items.some(
        (i) => i.folder_id === folderId && i.headword === word.headword && i.reading === word.reading,
      );
      if (exists) continue;
      items = [
        {
          id: uuid(),
          folder_id: folderId,
          headword: word.headword,
          reading: word.reading,
          translation: word.translation ?? null,
          translation_source: word.translation ? (word.translationSource ?? null) : null,
          // В конец папки; пачка из файла — в порядке списка.
          position: nextPosition++,
          created_at: new Date().toISOString(),
          entry: word.entryId === null ? null : entryFor(word.headword),
        },
        ...items,
      ];
      added += 1;
    }
    return added;
  },

  async removeItem(itemId) {
    await delay(undefined, 200);
    items = items.filter((i) => i.id !== itemId);
  },
};
