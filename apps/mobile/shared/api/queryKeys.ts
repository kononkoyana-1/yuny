/**
 * Centralized query key factory so mutations invalidate the exact keys
 * TZ.md §17 requires (e.g. `activity-submit` invalidates `learning_state`,
 * `mascot_state`, `recommendation`).
 */
export const queryKeys = {
  profile: ["profile"] as const,
  activeGoal: ["goal", "active"] as const,
  goalOutcomes: (goalId: string) => ["goal", goalId, "outcomes"] as const,
  goalAnalysis: (jobId: string) => ["goal", "analysis", jobId] as const,
  assessmentQuestion: (goalId: string, answeredIds: string[]) =>
    ["assessment", "question", goalId, ...answeredIds] as const,
  assessmentResult: (jobId: string) => ["assessment", "result", jobId] as const,
  recommendation: (goalId: string) => ["recommendation", goalId] as const,
  mission: (missionId: string) => ["mission", missionId] as const,
  missionResult: (missionId: string) => ["mission", missionId, "result"] as const,
};
