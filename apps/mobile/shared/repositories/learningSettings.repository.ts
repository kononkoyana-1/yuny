import type { LearningSettings } from "@yuny/shared";

/** Что можно поменять в настройках повторений (день окна «Повторим?» ставит сервер). */
export type LearningSettingsUpdate = Partial<Pick<LearningSettings, "session_minutes" | "max_new" | "retention">>;

/**
 * Настройки ежедневных повторений (`learning_settings`, #58). Строки нет —
 * действуют значения по умолчанию из `LEARNING_SETTINGS_DEFAULTS`; первая
 * запись создаёт строку. Ответ прогоняется через `LearningSettingsSchema`.
 */
export interface LearningSettingsRepository {
  get(): Promise<LearningSettings>;
  update(patch: LearningSettingsUpdate): Promise<LearningSettings>;
}
