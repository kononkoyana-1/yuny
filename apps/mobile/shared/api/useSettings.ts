import { useCallback, useRef, useState } from "react";
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

export type SaveState = "idle" | "saving" | "saved" | "error";

type SettingField = keyof LearningSettingsUpdate;

/**
 * Сохранение одной настройки повторений сразу при выборе
 * (settings.design.md §3.4): выбор виден сразу, уходит upsert одного поля.
 * Статус и откат решает только **последний** запрос поля — ответы на более
 * ранние быстрые выборы игнорируются. При ошибке значение возвращается к
 * последнему подтверждённому сервером, `retry` отправляет несохранённое.
 */
export function useSettingField<K extends SettingField>(field: K) {
  const client = useQueryClient();
  const seq = useRef(0);
  const confirmed = useRef<LearningSettings[K] | undefined>(undefined);
  const [state, setState] = useState<SaveState>("idle");
  const [failed, setFailed] = useState<LearningSettings[K] | null>(null);

  const save = useCallback(
    async (value: LearningSettings[K]) => {
      const current = client.getQueryData<LearningSettings>(queryKeys.learningSettings);
      if (!current) return;
      if (confirmed.current === undefined) confirmed.current = current[field];
      const id = ++seq.current;

      client.setQueryData<LearningSettings>(queryKeys.learningSettings, { ...current, [field]: value });
      setFailed(null);
      setState("saving");
      try {
        const saved = await learningSettingsRepository.update({ [field]: value } as LearningSettingsUpdate);
        if (id !== seq.current) return;
        confirmed.current = saved[field];
        client.setQueryData<LearningSettings>(queryKeys.learningSettings, (prev) =>
          prev ? { ...prev, [field]: saved[field] } : saved,
        );
        setState("saved");
      } catch {
        if (id !== seq.current) return;
        const rollback = confirmed.current;
        client.setQueryData<LearningSettings>(queryKeys.learningSettings, (prev) =>
          prev && rollback !== undefined ? { ...prev, [field]: rollback } : prev,
        );
        setFailed(value);
        setState("error");
      }
    },
    [client, field],
  );

  const retry = useCallback(() => {
    if (failed !== null) void save(failed);
  }, [failed, save]);

  return { state, save, retry };
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
