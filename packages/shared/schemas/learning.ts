import { z } from "zod";

/**
 * Изучение слов (#57): слово ученика, память по навыкам и настройки
 * ежедневных повторений. Модель — docs/learning/vocabulary-engine.md,
 * механика — docs/learning/daily-and-folder-study.md.
 *
 * Таблицы — `learning_lexemes`, `skill_states`, `learning_settings`
 * (миграция 20260924101500_learning_lexemes.sql).
 */

/**
 * Четыре навыка слова: знак → значение, знак → пиньинь, значение → знак,
 * слово в предложении. Порядок — порядок открытия.
 */
export const SKILLS = ["read", "pinyin", "write", "use"] as const;
export const SkillSchema = z.enum(SKILLS);

/** `read_only` — навык «Пишу» не открывается. */
export const LexemeGoalSchema = z.enum(["full", "read_only"]);

/** Минуты на «Сегодня», из которых человек выбирает в окне «Повторим?». */
export const SESSION_MINUTES = [5, 10, 15] as const;
export const SessionMinutesSchema = z.union([z.literal(5), z.literal(10), z.literal(15)]);

/**
 * Слово ученика: одна строка на заголовок и чтение, сколько бы папок его ни
 * держало. Создаёт его триггер, когда слово кладут в папку; клиент меняет
 * только `goal`.
 */
export const LearningLexemeSchema = z.object({
  id: z.uuid(),
  headword: z.string().min(1),
  reading: z.string().nullable(),
  dictionary_entry_id: z.number().int().nullable(),
  /** Смысл, в котором слово учится: перевод из последней строки папки, где он есть. */
  translation: z.string().nullable(),
  goal: LexemeGoalSchema,
  created_at: z.string(),
});

/**
 * Память по одному навыку (FSRS). Строки нет — навык ещё не открыт. Пишет
 * только сервер.
 */
export const SkillStateSchema = z.object({
  lexeme_id: z.uuid(),
  skill: SkillSchema,
  /** Через сколько дней вероятность вспомнить падает до 90%. */
  stability: z.number().positive(),
  /** Сложность слова для этого навыка, 1..10. */
  difficulty: z.number().min(1).max(10),
  last_review: z.string().nullable(),
  due: z.string(),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  /** Для «Использую»: в скольких разных предложениях навык подтверждён. */
  contexts_passed: z.number().int().nonnegative(),
  unlocked_at: z.string(),
});

/** Те же значения по умолчанию, что у столбцов `learning_settings`. */
export const LEARNING_SETTINGS_DEFAULTS = {
  session_minutes: 10,
  max_new: 8,
  retention: 0.9,
  last_prompt_on: null,
} as const;

/**
 * Настройки ежедневных повторений. Строки нет — действуют
 * `LEARNING_SETTINGS_DEFAULTS`; клиент пишет строку сам.
 */
export const LearningSettingsSchema = z.object({
  session_minutes: SessionMinutesSchema,
  max_new: z.number().int().min(0).max(30),
  retention: z.number().min(0.8).max(0.95),
  /** День (по часам пользователя, `YYYY-MM-DD`), когда окно «Повторим?» уже показывали. */
  last_prompt_on: z.iso.date().nullable(),
});

export type Skill = z.infer<typeof SkillSchema>;
export type LexemeGoal = z.infer<typeof LexemeGoalSchema>;
export type SessionMinutes = z.infer<typeof SessionMinutesSchema>;
export type LearningLexeme = z.infer<typeof LearningLexemeSchema>;
export type SkillState = z.infer<typeof SkillStateSchema>;
export type LearningSettings = z.infer<typeof LearningSettingsSchema>;
