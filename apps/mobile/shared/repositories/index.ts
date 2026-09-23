import { mockUserRepository } from "./mock/user.repository.mock";
import { mockModuleRepository } from "./mock/module.repository.mock";
import { mockDictionaryRepository } from "./mock/dictionary.repository.mock";
import { supabaseUserRepository } from "./supabase/user.repository.supabase";
import { supabaseModuleRepository } from "./supabase/module.repository.supabase";
import { supabaseDictionaryRepository } from "./supabase/dictionary.repository.supabase";
import type { UserRepository } from "./user.repository";
import type { ModuleRepository } from "./module.repository";
import type { DictionaryRepository } from "./dictionary.repository";
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

export type { ProfileUpdateInput, UserRepository } from "./user.repository";
export type { ModuleRepository, UploadFileInput, JobRef } from "./module.repository";
export type { DictionaryRepository } from "./dictionary.repository";
