import { z } from "zod";
import { SessionMinutesSchema } from "./learning";

/**
 * Контракт учёбы (#63, #61): сессия, задание, ответ, результат. Форму задал
 * `docs/design/specs/exercise.design.md` §1 и `today-session.design.md` §1;
 * отдают Edge Functions `session-build` и `review-submit`.
 *
 * `task_id` — подписанный билет задания: клиент его не читает, только
 * возвращает с ответом. Ключ ответа (`key`) приходит в задании — клиент
 * сразу показывает «верно / неверно» (решение 2026-09-24), окончательный
 * исход — из результата сервера.
 */

/** Рендерер задания. Задания на пару после карточки идут обычными форматами. */
export const EXERCISE_CODES = ["intro", "R1", "R2", "P1", "P2", "W1", "W2", "C1", "C2", "pair_card"] as const;
export const ExerciseCodeSchema = z.enum(EXERCISE_CODES);

export const StudyLexemeSchema = z.object({
  headword: z.string(),
  reading: z.string().nullable(),
  /** «3-й тон», «4-й + лёгкий» — готовой строкой. */
  tone_label: z.string().nullable(),
  translation: z.string().nullable(),
});

export const StudyOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  kind: z.enum(["ru", "pinyin", "hanzi"]),
  /** Готовое чтение для диктора: «mǎi, третий тон». */
  a11y: z.string(),
});

export const StudySentenceSchema = z.object({
  tokens: z.array(z.string()),
  blank_index: z.number().int().nullable(),
  ru: z.string(),
  pinyin: z.string().optional(),
});

export const IntroSchema = z.object({
  /** Пример появится с контекстами (#64); до тех пор — `null`. */
  example: z.object({ zh: z.string(), pinyin: z.string(), ru: z.string() }).nullable(),
  /** Знаки слова и где они уже встречаются в словах пользователя; пусто — «знак новый». */
  char_notes: z.array(z.object({ char: z.string(), known_in: z.array(z.string()) })),
  actions: z.enum(["ok", "know_or_remember"]),
});

const PairSideSchema = z.object({
  headword: z.string(),
  reading: z.string().nullable(),
  tone_label: z.string().nullable(),
  meaning: z.string().nullable(),
});

export const PairCardSchema = z.object({
  a: PairSideSchema,
  b: PairSideSchema,
  /** Строка различия — только из проверенных данных (#71, #74); нет — `null`. */
  difference: z.string().nullable(),
  mnemonic: z.string().nullable(),
  collocations: z.tuple([z.string(), z.string()]).nullable(),
});

/** Ключ ответа: для мгновенного итога на клиенте. Пиньинь — в виде `mai3`. */
export const AnswerKeySchema = z.object({
  option_id: z.string().optional(),
  pinyin: z.string().optional(),
  tokens: z.array(z.string()).optional(),
});

export const ExerciseSchema = z.object({
  task_id: z.string(),
  code: ExerciseCodeSchema,
  lexeme: StudyLexemeSchema.nullable(),
  options: z.array(StudyOptionSchema).optional(),
  sentence: StudySentenceSchema.optional(),
  tiles: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  intro: IntroSchema.optional(),
  pair: PairCardSchema.optional(),
  key: AnswerKeySchema.optional(),
  is_retry: z.boolean(),
  /** Номер порции, в которую входит задание (для пауз). */
  portion: z.number().int().nonnegative(),
});

export const PlanReasonSchema = z.enum(["debt", "quota_spent", "no_new_words"]).nullable();

export const SessionStatsSchema = z.object({
  budget: z.number().int(),
  due_now: z.number().int(),
  new_quota: z.number().int(),
  new_taken: z.number().int(),
  reason: PlanReasonSchema,
  due_tomorrow: z.number().int(),
});

export const StudySessionSchema = z.object({
  session_id: z.uuid(),
  mode: z.enum(["today", "folder"]),
  folder_mode: z.enum(["review", "new", "practice"]).nullable(),
  exercises: z.array(ExerciseSchema),
  portions: z.array(z.number().int()),
  stats: SessionStatsSchema,
});

export const TodayStateSchema = z.enum(["no_words", "ready", "done", "nothing_due"]);

/**
 * Три плана для окна «Повторим?» и карточка «Сегодня» над словарём (#66) —
 * считаются без записи. Состав, минуты и прогноз считает сервер.
 */
export const SessionPreviewSchema = z.object({
  plans: z.array(z.object({
    minutes: SessionMinutesSchema,
    due: z.number().int(),
    new: z.number().int(),
    total: z.number().int(),
    /** «~8 минут» по темпу пользователя. */
    est_minutes: z.number().int(),
    new_sources: z.array(z.object({
      folder_id: z.uuid(),
      folder_name: z.string(),
      count: z.number().int(),
    })),
    pairs: z.array(z.object({ a: z.string(), b: z.string() })),
    due_tomorrow: z.number().int(),
  })),
  /** Для `budget_minutes`: сколько пора повторить, включая не вошедшее. */
  due_now: z.number().int(),
  reason: PlanReasonSchema,
  budget_minutes: SessionMinutesSchema,
  state: TodayStateSchema,
  recall_now: z.object({ recalled: z.number().int(), total: z.number().int() }),
});

export const StudyAnswerSchema = z.union([
  z.object({ option_id: z.string() }),
  z.object({ text: z.string() }),
  z.object({ tile_ids: z.array(z.string()) }),
  z.object({ self: z.enum(["recalled", "forgot"]) }),
  z.object({ blank: z.literal(true) }),
  /** Знакомство и карточка пары. */
  z.object({ choice: z.enum(["ok", "know", "remember"]) }),
]);

export const ERROR_TYPES = [
  "blank",
  "confusion",
  "tone",
  "syllable",
  "form_similar",
  "homophone",
  "order",
  "wrong",
  "second_try",
] as const;

export const AnswerResultSchema = z.object({
  /** `partial` — тон неверный при верном слоге или верно со второй попытки; `seen` — знакомство. */
  outcome: z.enum(["correct", "partial", "wrong", "seen"]),
  correct: AnswerKeySchema.extend({ text: z.string().optional() }),
  error_type: z.enum(ERROR_TYPES).nullable(),
  partner: z.object({ headword: z.string(), reading: z.string().nullable(), meaning: z.string().nullable() }).nullable(),
  /** Строки разбора готовым русским текстом. */
  explanation: z.array(z.string()),
  /** Вставленные задания: повтор после ошибки, трудная проверка «Уже знаю», блок пары. */
  next: z.array(ExerciseSchema),
  stage: z.enum(["new", "meeting", "recognize", "recall", "use", "stable"]).nullable(),
  /** «Уже знаю» подтверждено — остальные задания этого слова в сессии можно пропустить. */
  known: z.boolean(),
  duplicate: z.boolean(),
});

export type ExerciseCode = z.infer<typeof ExerciseCodeSchema>;
export type StudyLexeme = z.infer<typeof StudyLexemeSchema>;
export type StudyOption = z.infer<typeof StudyOptionSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;
export type SessionPreview = z.infer<typeof SessionPreviewSchema>;
export type TodayState = z.infer<typeof TodayStateSchema>;
export type StudyAnswer = z.infer<typeof StudyAnswerSchema>;
export type AnswerResult = z.infer<typeof AnswerResultSchema>;
export type PlanReason = z.infer<typeof PlanReasonSchema>;
