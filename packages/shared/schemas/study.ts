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

const WordRefSchema = z.object({ headword: z.string(), reading: z.string().nullable() });

/**
 * Заметка о знаке (#88): чтение знака в этом слове и его значение — из
 * статьи словаря на этот знак (нет статьи — `null`, не выдумываем); слова
 * пользователя с этим знаком — с чтением. Старая форма (`known_in` строками,
 * без чтения и значения) тоже читается.
 */
export const CharNoteSchema = z.object({
  char: z.string(),
  reading: z.string().nullable().default(null),
  meaning: z.string().nullable().default(null),
  known_in: z.array(
    z.union([WordRefSchema, z.string().transform((headword) => ({ headword, reading: null }))]),
  ),
});

export const IntroSchema = z.object({
  /** Пример из проверенного кэша предложений (#64); покрытого словами пользователя нет — `null`. */
  example: z.object({ zh: z.string(), pinyin: z.string(), ru: z.string() }).nullable(),
  /** Знаки слова и где они уже встречаются в словах пользователя; пусто — «знак новый». */
  char_notes: z.array(CharNoteSchema),
  /** «Понятно»; «Запомню» / «Уже знаю»; одна «Запомню» — после проваленной проверки «Уже знаю». */
  actions: z.enum(["ok", "know_or_remember", "remember"]),
});

const CollocationSchema = z.object({ zh: z.string(), pinyin: z.string(), ru: z.string() });

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
  /** Те же коллокации с пиньинем и переводом: [для A, для B] (#71). */
  collocation_notes: z
    .tuple([CollocationSchema, CollocationSchema])
    .nullable()
    .default(null),
});

/** Ключ ответа: для мгновенного итога на клиенте. Пиньинь — в виде `mai3`. */
export const AnswerKeySchema = z.object({
  option_id: z.string().optional(),
  pinyin: z.string().optional(),
  tokens: z.array(z.string()).optional(),
  /** C2: все допустимые порядки плиток (`tokens` — первый), #64. */
  orders: z.array(z.array(z.string())).optional(),
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
  /** Трудная проверка после «Уже знаю» — чип «Проверка» (folder-study.design.md §4). */
  is_check: z.boolean().default(false),
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
  /** День пользователя (`YYYY-MM-DD`, граница — 04:00 по его часам): его пишут в `last_prompt_on`. */
  today: z.iso.date(),
  /** Показать окно «Повторим?»: сегодня его не было, не отвечали и есть что повторить. */
  show_daily_prompt: z.boolean(),
  /** Новых слов ждёт в очереди (#85) — «В очереди 180», когда новых нет из-за долга. */
  queued_total: z.number().int().default(0),
  /** «Ещё 7 новых слов» в итоге дня: сколько слов и сколько заданий прибавится завтра; `null` — новых нет. */
  extra_new: z.object({ count: z.number().int(), tomorrow_delta: z.number().int() }).nullable().default(null),
});

export const FolderModeSchema = z.enum(["review", "new", "practice"]);

const FolderModeOfferSchema = z.object({
  mode: FolderModeSchema,
  /** review — пора повторить; new — слов в раунде; practice — `null`. */
  count: z.number().int().nullable(),
  /** new — сколько новых слов в папке всего. */
  total_new: z.number().int().nullable(),
  minutes: z.number().int(),
});

/** Что предложить на экране папки (#69, folder-study.design.md §1). */
export const FolderStudyPlanSchema = z.object({
  primary: FolderModeOfferSchema.nullable(),
  alternatives: z.array(FolderModeOfferSchema),
  practice_note: z.boolean(),
  load_warning: z.object({ tomorrow_tasks: z.number().int() }).nullable(),
});

export const StageSchema = z.enum(["new", "meeting", "recognize", "recall", "use", "stable"]);
const StageCountsSchema = z.record(StageSchema, z.number().int());

/**
 * Изучено и впереди (#85): `learned` — начатые и «Уже знаю», `queued` — ещё не
 * учили, `eta_days` — примерно дней до конца при `per_day` новых в день из
 * настроек. `per_day: null` — в настройках 0, новые приходят только из папки.
 */
