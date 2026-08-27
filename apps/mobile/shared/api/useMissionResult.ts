import { useQuery } from "@tanstack/react-query";
import { missionRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `MissionRepository.getMissionResult()` — Mission Result. Reads the
 * same persisted rows every time, so this renders identically whether the
 * user just finished the mission or reopened it after restarting the app.
 */
export function useMissionResult(missionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.missionResult(missionId ?? "none"),
    queryFn: () => missionRepository.getMissionResult(missionId as string),
    enabled: Boolean(missionId),
  });
}
