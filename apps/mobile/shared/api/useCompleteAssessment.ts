import { useMutation } from "@tanstack/react-query";
import { assessmentRepository } from "@/shared/repositories";

/** Wraps `AssessmentRepository.complete()` — kicks off the `assessment_evaluate` job. */
export function useCompleteAssessment() {
  return useMutation({
    mutationFn: (goalId: string) => assessmentRepository.complete(goalId),
  });
}
