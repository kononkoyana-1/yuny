import { useQuery } from "@tanstack/react-query";
import { goalRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `GoalRepository.getOutcomes()` — enabled only once a goal id is known. */
export function useGoalOutcomes(goalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.goalOutcomes(goalId ?? "none"),
    queryFn: () => goalRepository.getOutcomes(goalId as string),
    enabled: Boolean(goalId),
  });
}
