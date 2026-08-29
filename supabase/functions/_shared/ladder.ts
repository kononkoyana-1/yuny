/**
 * The adaptive assessment ladder (docs/onboarding-v2.md §5).
 *
 * Pure decision logic, deliberately free of Deno, Supabase and I/O: which
 * band to serve next and what verdict to reach are the educational decisions
 * of this feature, and keeping them in one testable function is what stops
 * them leaking into the request handler a piece at a time.
 *
 * Shape of a run:
 *   Phase 1 — three questions at each of declared-1, declared, declared+1.
 *             Nine questions, always served, so a verdict is never built on
 *             a single band.
 *   Phase 2 — step by block result: 3/3 up, 2/3 stay, <=1/3 down.
 * Stops when a band is confirmed, at 15 questions, or when time runs out.
 */
import { CEFR_ORDER, type CefrLevel } from "./cefr.ts";

export const BLOCK_SIZE = 3;
export const PHASE_1_BLOCKS = 3;
export const MAX_QUESTIONS = 15;
export const BUDGET_SECONDS = 600;

/** One answered question, as the ladder needs to see it. */
export interface LadderAnswer {
  level: CefrLevel;
  correct: boolean;
}

export interface LadderState {
  declared: CefrLevel;
  answers: LadderAnswer[];
  elapsedSeconds: number;
}

export type LadderStep =
  | { done: false; serve: CefrLevel }
  | { done: true; assessed: CefrLevel; confidence: number };

function step(level: CefrLevel, by: number): CefrLevel {
  const at = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.min(CEFR_ORDER.length - 1, Math.max(0, at + by))];
}

/** Correct / total for one band across the whole run. */
export function tally(answers: LadderAnswer[], level: CefrLevel): { correct: number; total: number } {
  const at = answers.filter((a) => a.level === level);
  return { correct: at.filter((a) => a.correct).length, total: at.length };
}

/**
 * Phase 1 serves declared-1, declared, declared+1 in that order, three each.
 * Clamped at the ends: a learner who declares A1 has no band below, and the
 * plan is explicit that the three blocks still happen — they just cannot
 * reach outside the scale, so the low block repeats the floor.
 */
function phase1Band(declared: CefrLevel, blockIndex: number): CefrLevel {
  return step(declared, blockIndex - 1);
}

/** A band passes when at least two of its three answers are correct. */
function passed(answers: LadderAnswer[], level: CefrLevel): boolean {
  const { correct, total } = tally(answers, level);
  return total > 0 && correct / total >= 2 / 3;
}

/**
 * Verdict: the highest band the learner actually passed. Falls back to the
 * floor rather than to `declared` — reporting a level the evidence does not
 * support is the specific failure this whole redesign exists to remove.
 */
function verdict(answers: LadderAnswer[]): CefrLevel {
  const attempted = CEFR_ORDER.filter((l) => tally(answers, l).total > 0);
  const cleared = attempted.filter((l) => passed(answers, l));
  return cleared.length > 0 ? cleared[cleared.length - 1] : CEFR_ORDER[0];
}

/**
 * How much the verdict is worth, from the evidence at the deciding band.
 * Three answers is the floor of what the ladder ever collects (0.55); more
 * questions at that band raise it, and it is capped below 1 because fifteen
 * multiple-choice questions narrow a band, they do not settle it.
 */
function confidence(answers: LadderAnswer[], assessed: CefrLevel): number {
  const { total } = tally(answers, assessed);
  if (total === 0) return 0;
  return Math.min(0.9, 0.4 + 0.05 * total);
}

export function nextStep(state: LadderState): LadderStep {
  const { declared, answers, elapsedSeconds } = state;
  const asked = answers.length;

  const outOfRoom = asked >= MAX_QUESTIONS || elapsedSeconds >= BUDGET_SECONDS;
  if (outOfRoom) {
    const assessed = verdict(answers);
    return { done: true, assessed, confidence: confidence(answers, assessed) };
  }

  // --- Phase 1: the three mandatory blocks -------------------------------
  if (asked < BLOCK_SIZE * PHASE_1_BLOCKS) {
    return { done: false, serve: phase1Band(declared, Math.floor(asked / BLOCK_SIZE)) };
  }

  // --- Phase 2: step from the last complete block ------------------------
  const lastBlock = answers.slice(-BLOCK_SIZE);
  const blockLevel = lastBlock[lastBlock.length - 1].level;
  const blockCorrect = lastBlock.filter((a) => a.correct).length;

  // A band seen twice with a passing score is settled; asking again spends
  // the learner's budget without changing the answer.
  const timesVisited = Math.floor(tally(answers, blockLevel).total / BLOCK_SIZE);
  if (timesVisited >= 2 && blockCorrect >= 2) {
    const assessed = verdict(answers);
    return { done: true, assessed, confidence: confidence(answers, assessed) };
  }

  let target: CefrLevel;
  if (blockCorrect === BLOCK_SIZE) target = step(blockLevel, 1);
  else if (blockCorrect >= 2) target = blockLevel;
  else target = step(blockLevel, -1);

  // Stepping off the end of the scale is itself an answer: nothing higher
  // to prove, nothing lower to fall back to.
  if (target === blockLevel && blockCorrect !== 2) {
    const assessed = verdict(answers);
    return { done: true, assessed, confidence: confidence(answers, assessed) };
  }

  return { done: false, serve: target };
}
