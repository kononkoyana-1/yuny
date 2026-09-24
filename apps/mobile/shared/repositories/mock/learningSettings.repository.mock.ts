import { LEARNING_SETTINGS_DEFAULTS, LearningSettingsSchema, type LearningSettings } from "@yuny/shared";
import type { LearningSettingsRepository, LearningSettingsUpdate } from "../learningSettings.repository";
import { delay } from "./delay";

/** В памяти: запись читается обратно в той же сессии. */
let current: LearningSettings = LearningSettingsSchema.parse({ ...LEARNING_SETTINGS_DEFAULTS });

export const mockLearningSettingsRepository: LearningSettingsRepository = {
  async get() {
    return delay(current);
  },

  async update(patch: LearningSettingsUpdate) {
    current = LearningSettingsSchema.parse({ ...current, ...patch });
    return delay(current, 300);
  },
};
