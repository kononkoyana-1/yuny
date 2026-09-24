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
  /** Почта, с которой человек вошёл; `null`, если вход без почты. */
  getEmail(): Promise<string | null>;
  /**
   * Удаляет аккаунт целиком (Edge Function `account-delete`, #40): файлы, все
   * строки пользователя каскадом, самого пользователя. После — выход.
   */
  deleteAccount(): Promise<void>;
}
