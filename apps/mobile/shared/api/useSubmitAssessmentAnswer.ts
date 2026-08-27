import { useMutation } from "@tanstack/react-query";
import { assessmentRepository, type AssessmentAnswerInput } from "@/shared/repositories";

/** Wraps `AssessmentRepository.submitAnswer()` — the per-question primary action (screen 06). */
export function useSubmitAssessmentAnswer(goalId: string | undefined) {
  return useMutation({
    mutationFn: (answer: AssessmentAnswerInput) =>
      assessmentRepository.submitAnswer(goalId as string, answer),
  });
}
