import type { LearningSettings } from "@yuny/shared";

/**
 * Что можно поменять в настройках повторений. `last_prompt_on` — день, когда
 * окно «Повторим?» уже показали: клиент пишет день, который ему отдал сервер
 * (`SessionPreview.today`), — граница суток считается там.
 */
export type LearningSettingsUpdate = Partial<
  Pick<LearningSettings, "session_minutes" | "max_new" | "retention" | "last_prompt_on">
>;

/**
 * Настройки ежедневных повторений (`learning_settings`, #58). Строки нет —
 * действуют значения по умолчанию из `LEARNING_SETTINGS_DEFAULTS`; первая
 * запись создаёт строку. Ответ прогоняется через `LearningSettingsSchema`.
 */
export interface LearningSettingsRepository {
  get(): Promise<LearningSettings>;
  update(patch: LearningSettingsUpdate): Promise<LearningSettings>;
}
