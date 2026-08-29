import { RoadmapSchema } from "@yuny/shared";
import type { RoadmapRepository } from "../roadmap.repository";
import { delay } from "./delay";
import { mockRoadmap } from "./fixtures";

/**
 * Mock `RoadmapRepository` (TZ.md §6). Hands back the canned route
 * re-stamped with the caller's `goal_id`, the same way
 * `mockRecommendationRepository` does — the mock has one goal, and the
 * screens should not have to know that.
 */
export const mockRoadmapRepository: RoadmapRepository = {
  async getForGoal(goalId) {
    return delay(
      RoadmapSchema.parse({
        ...mockRoadmap,
        goal_id: goalId,
        modules: mockRoadmap.modules.map((module) => ({ ...module, goal_id: goalId })),
      }),
      300,
    );
  },
};
