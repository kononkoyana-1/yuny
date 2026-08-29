import { useMutation, useQueryClient } from "@tanstack/react-query";
import { goalRepository, type GoalDraft } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `GoalRepository.confirm()` and writes the new goal straight into the
 * active-goal cache.
 *
 * `setQueryData` rather than `invalidateQueries`, because invalidating a query
 * nothing is currently subscribed to only marks it stale — it does not refetch.
 * The app opens on `/`, where the tab gate asks for the active goal, gets null
 * (there is none yet) and caches that null before sending the user into
 * onboarding. Coming back at the end, the gate reads that stale null, decides
 * the user has no goal and bounces them to Welcome — the refetch lands a moment
 * too late to matter. Writing the real goal in closes that window entirely.
 */
export function useConfirmGoal() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (draft: GoalDraft) => goalRepository.confirm(draft),
    onSuccess: (goal) => {
      client.setQueryData(queryKeys.activeGoal, goal);
    },
  });
}
