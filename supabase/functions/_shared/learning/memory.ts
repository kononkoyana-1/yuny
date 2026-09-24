/**
 * Память по навыку: кривая забывания, первый ответ, успех, ошибка, срок
 * следующего повторения (docs/learning/vocabulary-engine.md, раздел 4).
 * Чистые функции: время приходит параметром, в базу ничего не пишется.
 */
import { DAY_MS, type ExerciseCode, MODEL, type Rating, type Skill } from "./config.ts";

/** Состояние навыка — как строка `skill_states` (время — `Date`). */
export interface MemoryState {
  stability: number;
  difficulty: number;
  lastReview: Date | null;
  due: Date;
  reps: number;
  lapses: number;
}

/** Ошибки, которые уменьшают стабильность (ключи `MODEL.errorFactor`). */
export type ErrorKind = keyof typeof MODEL.errorFactor;

/**
 * Итог одного ответа для модели: успех с оценкой или ошибка с типом.
 * Второй попыткой исправленный ответ — ошибка (`second_try`), не успех.
 */
export type Grade =
  | { kind: "success"; rating: 2 | 3 | 4 }
  | { kind: "error"; error: ErrorKind };

/** Признаки слова для стартовой сложности. */
export interface WordFeatures {
  hskLevel: number | null;
  strokes?: number | null;
  /** В словаре пользователя уже есть слово, с которым это путают. */
  hasConfusable: boolean;
  syllables: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const days = (from: Date, to: Date) => Math.max(0, (to.getTime() - from.getTime()) / DAY_MS);

/** Вероятность вспомнить через `elapsedDays` при стабильности `stability`. */
export function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + (MODEL.factor * elapsedDays) / stability, MODEL.decay);
}

/** Через сколько дней вероятность упадёт до `retention`. При 0.9 — ровно S. */
export function intervalDays(stability: number, retention: number = MODEL.retention): number {
  return (stability / MODEL.factor) * (Math.pow(retention, 1 / MODEL.decay) - 1);
}

export function retrievabilityAt(state: MemoryState, now: Date): number {
  return state.lastReview ? retrievability(days(state.lastReview, now), state.stability) : 0;
}

/** Оценка для журнала (`review_events.rating`). */
export function gradeRating(grade: Grade): Rating {
  if (grade.kind === "success") return grade.rating;
  return grade.error === "second_try" ? 2 : 1;
}

export function initialDifficulty(skill: Skill, word: WordFeatures): number {
  const d = MODEL.initialDifficulty;
  let value = d.base;
  if (word.hskLevel === 1) value += d.hsk1;
  else if (word.hskLevel === null || word.hskLevel >= 4) value += d.highOrNoHsk;
  if ((word.strokes ?? 0) >= 10) value += d.manyStrokes;
  if (word.hasConfusable) value += d.confusable[skill];
  if (skill === "write" && word.syllables > 1) value += d.multiSyllableWrite;
  return clamp(value, 1, 10);
}

function difficultyAfter(difficulty: number, grade: Grade): number {
  const delta = grade.kind === "error"
    ? MODEL.difficultyDelta[grade.error]
    : MODEL.difficultyDelta[grade.rating === 4 ? "easy" : grade.rating === 2 ? "hard" : "good"];
  return clamp(difficulty + delta, 1, 10);
}

function withDue(state: Omit<MemoryState, "due">, now: Date, retention: number): MemoryState {
  return { ...state, due: new Date(now.getTime() + intervalDays(state.stability, retention) * DAY_MS) };
}

/**
 * Новая стабильность по формулам раздела 4. `weight` — вес доказательства:
 * формат упражнения, скидка за интервенцию или доля неявного повторения.
 */
export function nextStability(
  stability: number,
  difficulty: number,
  r: number,
  grade: Grade,
  weight: number,
): number {
  if (grade.kind === "error") {
    return Math.max(MODEL.minStability, stability * MODEL.errorFactor[grade.error]);
  }
  const gain = MODEL.growth *
    (11 - difficulty) *
    Math.pow(stability, -MODEL.stabilityDecay) *
    (Math.exp(1 - r) - 1) *
    MODEL.ratingWeight[grade.rating] *
    weight;
  return stability * (1 + gain);
}

/**
 * Ответ по навыку. `state` — `null`, если навык отвечают впервые: тогда
 * стабильность — стартовая по оценке (× вес формата), сложность — от
 * признаков слова.
 */
