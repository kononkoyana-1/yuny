/**
 * How much time the learner can give a day, asked on screen 08 — after the
 * assessment has told them where they stand.
 *
 * Asking before the level is known asks people to budget for work they cannot
 * yet picture. Asking after means the number is chosen against a real plan,
 * and screen 08 can immediately say what it buys: at ~6 minutes a lesson
 * (docs/onboarding-v2.md §7.1), 25 minutes is four lessons, not an abstraction.
 *
 * Fixed options rather than a free number field: a text box invites 45 or 60
 * from people who will not sustain it, and an abandoned plan is worse than a
 * modest one. The ladder is deliberately uneven — the gap from 5 to 15 is
 * where habit forms, above 25 the returns flatten for daily practice.
 */
export const DAILY_MINUTES_OPTIONS = [5, 10, 15, 25, 35] as const;

export type DailyMinutes = (typeof DAILY_MINUTES_OPTIONS)[number];

/**
 * What `goal-confirm` stores before the learner has chosen, because
 * `goals.daily_minutes` is NOT NULL and the goal is created on screen 05 —
 * the assessment needs a `goal_id` to attach answers to. Screen 08 always
 * commits the real choice before Home is reachable, so this value is never
 * what a plan is built from.
 */
export const PROVISIONAL_DAILY_MINUTES = 15;

/** Minutes per lesson the plan assumes (docs/onboarding-v2.md §7.1). */
const LESSON_MINUTES = 6;

/** "25 minutes" → 4 lessons. Shown next to each option so the choice is concrete. */
export function lessonsPerDay(minutes: number): number {
  return Math.max(1, Math.round(minutes / LESSON_MINUTES));
}
