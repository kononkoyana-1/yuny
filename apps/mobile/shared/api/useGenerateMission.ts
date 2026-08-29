import { useMutation } from "@tanstack/react-query";
import { missionRepository } from "@/shared/repositories";

/**
 * Wraps `MissionRepository.generate()` + `getGenerated()` — kicks off the
 * `mission_generate` job and awaits it in one call, so callers get back a
 * ready `mission_id` rather than having to juggle the job two-step
 * themselves. Used once, from onboarding's last screen: TZ.md's learning
 * loop assumes a learner always has a mission by the time they reach Home,
 * so this runs before "Start Learning" is allowed to finish, not reactively
 * from Home's empty state.
 */
export function useGenerateMission() {
  return useMutation({
    mutationFn: async (goalId: string) => {
      const job = await missionRepository.generate(goalId);
      return missionRepository.getGenerated(job.job_id);
    },
  });
}
