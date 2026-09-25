import { useQuery } from "@tanstack/react-query";
import { studyRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Карточка «Сегодня» над словарём (#66): состояние, три плана, прогноз.
 * Фоновый перезапрос держит прежние данные (today-session.design.md §5).
 */
export function useToday({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.today,
    queryFn: () => studyRepository.preview(),
    enabled,
  });
}
