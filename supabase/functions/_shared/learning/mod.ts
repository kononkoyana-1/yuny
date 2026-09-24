/**
 * Модель памяти для изучения слов (#60). Только сервер: клиент получает
 * готовые стадии, сроки и исходы (TZ.md §3, правило 1).
 */
export { DAY_MS, type ExerciseCode, MODEL, type Rating, type Skill } from "./config.ts";
export { normalizePinyin, parsePinyin, sameSyllables, type Syllable } from "./pinyin.ts";
export {
  type ErrorKind,
  formatWeight,
  type Grade,
  gradeRating,
  implicitReview,
  initialDifficulty,
  intervalDays,
  type MemoryState,
  nextStability,
  retrievability,
  retrievabilityAt,
  review,
  type SkillStates,
  type Stage,
  unlockedSkills,
  type WordFeatures,
  wordStage,
} from "./memory.ts";
export {
  type Answer,
  classify,
  type ClassifyInput,
  type Classified,
  type OptionMeta,
  type Outcome,
  type WordKey,
} from "./classify.ts";
export {
  canonicalPair,
  cappedDue,
  needsIntervention,
  type PairState,
  type PairStatus,
  reviewPair,
  startPair,
} from "./pair.ts";
