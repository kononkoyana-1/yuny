import type { Profile } from "@yuny/shared";

/** Частичное обновление `profiles` — клиент правит только свою строку (TZ.md §12). */
export type ProfileUpdateInput = Partial<Pick<Profile, "display_name">>;

/**
 * Домен `profiles` (TZ.md §13). Любая реализация обязана прогнать ответ через
 * `ProfileSchema` из `@yuny/shared` перед возвратом.
 */
export interface UserRepository {
  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfileUpdateInput): Promise<Profile>;
}
