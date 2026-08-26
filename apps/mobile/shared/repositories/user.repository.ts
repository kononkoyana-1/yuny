import type { Profile } from "@yuny/shared";

/** Partial update for `profiles` — client has UPDATE rights on its own row (TZ.md §5). */
export type ProfileUpdateInput = Partial<
  Pick<Profile, "native_language" | "ui_language" | "display_name">
>;

/**
 * `profiles` domain repository (TZ.md §6 mock-first pattern). Every
 * implementation must parse its response through `ProfileSchema` from
 * `@yuny/shared` before returning — see `mock/user.repository.mock.ts`.
 */
export interface UserRepository {
  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfileUpdateInput): Promise<Profile>;
}
