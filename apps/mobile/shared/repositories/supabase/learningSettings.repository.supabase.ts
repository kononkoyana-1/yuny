import { LEARNING_SETTINGS_DEFAULTS, LearningSettingsSchema } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { requireUserId } from "@/shared/lib/auth";
import { getSupabase } from "@/shared/lib/supabase";
import type { LearningSettingsRepository, LearningSettingsUpdate } from "../learningSettings.repository";

const COLUMNS = "session_minutes, max_new, retention, last_prompt_on";

/**
 * Клиент пишет строку сам, под RLS «только своё» (миграция
 * 20260924101500_learning_lexemes.sql): это выбор человека, а не учебное
 * состояние. Первая запись — upsert, потому что строки может ещё не быть.
 */
export const supabaseLearningSettingsRepository: LearningSettingsRepository = {
  async get() {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from("learning_settings")
      .select(COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new BackendError("settings_load_failed");
    return LearningSettingsSchema.parse(data ?? LEARNING_SETTINGS_DEFAULTS);
  },

  async update(patch: LearningSettingsUpdate) {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from("learning_settings")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
      .select(COLUMNS)
      .single();

    if (error || !data) throw new BackendError("settings_save_failed");
    return LearningSettingsSchema.parse(data);
  },
};
