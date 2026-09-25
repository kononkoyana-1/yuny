import { useQuery } from "@tanstack/react-query";
import { studyRepository, type StartStudyInput } from "@/shared/repositories";
import { answersDrained } from "./useStudySession";

/**
 * Задания сессии (#67). Сессия собирается один раз на заход: перезапрос
 * выдал бы новые билеты и перемешал бы очередь посреди занятия. `run` —
 * номер захода: «Ещё 7» с теми же параметрами — новый заход, не старый ответ.
 */
export function useStartSession(input: StartStudyInput, run?: string) {
  return useQuery({
    queryKey: ["study", "session", input, run ?? null],
    queryFn: async () => {
      await answersDrained().catch(() => undefined);
      return studyRepository.start(input);
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
