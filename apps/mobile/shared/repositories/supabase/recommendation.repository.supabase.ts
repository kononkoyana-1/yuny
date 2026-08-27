import { RecommendationSchema } from "@yuny/shared";
import { z } from "zod";
import { invokeEdge } from "@/shared/lib/edge";
import type { RecommendationRepository } from "../recommendation.repository";

/**
 * `recommendation-get` answers with the one best next action, or `null` when
 * there is no mission ready — Home renders the "No Mission" empty state in
 * that case (TZ.md §10 Empty).
 */
const ResponseSchema = z.object({
  recommendation: RecommendationSchema.nullable(),
});

/**
 * Which skill to work on and why is decided server-side and stored on the
 * `recommendations` row (TZ.md §3 Rule 1, §16) — this only fetches it, so
 * Home's "Why this?" shows the same sentence the backend committed to.
 */
export const supabaseRecommendationRepository: RecommendationRepository = {
  async getForGoal(goalId) {
    const response = await invokeEdge("recommendation-get", { goal_id: goalId });
    return ResponseSchema.parse(response).recommendation;
  },
};
