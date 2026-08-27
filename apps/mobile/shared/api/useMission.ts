import { useQuery } from "@tanstack/react-query";
import { missionRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `MissionRepository.getMission()` — Mission Overview and the Task Screen. */
export function useMission(missionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mission(missionId ?? "none"),
    queryFn: () => missionRepository.getMission(missionId as string),
    enabled: Boolean(missionId),
  });
}
