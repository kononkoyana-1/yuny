import type { Mission, MissionResult, TaskResult } from "@yuny/shared";

/** What the client sends back for one task — shape depends on its type. */
export type TaskResponseInput = { selected_index: number } | { text: string };

/**
 * Mission domain repository (TZ.md §6 mock-first pattern) — backs the
 * Mission Overview → Task Screen → Result flow. `submitTask` is the single
 * write path (mirrors `activity-submit`, TZ.md §3 Rule 1: correctness and
 * feedback are always decided server-side, never on device).
 *
 * `getMissionResult` reads the same persisted rows every time rather than
 * accumulating results client-side, so the Result screen shows the same
 * thing live or after the app was restarted mid- or post-mission.
 */
export interface MissionRepository {
  getMission(missionId: string): Promise<Mission>;
  submitTask(activityId: string, response: TaskResponseInput): Promise<TaskResult>;
  getMissionResult(missionId: string): Promise<MissionResult>;
}
