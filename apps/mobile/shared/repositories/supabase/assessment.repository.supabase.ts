import { AssessmentQuestionSchema, AssessmentResultSchema } from "@yuny/shared";
import { z } from "zod";
import { BackendError } from "@/shared/lib/backendError";
import { invokeEdge } from "@/shared/lib/edge";
import { awaitJob, jobRefSchema } from "@/shared/lib/jobs";
import { requireUserId } from "@/shared/lib/auth";
import { getSupabase } from "@/shared/lib/supabase";
import type { AssessmentAnswerInput, AssessmentRepository } from "../assessment.repository";
import type { JobRef } from "../goal.repository";

/** `assessment-next` answers with the next question or `{ done: true }`. */
const NextQuestionSchema = z.discriminatedUnion("done", [
  z.object({ done: z.literal(true), question: z.null() }),
  z.object({ done: z.literal(false), question: AssessmentQuestionSchema }),
]);

/**
 * Questions come from an Edge Function rather than a table read: the bank
 * holds the correct answer, and the client must never see it (TZ.md §3
 * Rule 1). Raw answers, which carry no judgement, are inserted directly —
 * the one INSERT right the client has besides its own profile.
 */
export const supabaseAssessmentRepository: AssessmentRepository = {
  async getNextQuestion(goalId, answeredIds) {
    const response = await invokeEdge("assessment-next", {
      goal_id: goalId,
      answered_ids: answeredIds,
    });
    const parsed = NextQuestionSchema.parse(response);
    return parsed.done ? null : parsed.question;
  },

  async submitAnswer(goalId: string, answer: AssessmentAnswerInput) {
    const userId = await requireUserId();
    const { error } = await getSupabase().from("assessment_answers").insert({
      user_id: userId,
      goal_id: goalId,
      question_id: answer.question_id,
      selected_index: answer.selected_index,
    });
    if (error) throw new BackendError("answer_not_saved");
  },

  async complete(goalId) {
    const job = await invokeEdge<JobRef>("assessment-complete", { goal_id: goalId });
    return jobRefSchema("assessment_evaluate").parse(job);
  },

  async getResult(jobId) {
    const result = await awaitJob(jobId);
    return AssessmentResultSchema.parse(result);
  },
};
