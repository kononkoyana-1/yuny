import { GoalOutcomeSchema, GoalSchema } from "@yuny/shared";
import type { GoalDraft, GoalDraftInput, GoalRepository, JobRef } from "../goal.repository";
import { delay } from "./delay";
import { mockGoal, mockGoalOutcomes } from "./fixtures";

/**
 * Mock `GoalRepository` (TZ.md §6). Every returned value is parsed through
 * its Zod schema, exactly like a real Edge Function response would be
 * (TZ.md §6 "Валидация") — this is what makes swapping in
 * `SupabaseGoalRepository` in Phase 6 a no-op for every screen.
 */
export const mockGoalRepository: GoalRepository = {
  async getActive() {
    return delay(GoalSchema.parse(mockGoal));
  },

  async getOutcomes(goalId) {
    const rows = mockGoalOutcomes.filter((outcome) => outcome.goal_id === goalId);
    return delay(rows.map((row) => GoalOutcomeSchema.parse(row)));
  },

  async analyze(input: GoalDraftInput) {
    const jobRef: JobRef = { job_id: `mock-job-${Date.now()}`, kind: "goal_analyze" };
    return delay(jobRef, 800);
  },

  async confirm(draft: GoalDraft) {
    const confirmed = GoalSchema.parse({
      ...mockGoal,
      raw_input: draft.raw_input,
      title: draft.title,
      target_language: draft.target_language,
      deadline: draft.deadline,
      daily_minutes: draft.daily_minutes,
      status: "active",
    });
    return delay(confirmed, 600);
  },
};