export function review(
  state: MemoryState | null,
  grade: Grade,
  opts: {
    now: Date;
    weight: number;
    initialDifficulty: number;
    retention?: number;
  },
): MemoryState {
  const retention = opts.retention ?? MODEL.retention;
  if (!state) {
    const stability = grade.kind === "error"
      ? MODEL.initialStability[1]
      : MODEL.initialStability[grade.rating] * opts.weight;
    return withDue({
      stability,
      difficulty: difficultyAfter(opts.initialDifficulty, grade),
      lastReview: opts.now,
      reps: 1,
      lapses: grade.kind === "error" ? 1 : 0,
    }, opts.now, retention);
  }
  const r = retrievabilityAt(state, opts.now);
  return withDue({
    stability: nextStability(state.stability, state.difficulty, r, grade, opts.weight),
    difficulty: difficultyAfter(state.difficulty, grade),
    lastReview: opts.now,
    reps: state.reps + 1,
    lapses: state.lapses + (grade.kind === "error" ? 1 : 0),
  }, opts.now, retention);
}

/** Вес доказательства упражнения. */
export function formatWeight(code: ExerciseCode): number {
  return MODEL.formatWeight[code];
}

/**
 * Неявное повторение: успех в контексте (C*) — это ещё и повторение «Читаю»
 * и «Пиньинь», но слабое (× 0.3) и не чаще раза в сутки на навык, иначе
 * одна сессия с пятью предложениями раздула бы интервалы. `null` — навык не
 * трогаем.
 */
export function implicitReview(
  state: MemoryState | null,
  now: Date,
  retention?: number,
): MemoryState | null {
  if (!state || !state.lastReview) return null;
  if (days(state.lastReview, now) < MODEL.transferMinGapDays) return null;
  return review(state, { kind: "success", rating: 3 }, {
    now,
    weight: MODEL.transferWeight,
    initialDifficulty: state.difficulty,
    retention,
  });
}

// ------------------------------------------------------------ разблокировка

export type SkillStates = Partial<Record<Skill, MemoryState & { contextsPassed?: number; unlockedAt?: Date }>>;

/** Какие навыки должны быть открыты (раздел 1, таблица разблокировки). */
export function unlockedSkills(states: SkillStates, goal: "full" | "read_only"): Skill[] {
  const u = MODEL.unlock;
  const s = (k: Skill) => states[k]?.stability ?? 0;
  const out: Skill[] = ["read", "pinyin"];
  if (goal === "full" && s("read") >= u.writeAfterRead) out.push("write");
  if (s("read") >= u.useAfterRead && s("pinyin") >= u.useAfterPinyin) out.push("use");
  return out;
}

// ------------------------------------------------------------------ стадия

export type Stage = "new" | "meeting" | "recognize" | "recall" | "use" | "stable";

/**
 * Стадия слова для интерфейса (раздел 1). Считается по тому, что держится
 * сейчас: навык, у которого вероятность вспомнить упала ниже 0.8, не
 * засчитывается — стадия может понизиться, и это честно. Порог 0.8, а не
 * 0.9: иначе слово мигало бы стадией в день каждого срока.
 */
export function wordStage(
  states: SkillStates,
  opts: { now: Date; goal: "full" | "read_only"; activePair: boolean },
): Stage {
  if (!states.read) return "new";
  const held = (k: Skill): number => {
    const st = states[k];
    if (!st) return 0;
    return retrievabilityAt(st, opts.now) >= MODEL.stageMinRetrievability ? st.stability : 0;
  };
  const writeOk = (min: number) => opts.goal === "read_only" || held("write") >= min;

  if (held("read") < 3) return "meeting";
  if (!(held("pinyin") >= 7 && writeOk(7))) return "recognize";

  const use = states.use;
  const usedWidely = !!use &&
    (use.contextsPassed ?? 0) >= 2 &&
    !!use.lastReview && !!use.unlockedAt &&
    days(use.unlockedAt, use.lastReview) >= 7 &&
    held("use") > 0;
  if (!usedWidely) return "recall";

  const stable = held("read") >= 60 && held("pinyin") >= 30 && writeOk(30) &&
    held("use") >= 21 && !opts.activePair;
  return stable ? "stable" : "use";
}
