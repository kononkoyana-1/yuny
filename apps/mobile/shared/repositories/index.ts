import { mockUserRepository } from "./mock/user.repository.mock";
import { supabaseUserRepository } from "./supabase/user.repository.supabase";
import type { UserRepository } from "./user.repository";
import { DATA_SOURCE } from "@/shared/config/dataSource";

/**
 * Выбор реализации репозитория (TZ.md §13). Обе ветки живые: `mock` не ходит
 * в сеть, `supabase` работает с настоящим бэкендом. Экраны импортируют
 * готовый экземпляр и не знают, какой именно им достался.
 */

export const userRepository: UserRepository =
  DATA_SOURCE === "supabase" ? supabaseUserRepository : mockUserRepository;

export type { ProfileUpdateInput, UserRepository } from "./user.repository";
