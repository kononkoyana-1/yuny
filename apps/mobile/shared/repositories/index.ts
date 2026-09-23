import { mockUserRepository } from "./mock/user.repository.mock";
import { mockModuleRepository } from "./mock/module.repository.mock";
import { mockDictionaryRepository } from "./mock/dictionary.repository.mock";
import { mockUserDictionaryRepository } from "./mock/userDictionary.repository.mock";
import { mockWordsRepository } from "./mock/words.repository.mock";
import { supabaseUserRepository } from "./supabase/user.repository.supabase";
import { supabaseModuleRepository } from "./supabase/module.repository.supabase";
import { supabaseDictionaryRepository } from "./supabase/dictionary.repository.supabase";
import { supabaseUserDictionaryRepository } from "./supabase/userDictionary.repository.supabase";
import { supabaseWordsRepository } from "./supabase/words.repository.supabase";
import type { UserRepository } from "./user.repository";
import type { ModuleRepository } from "./module.repository";
import type { DictionaryRepository } from "./dictionary.repository";
import type { UserDictionaryRepository } from "./userDictionary.repository";
import type { WordsRepository } from "./words.repository";
import { DATA_SOURCE } from "@/shared/config/dataSource";

/**
 * Выбор реализации репозитория (TZ.md §13). Обе ветки живые: `mock` не ходит
 * в сеть, `supabase` работает с настоящим бэкендом. Экраны импортируют
 * готовый экземпляр и не знают, какой именно им достался.
 */

export const userRepository: UserRepository =
  DATA_SOURCE === "supabase" ? supabaseUserRepository : mockUserRepository;

export const moduleRepository: ModuleRepository =
  DATA_SOURCE === "supabase" ? supabaseModuleRepository : mockModuleRepository;

export const dictionaryRepository: DictionaryRepository =
  DATA_SOURCE === "supabase" ? supabaseDictionaryRepository : mockDictionaryRepository;

export const userDictionaryRepository: UserDictionaryRepository =
  DATA_SOURCE === "supabase" ? supabaseUserDictionaryRepository : mockUserDictionaryRepository;

export const wordsRepository: WordsRepository =
  DATA_SOURCE === "supabase" ? supabaseWordsRepository : mockWordsRepository;

export type { ProfileUpdateInput, UserRepository } from "./user.repository";
export type { ModuleRepository, UploadFileInput, JobRef } from "./module.repository";
export type { DictionaryRepository } from "./dictionary.repository";
export type { UserDictionaryRepository, SaveWordInput } from "./userDictionary.repository";
export type { WordsRepository } from "./words.repository";
