/**
 * Веса модели памяти (docs/learning/vocabulary-engine.md, раздел 4). Все
 * числа — в одном месте: это стартовые значения, их потом дообучают на
 * журнале ответов (`review_events`), а не правят по коду.
 */

export type Skill = "read" | "pinyin" | "write" | "use";

/** 1 Again · 2 Hard · 3 Good · 4 Easy — как в FSRS и в `review_events.rating`. */
export type Rating = 1 | 2 | 3 | 4;

/** Код упражнения из каталога (раздел 3). */
export type ExerciseCode =
  | "R1" | "R2" | "R3"
  | "P1" | "P2"
  | "W1" | "W2" | "W3"
  | "C1" | "C2" | "C3" | "C4"
  | "X1" | "X2" | "X3";

export const MODEL = {
  /** R(t, S) = (1 + F·t/S)^DECAY, при t = S вероятность ровно 0.9. */
  factor: 19 / 81,
  decay: -0.5,

  /** Цель удержания по умолчанию (`learning_settings.retention`). */
  retention: 0.9,

  /** Стабильность после первого ответа по оценке, дни. */
  initialStability: { 1: 0.4, 2: 1.2, 3: 2.5, 4: 6.0 } as Record<Rating, number>,

  /** G = growth·(11 − D)·S^(−stabilityDecay)·(e^(1−R) − 1)·m_rating·m_format. */
  growth: 4.5,
  stabilityDecay: 0.15,
  ratingWeight: { 2: 0.5, 3: 1.0, 4: 1.3 } as Record<2 | 3 | 4, number>,

  /**
   * Вес доказательства: насколько успех в этом формате говорит о памяти.
   * Выбор из вариантов угадывается — слабее; производство — сильнее.
   */
  formatWeight: {
    R1: 0.5, R2: 0.8, R3: 0.9,
    P1: 0.5, P2: 1.0,
    W1: 0.7, W2: 0.85, W3: 1.2,
    C1: 0.6, C2: 1.0, C3: 1.1, C4: 1.3,
    X1: 0.7, X2: 0.7, X3: 1.2,
  } as Record<ExerciseCode, number>,

  /** Навык, память которого обновляет упражнение (X* — пара, не навык). */
  formatSkill: {
    R1: "read", R2: "read", R3: "read",
    P1: "pinyin", P2: "pinyin",
    W1: "write", W2: "write", W3: "write",
    C1: "use", C2: "use", C3: "use", C4: "use",
  } as Record<Exclude<ExerciseCode, "X1" | "X2" | "X3">, Skill>,

  /** Нижняя граница стабильности после ошибки, дни. */
  minStability: 0.4,

  /**
   * Во сколько раз падает стабильность при ошибке — по её типу. Забыл
   * совсем — сильно; спутал с конкретным словом или ошибся в тоне — слово
   * помнит, но не различает, — мягче.
   */
  errorFactor: {
    blank: 0.2,
    wrong: 0.2,
    syllable: 0.2,
    confusion: 0.5,
    form_similar: 0.5,
    homophone: 0.5,
    tone: 0.6,
    order: 0.6,
    second_try: 0.7,
  },

  /** Сдвиг сложности после ответа; зажимается в [1, 10]. Good сложность не двигает. */
  difficultyDelta: {
    blank: 1.0,
    wrong: 1.0,
    syllable: 1.0,
    confusion: 0.6,
    form_similar: 0.6,
    homophone: 0.6,
    tone: 0.5,
    order: 0.5,
    second_try: 0.3,
    hard: 0.3,
    good: 0,
    easy: -0.3,
  },

  /** Стартовая сложность: база и поправки по признакам слова. */
  initialDifficulty: {
    base: 5.0,
    hsk1: -0.5,
    highOrNoHsk: 0.5, // HSK 4+ или вне HSK
    manyStrokes: 1.0, // ≥ 10 черт
    /** Путаемое слово уже в словаре: сильнее всего бьёт по «Пишу». */
    confusable: { read: 1.0, pinyin: 1.0, write: 2.5, use: 1.0 } as Record<Skill, number>,
    multiSyllableWrite: 0.5,
  },

  /** Неявное повторение «Читаю» и «Пиньинь» при успехе в контексте. */
  transferWeight: 0.3,
  transferMinGapDays: 1,

  /** Скорость: доли медианы пользователя для формата. */
  fastShare: 0.6,
  slowShare: 2.5,

  /** Когда открываются навыки. */
  unlock: { writeAfterRead: 3, useAfterRead: 3, useAfterPinyin: 2 },

  /** Навык считается «держащимся» для стадии, пока R не ниже этого. */
  stageMinRetrievability: 0.8,

  /** Пара путаницы. */
  pair: {
    initialDifficulty: 6.0,
    /** Успех сразу после объяснения — слабое доказательство. */
    interventionDiscount: 0.4,
    /** Пока S пары ниже, интервалы обоих слов не растут дальше её срока. */
    capUntilStability: 7,
    /** Порог интервенции: столько путаниц за окно. */
    threshold: 2,
    windowDays: 30,
    /** Не больше стольких контрастных карточек (интервенций) за занятие. */
    maxInterventions: 2,
    /** Снятие: успешные различения подряд на интервалах не меньше этих, дни. */
    resolveGaps: [1, 3, 7],
    errorFactor: 0.5,
  },
} as const;

export const DAY_MS = 86_400_000;
