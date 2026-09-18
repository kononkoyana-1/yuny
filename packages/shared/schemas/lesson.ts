import { z } from "zod";

/**
 * Урок и его задания (TZ.md §8, §10, §13) — то, что видит экран. Правильных
 * ответов здесь нет и быть не должно: они лежат в `task_answer_keys`, клиенту
 * не видны, и проверяет ответ сервер (TZ.md §3).
 *
 * Идентификаторы пунктов (`s1`…, `q1`…, `t1`…, у карточек — id слова) — то, по
 * чему `task-submit` сопоставит ответ с ключом.
 */

export const LessonStatusSchema = z.enum(["pending", "generating", "ready", "failed"]);
export const TaskTypeSchema = z.enum(["reading_truefalse", "open_questions", "translation", "word_cards"]);

export const LessonSchema = z.object({
  id: z.uuid(),
  module_id: z.uuid(),
  /** Номер комплекта заданий: «Сформировать новые задания» даёт следующий (TZ.md §10). */
  generation: z.number().int().min(1),
  position: z.number().int().min(1),
  status: LessonStatusSchema,
  vocabulary_ids: z.array(z.uuid()).min(1).max(20),
});

export const ReadingTrueFalseContentSchema = z.object({
  text: z.string(),
  /** Под кнопкой, по умолчанию скрыт (TZ.md §8). */
  pinyin: z.string(),
  statements: z.array(z.object({ id: z.string(), text: z.string(), pinyin: z.string() })).length(8),
});

export const OpenQuestionsContentSchema = z.object({
  questions: z.array(z.object({ id: z.string(), text: z.string() })).length(6),
});

export const TranslationContentSchema = z.object({
  /** Каждое предложение — отдельное поле ввода (TZ.md §8). */
  sentences: z.array(z.object({ id: z.string(), text: z.string() })).min(1),
});

export const WordCardSchema = z.object({
  /** `module_vocabulary.id` */
  id: z.uuid(),
  /** zh_ru — дано слово, ответ по-русски; ru_zh — дано значение, ответ иероглифами. */
  direction: z.enum(["zh_ru", "ru_zh"]),
  prompt: z.string(),
  /** Пиньинь под кнопкой; у ru_zh его нет — он подсказал бы ответ. */
  reading: z.string().nullable(),
});

export const WordCardsContentSchema = z.object({
  cards: z.array(WordCardSchema).min(1).max(20),
});

/** Задание урока: тип определяет форму `content`. */
export const TaskSchema = z.discriminatedUnion("type", [
  z.object({ id: z.uuid(), lesson_id: z.uuid(), position: z.literal(1), type: z.literal("reading_truefalse"), content: ReadingTrueFalseContentSchema }),
  z.object({ id: z.uuid(), lesson_id: z.uuid(), position: z.literal(2), type: z.literal("open_questions"), content: OpenQuestionsContentSchema }),
  z.object({ id: z.uuid(), lesson_id: z.uuid(), position: z.literal(3), type: z.literal("translation"), content: TranslationContentSchema }),
  z.object({ id: z.uuid(), lesson_id: z.uuid(), position: z.literal(4), type: z.literal("word_cards"), content: WordCardsContentSchema }),
]);

export const LessonGenerateRequestSchema = z.object({ lesson_id: z.uuid() });

export const LessonGenerateResponseSchema = z.object({
  job_id: z.uuid(),
  kind: z.literal("lesson_generate"),
  lesson_id: z.uuid(),
});

/** Что кладёт в `jobs.result` удачная генерация. */
export const LessonGenerateResultSchema = z.object({
  lesson_id: z.uuid(),
  task_count: z.number().int(),
});

/**
 * Коды ошибок `lesson-generate`. После `ai_unavailable`, `ai_invalid_response`
 * и `internal_error` урок в статусе `failed` — вызов ещё раз сгенерирует его
 * заново. `lesson_ready` — задания уже есть, их надо просто открыть.
 */
export const LessonErrorCodeSchema = z.enum([
  "invalid_request",
  "lesson_not_found",
  "lesson_ready",
  "ai_unavailable",
  "ai_invalid_response",
  "internal_error",
]);

export type LessonStatus = z.infer<typeof LessonStatusSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type WordCard = z.infer<typeof WordCardSchema>;
export type LessonGenerateResponse = z.infer<typeof LessonGenerateResponseSchema>;
export type LessonGenerateResult = z.infer<typeof LessonGenerateResultSchema>;
export type LessonErrorCode = z.infer<typeof LessonErrorCodeSchema>;
