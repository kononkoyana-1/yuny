import { useQuery } from "@tanstack/react-query";
import { goalRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `GoalRepository.getAnalysis()` — the resolved `goal_analyze` job result (screen 04). */
export function useGoalAnalysis(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.goalAnalysis(jobId ?? "none"),
    queryFn: () => goalRepository.getAnalysis(jobId as string),
    enabled: Boolean(jobId),
  });
}
