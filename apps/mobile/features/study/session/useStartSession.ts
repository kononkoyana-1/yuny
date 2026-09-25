import { useQuery } from "@tanstack/react-query";
import { studyRepository, type StartStudyInput } from "@/shared/repositories";

/**
 * Задания сессии (#67). Сессия собирается один раз на заход: перезапрос
 * выдал бы новые билеты и перемешал бы очередь посреди занятия.
 */
export function useStartSession(input: StartStudyInput) {
  return useQuery({
    queryKey: ["study", "session", input],
    queryFn: () => studyRepository.start(input),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
