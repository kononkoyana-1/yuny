/**
 * Centralized query key factory so mutations invalidate the exact keys
 * TZ.md §17 requires (e.g. `activity-submit` invalidates `learning_state`,
 * `mascot_state`, `recommendation`).
 */
export const queryKeys = {
  profile: ["profile"] as const,
  activeGoal: ["goal", "active"] as const,
  goalOutcomes: (goalId: string) => ["goal", goalId, "outcomes"] as const,
};
