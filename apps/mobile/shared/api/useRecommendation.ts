import { useQuery } from "@tanstack/react-query";
import { recommendationRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `RecommendationRepository.getForGoal()` — Home's Today's Mission
 * (TZ.md §8 row 09). Enabled only once a goal id is known, same pattern as
 * `useGoalOutcomes`.
 */
export function useRecommendation(goalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recommendation(goalId ?? "none"),
    queryFn: () => recommendationRepository.getForGoal(goalId as string),
    enabled: Boolean(goalId),
  });
}
