import { LEARNING_SETTINGS_DEFAULTS, LearningSettingsSchema, type LearningSettings } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import type { LearningSettingsRepository, LearningSettingsUpdate } from "../learningSettings.repository";
import { delay } from "./delay";

/**
 * Переключатель состояний экрана настроек (settings.design.md §5), по образцу
 * `EXPO_PUBLIC_MOCK_DICTIONARY_ERROR`:
 *   `load_error` — настройки не загрузились;
 *   `save_error` — каждое сохранение падает (откат и «Повторить»);
 *   `slow`       — сохранение идёт 2 секунды (виден «Сохраняем…»).
 */
const MOCK_SETTINGS = process.env.EXPO_PUBLIC_MOCK_SETTINGS;

/** В памяти: запись читается обратно в той же сессии. */
let current: LearningSettings = LearningSettingsSchema.parse({ ...LEARNING_SETTINGS_DEFAULTS });

export const mockLearningSettingsRepository: LearningSettingsRepository = {
  async get() {
    if (MOCK_SETTINGS === "load_error") {
      await delay(null);
      throw new BackendError("settings_load_failed");
    }
    return delay(current);
  },

  async update(patch: LearningSettingsUpdate) {
    if (MOCK_SETTINGS === "save_error") {
      await delay(null, 400);
      throw new BackendError("settings_save_failed");
    }
    current = LearningSettingsSchema.parse({ ...current, ...patch });
    return delay(current, MOCK_SETTINGS === "slow" ? 2000 : 300);
  },
};
