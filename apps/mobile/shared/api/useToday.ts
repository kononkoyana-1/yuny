import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionMinutes, SessionPreview } from "@yuny/shared";
import { learningSettingsRepository, studyRepository } from "@/shared/repositories";
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

/**
 * Окно «Повторим?» (#68): бюджет минут и «окно сегодня уже было». Обе вещи —
 * выбор человека в `learning_settings`, карточка «Сегодня» обновляется сразу,
 * не дожидаясь перезапроса.
 */
export function useTodayActions() {
  const client = useQueryClient();

  const patchToday = useCallback(
    (patch: Partial<SessionPreview>) =>
      client.setQueryData<SessionPreview>(queryKeys.today, (prev) => (prev ? { ...prev, ...patch } : prev)),
    [client],
  );

  /** «Позже» / «Начать»: сегодня окно больше не показываем. День — тот, что отдал сервер. */
  const markPromptShown = useCallback(
    async (day: string) => {
      patchToday({ show_daily_prompt: false });
      await learningSettingsRepository.update({ last_prompt_on: day });
      void client.invalidateQueries({ queryKey: queryKeys.learningSettings });
    },
    [client, patchToday],
  );

  const saveBudget = useCallback(
    async (minutes: SessionMinutes, promptDay?: string) => {
      await learningSettingsRepository.update({
        session_minutes: minutes,
        ...(promptDay ? { last_prompt_on: promptDay } : {}),
      });
      patchToday({ budget_minutes: minutes, ...(promptDay ? { show_daily_prompt: false } : {}) });
      void client.invalidateQueries({ queryKey: queryKeys.learningSettings });
    },
    [client, patchToday],
  );

  return { markPromptShown, saveBudget };
}

/** Что предложить на экране папки (#69): главный режим, остальные, нагрузка на завтра. */
export function useFolderPlan(folderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.folderPlan(folderId ?? ""),
    queryFn: () => studyRepository.folderPlan(folderId!),
    enabled: Boolean(folderId),
  });
}

/** Стадии и «пора освежить» по каждой папке — «Мой словарь» (#70). */
export function useFolderProgress() {
  return useQuery({ queryKey: queryKeys.folderProgress, queryFn: () => studyRepository.folderProgress() });
}

/** Карта папки (#70). */
export function useFolderMap(folderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.folderMap(folderId ?? ""),
    queryFn: () => studyRepository.folderMap(folderId!),
    enabled: Boolean(folderId),
  });
}

/** Карточка слова (#70); `null` — слово не выбрано. */
export function useWordProgress(word: { headword: string; reading: string | null } | null) {
  return useQuery({
    queryKey: queryKeys.wordProgress(word?.headword ?? "", word?.reading ?? null),
    queryFn: () => studyRepository.wordProgress(word!),
    enabled: word !== null,
  });
}
