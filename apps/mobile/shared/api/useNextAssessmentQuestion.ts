import { useQuery } from "@tanstack/react-query";
import { assessmentRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Wraps `AssessmentRepository.getNextQuestion()` (screen 06). `answeredIds`
 * is part of the query key on purpose — each new answer changes the key, so
 * submitting one naturally fetches the next question with no manual refetch.
 * `null` means the assessment is done.
 */
export function useNextAssessmentQuestion(goalId: string | undefined, answeredIds: string[]) {
  return useQuery({
    queryKey: queryKeys.assessmentQuestion(goalId ?? "none", answeredIds),
    queryFn: () => assessmentRepository.getNextQuestion(goalId as string, answeredIds),
    enabled: Boolean(goalId),
  });
}
