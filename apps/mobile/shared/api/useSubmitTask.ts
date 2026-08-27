import { useMutation, useQueryClient } from "@tanstack/react-query";
import { missionRepository, type TaskResponseInput } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `MissionRepository.submitTask()` — the Task Screen's primary
 * action. Invalidates the mission (so a task's `status` refetches as
 * completed) and its result (so Mission Result reflects this submission
 * immediately, not just after a restart).
 */
export function useSubmitTask(missionId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, response }: { activityId: string; response: TaskResponseInput }) =>
      missionRepository.submitTask(activityId, response),
    onSuccess: () => {
      if (!missionId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.mission(missionId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.missionResult(missionId) });
    },
  });
}
