import type { AssessmentQuestion, AssessmentResult } from "@yuny/shared";
import type { JobRef } from "./goal.repository";

/** Raw answer for one question — sent as-is, never scored on-device (TZ.md §3 Rule 1). */
export interface AssessmentAnswerInput {
  question_id: string;
  selected_index: number;
}

/**
 * Screen 06 (Initial Assessment) domain repository (TZ.md §6 mock-first
 * pattern, proposed — not yet in the codebase). Mirrors the real
 * `assessment-next`/`assessment-complete` Edge Functions (TZ.md §6):
 * `getNextQuestion` takes the ids already answered and returns the next
 * question or `null` ("done"); `submitAnswer` records one raw answer;
 * `complete` kicks the `assessment_evaluate` job; `getResult` fetches its
 * resolved output once ready — same async-job shape as `GoalRepository`'s
 * `analyze()`/`getAnalysis()`.
 */
export interface AssessmentRepository {
  getNextQuestion(
    goalId: string,
    answeredIds: string[],
  ): Promise<AssessmentQuestion | null>;
  submitAnswer(goalId: string, answer: AssessmentAnswerInput): Promise<void>;
  complete(goalId: string): Promise<JobRef>;
  getResult(jobId: string): Promise<AssessmentResult>;
}
