import { useQuery } from "@tanstack/react-query";
import { assessmentRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `AssessmentRepository.getResult()` — the resolved `assessment_evaluate` job (screens 07-08). */
export function useAssessmentResult(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assessmentResult(jobId ?? "none"),
    queryFn: () => assessmentRepository.getResult(jobId as string),
    enabled: Boolean(jobId),
  });
}
