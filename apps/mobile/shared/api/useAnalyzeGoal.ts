import { useMutation } from "@tanstack/react-query";
import { goalRepository, type GoalDraftInput } from "@/shared/repositories";

/** Wraps `GoalRepository.analyze()` — kicks off the async `goal_analyze` job (TZ.md §6). */
export function useAnalyzeGoal() {
  return useMutation({
    mutationFn: (input: GoalDraftInput) => goalRepository.analyze(input),
  });
}
