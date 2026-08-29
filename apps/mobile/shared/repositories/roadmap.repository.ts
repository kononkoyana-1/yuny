import type { Roadmap } from "@yuny/shared";

/**
 * The learner's route to their goal, broken into themed modules
 * (docs/onboarding-v2.md §6). Backs the roadmap on Home and screen 08.
 *
 * Read-only by design, and there is no write method here on purpose: TZ.md §7
 * rejects a lesson catalogue because it competes with "one best next action".
 * The map shows where you are and what is coming; it never lets the learner
 * pick the next lesson. Adding a `start(moduleId)` to this interface would be
 * the moment that decision is reversed.
 *
 * Resolves to `null` when no map exists yet — which is the normal state until
 * the backend builds one (plan-tasks "Этап 6"), not an error.
 */
export interface RoadmapRepository {
  getForGoal(goalId: string): Promise<Roadmap | null>;
}
