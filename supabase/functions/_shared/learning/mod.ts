/**
 * Модель памяти для изучения слов (#60). Только сервер: клиент получает
 * готовые стадии, сроки и исходы (TZ.md §3, правило 1).
 */
export { DAY_MS, type ExerciseCode, MODEL, type Rating, type Skill } from "./config.ts";
export { formatPinyin, normalizePinyin, parsePinyin, sameSyllables, type Syllable, toneVariants } from "./pinyin.ts";
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
export {
  type PairWrite,
  planPairStart,
  planSubmit,
  type SkillWrite,
  type StoredPair,
  type StoredSkill,
  type SubmitInput,
  type SubmitLexeme,
  type SubmitPlan,
} from "./submit.ts";
export { signTicket, type Ticket, type TicketError, type TicketExercise, TICKET_TTL_MS, verifyTicket } from "./ticket.ts";
export { type Candidate, type CandidateSource, type OptionKind, pickOptions, type PickInput } from "./distractors.ts";
export {
  buildSession,
  chooseFormat,
  type FolderMode,
  forecastDue,
  intakeQuota,
  interleave,
  NEW_WORD_COST,
  type PlanInput,
  type PlanLexeme,
  type PlanPair,
  type PlanReason,
  type PlanTask,
  portions,
  ROUND_MIXINS,
  ROUND_SIZE,
  type SessionPlan,
  sessionBudget,
  type Slot,
} from "./session.ts";
export {
  buildExercise,
  type BuildInput,
  buildPairCard,
  type Built,
  charNotes,
  easierCode,
  type ExerciseBody,
  explanation,
  pinyinA11y,
  type RenderCode,
  resultOutcome,
  type ResultOutcome,
  type StudyWord,
  type TicketBody,
  toneLabel,
  withoutOptions,
} from "./exercise.ts";
export { KNOWN_STABILITY } from "./submit.ts";
