import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LearningSettings } from "@yuny/shared";
import {
  learningSettingsRepository,
  userRepository,
  type LearningSettingsUpdate,
} from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Настройки повторений (`learning_settings`); строки нет — значения по умолчанию. */
export function useLearningSettings() {
  return useQuery({
    queryKey: queryKeys.learningSettings,
    queryFn: () => learningSettingsRepository.get(),
  });
}

/**
 * Сохраняет выбор сразу, без кнопки «Сохранить»: экран показывает новое
 * значение до ответа сервера и откатывает его, если запись не удалась.
 */
export function useUpdateLearningSettings() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (patch: LearningSettingsUpdate) => learningSettingsRepository.update(patch),
    onMutate: async (patch) => {
      await client.cancelQueries({ queryKey: queryKeys.learningSettings });
      const previous = client.getQueryData<LearningSettings>(queryKeys.learningSettings);
      if (previous) {
        client.setQueryData<LearningSettings>(queryKeys.learningSettings, { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) client.setQueryData(queryKeys.learningSettings, context.previous);
    },
    onSuccess: (saved) => {
      client.setQueryData(queryKeys.learningSettings, saved);
    },
  });
}

/** Почта из входа — только для показа. */
export function useAccountEmail() {
  return useQuery({
    queryKey: queryKeys.accountEmail,
    queryFn: () => userRepository.getEmail(),
  });
}

/** Удаление аккаунта; после успеха кэш чистится, AuthGate уводит на вход. */
export function useDeleteAccount() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => userRepository.deleteAccount(),
    onSuccess: () => {
      client.clear();
    },
  });
}
