import { useMutation, useQueryClient } from "@tanstack/react-query";
import { goalRepository, type GoalDraft } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `GoalRepository.confirm()` and invalidates the cached active goal. */
export function useConfirmGoal() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (draft: GoalDraft) => goalRepository.confirm(draft),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.activeGoal });
    },
  });
}
