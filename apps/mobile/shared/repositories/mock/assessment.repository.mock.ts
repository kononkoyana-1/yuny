import { AssessmentQuestionSchema, AssessmentResultSchema } from "@yuny/shared";
import type { AssessmentAnswerInput, AssessmentRepository } from "../assessment.repository";
import type { JobRef } from "../goal.repository";
import { delay } from "./delay";
import { mockAssessmentQuestions, mockAssessmentResult } from "./fixtures";

/**
 * In-memory `assessment_evaluate` job results, keyed by `job_id` (TZ.md §6
 * async job pattern). Never evicted — same accepted mock-mode lifetime as
 * `analysisJobs` in `goal.repository.mock.ts`.
 */
const resultJobs = new Map<string, ReturnType<typeof AssessmentResultSchema.parse>>();

/**
 * Mock `AssessmentRepository` (TZ.md §6). Answers are accepted and
 * discarded — same "no real scoring on-device" spirit as every other mock
 * here — `complete()` always resolves to the same canned, realistic result
 * (`mockAssessmentResult`), just re-stamped with the caller's `goal_id`.
 */
export const mockAssessmentRepository: AssessmentRepository = {
  async getNextQuestion(_goalId, answeredIds) {
    const next = mockAssessmentQuestions.find((question) => !answeredIds.includes(question.id));
    if (!next) {
      return delay(null, 300);
    }
    return delay(AssessmentQuestionSchema.parse(next), 300);
  },

  async submitAnswer(_goalId: string, _answer: AssessmentAnswerInput) {
    await delay(undefined, 200);
  },

  async complete(goalId) {
    const jobRef: JobRef = { job_id: `mock-job-${Date.now()}`, kind: "assessment_evaluate" };
    resultJobs.set(
      jobRef.job_id,
      AssessmentResultSchema.parse({ ...mockAssessmentResult, goal_id: goalId }),
    );
    return delay(jobRef, 900);
  },

  async getResult(jobId) {
    const result = resultJobs.get(jobId);
    if (!result) {
      throw new Error(`No assessment result found for job ${jobId}`);
    }
    return delay(result, 300);
  },
};
