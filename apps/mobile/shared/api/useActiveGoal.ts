import { useQuery } from "@tanstack/react-query";
import { goalRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `GoalRepository.getActive()` — components never call the repository directly. */
export function useActiveGoal() {
  return useQuery({
    queryKey: queryKeys.activeGoal,
    queryFn: () => goalRepository.getActive(),
  });
}
