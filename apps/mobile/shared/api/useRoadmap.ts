import { useQuery } from "@tanstack/react-query";
import { roadmapRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `RoadmapRepository.getForGoal()` — the route shown on Home and on
 * screen 08. Enabled only once a goal id is known, same pattern as
 * `useRecommendation`.
 *
 * Resolving to `null` is expected, not an error: until the backend builds a
 * route (plan-tasks "Этап 6") there is no map, and callers render nothing
 * rather than an error state.
 */
export function useRoadmap(goalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.roadmap(goalId ?? "none"),
    queryFn: () => roadmapRepository.getForGoal(goalId as string),
    enabled: Boolean(goalId),
  });
}
