import type { GoalRepository } from "../goal.repository";

const NOT_IMPLEMENTED =
  "SupabaseGoalRepository is not implemented yet — Supabase wiring lands in TZ.md Phase 6.";

/**
 * Real implementation lands in Phase 6 (TZ.md §19): Edge Function calls for
 * `goal-analyze`/`goal-confirm`, SELECT via RLS for `getActive`/`getOutcomes`.
 * Selected instead of the mock repository via `EXPO_PUBLIC_DATA_SOURCE=supabase`.
 */
export const supabaseGoalRepository: GoalRepository = {
  async getActive() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async getOutcomes() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async analyze() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async confirm() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
