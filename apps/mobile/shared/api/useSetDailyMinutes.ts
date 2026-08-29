import { useMutation, useQueryClient } from "@tanstack/react-query";
import { goalRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `GoalRepository.setDailyMinutes()` — screen 08's time commitment.
 *
 * Invalidates the active goal because Home reads `daily_minutes` from it: the
 * lesson count shown there is derived from this number, so a stale cache would
 * greet the learner with a plan sized for a time they did not choose.
 */
export function useSetDailyMinutes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, dailyMinutes }: { goalId: string; dailyMinutes: number }) =>
      goalRepository.setDailyMinutes(goalId, dailyMinutes),
    onSuccess: (goal) => {
      // The mutation already returns the updated goal, so the cache is written
      // directly — see `useConfirmGoal` for why an invalidation is not enough
      // here.
      queryClient.setQueryData(queryKeys.activeGoal, goal);
    },
  });
}