const QueueFields = {
  learned: z.number().int().default(0),
  queued: z.number().int().default(0),
  eta_days: z.number().int().nullable().default(null),
  per_day: z.number().int().nullable().default(null),
};

/** Стадии и «пора освежить» по папке — карточка папки в «Моём словаре» (#70). */
export const FolderProgressSchema = z.object({
  folder_id: z.uuid(),
  word_count: z.number().int(),
  due_count: z.number().int(),
  stage_counts: StageCountsSchema,
  ...QueueFields,
});
/** Сводка по всем словам в папках (слово в двух папках — одно). */
export const WordTotalsSchema = z.object({
  words: z.number().int(),
  learned: z.number().int(),
  queued: z.number().int(),
  eta_days: z.number().int().nullable(),
});
export const FolderProgressListSchema = z.object({
  folders: z.array(FolderProgressSchema),
  total: WordTotalsSchema.nullable().default(null),
  per_day: z.number().int().nullable().default(null),
});

/** Карта папки (#70, folder-map.design.md §1): у каждого слова стадия, «пора освежить», пара. */
export const FolderMapSchema = z.object({
  word_count: z.number().int(),
  due_count: z.number().int(),
  stage_counts: StageCountsSchema,
  ...QueueFields,
  words: z.array(z.object({
    headword: z.string(),
    reading: z.string().nullable(),
    stage: StageSchema,
    due: z.boolean(),
    pair_partner: z.string().nullable(),
    /** Порядок добавления в папку; слова приходят уже по нему. */
    position: z.number().int(),
  })),
});

export const SkillLevelSchema = z.enum(["not_started", "fresh", "holding", "stable"]);

/** Карточка слова (#70): стадия, 4 навыка, ближайшее повторение, пары путаницы. `found: false` — слово ещё не в папках. */
export const WordProgressSchema = z.union([
  z.object({ found: z.literal(false) }),
  z.object({
    found: z.literal(true),
    stage: StageSchema,
    skills: z.object({ read: SkillLevelSchema, pinyin: SkillLevelSchema, write: SkillLevelSchema, use: SkillLevelSchema }),
    next_review_days: z.number().int().nullable(),
    confusions: z.array(z.object({
      partner: z.string(),
      partner_reading: z.string().nullable(),
      status: z.enum(["active", "watch", "resolved"]),
      resolved_on: z.iso.date().nullable(),
    })),
  }),
]);

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
  /** Стадия до ответа: `stage` выше — слово продвинулось (пауза, итог дня). */
  stage_before: z.enum(["new", "meeting", "recognize", "recall", "use", "stable"]).nullable().default(null),
  /** Пара, которую этот ответ перевёл в «различаете». */
  pair_resolved: z.object({ a: z.string(), b: z.string() }).nullable().default(null),
  /** «Уже знаю» подтверждено — остальные задания этого слова в сессии можно пропустить. */
  known: z.boolean(),
  duplicate: z.boolean(),
});

export type ExerciseCode = z.infer<typeof ExerciseCodeSchema>;
export type CharNote = z.infer<typeof CharNoteSchema>;
export type StudyLexeme = z.infer<typeof StudyLexemeSchema>;
export type StudyOption = z.infer<typeof StudyOptionSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;
export type SessionPreview = z.infer<typeof SessionPreviewSchema>;
export type TodayState = z.infer<typeof TodayStateSchema>;
export type FolderMode = z.infer<typeof FolderModeSchema>;
export type FolderStudyPlan = z.infer<typeof FolderStudyPlanSchema>;
export type Stage = z.infer<typeof StageSchema>;
export type FolderProgress = z.infer<typeof FolderProgressSchema>;
export type FolderProgressList = z.infer<typeof FolderProgressListSchema>;
export type WordTotals = z.infer<typeof WordTotalsSchema>;
export type FolderMap = z.infer<typeof FolderMapSchema>;
export type SkillLevel = z.infer<typeof SkillLevelSchema>;
export type WordProgress = z.infer<typeof WordProgressSchema>;
export type StudyAnswer = z.infer<typeof StudyAnswerSchema>;
export type AnswerResult = z.infer<typeof AnswerResultSchema>;
export type PlanReason = z.infer<typeof PlanReasonSchema>;
