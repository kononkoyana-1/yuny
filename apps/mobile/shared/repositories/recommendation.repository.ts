import type { Recommendation } from "@yuny/shared";

/**
 * `recommendation-get(goal_id)` domain repository (TZ.md §6 mock-first
 * pattern) — backs Home's Today's Mission (TZ.md §8 row 09). Resolves to
 * `null` for the "No Mission" empty state (TZ.md §10 Empty: "Let's figure
 * out what would help you most") — the system does not always have a next
 * action ready.
 */
export interface RecommendationRepository {
  getForGoal(goalId: string): Promise<Recommendation | null>;
}
