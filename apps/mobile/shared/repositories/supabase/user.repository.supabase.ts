import type { UserRepository } from "../user.repository";

const NOT_IMPLEMENTED =
  "SupabaseUserRepository is not implemented yet — Supabase wiring lands in TZ.md Phase 6.";

/**
 * Real implementation lands in Phase 6 (TZ.md §19): SELECT/UPDATE on the
 * caller's own `profiles` row via RLS. Selected instead of the mock
 * repository via `EXPO_PUBLIC_DATA_SOURCE=supabase`.
 */
export const supabaseUserRepository: UserRepository = {
  async getProfile() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async updateProfile() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
