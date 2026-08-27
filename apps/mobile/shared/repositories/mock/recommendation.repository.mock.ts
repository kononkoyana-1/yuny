import { RecommendationSchema } from "@yuny/shared";
import type { RecommendationRepository } from "../recommendation.repository";
import { delay } from "./delay";
import { mockRecommendation } from "./fixtures";

/**
 * Mock `RecommendationRepository` (TZ.md §6). Always resolves to the same
 * canned "one best next action" for the mock goal, re-stamped with the
 * caller's `goal_id` — same pattern as `mockAssessmentRepository.complete()`.
 */
export const mockRecommendationRepository: RecommendationRepository = {
  async getForGoal(goalId) {
    return delay(
      RecommendationSchema.parse({ ...mockRecommendation, goal_id: goalId }),
      350,
    );
  },
};
