import type { Goal, GoalOutcome } from "@yuny/shared";

/**
 * Input for `goal-analyze` (TZ.md §6). Mirrors the Edge Function's request
 * body — the client sends raw user input, the backend derives everything
 * educational from it (TZ.md §3, Rule 1).
 */
export interface GoalDraftInput {
  raw_input: string;
  target_language: string;
  deadline: string;
  daily_minutes: number;
}

/**
 * A goal draft ready for `goal-confirm`, after the user has reviewed the
 * `goal-analyze` result (screens 04-05) and accepted or corrected it.
 */
export interface GoalDraft extends GoalDraftInput {
  title: string;
  outcomes: Pick<GoalOutcome, "label" | "description" | "position">[];
}

/**
 * A reference to an async backend job (TZ.md §6 "Асинхронные операции").
 * The client never polls — it subscribes to `jobs` via Realtime once
 * Supabase is wired in (Phase 6). For mock data the job resolves inline.
 */
export interface JobRef {
  job_id: string;
  kind: "goal_analyze" | "mission_generate" | "material_ingest" | "speaking_assess";
}

/**
 * `goals` + `goal_outcomes` domain repository (TZ.md §6 mock-first pattern).
 * Every implementation must parse its response through the Zod schemas in
 * `@yuny/shared` before returning — see `mock/goal.repository.mock.ts`.
 */
export interface GoalRepository {
  getActive(): Promise<Goal | null>;
  getOutcomes(goalId: string): Promise<GoalOutcome[]>;
  analyze(input: GoalDraftInput): Promise<JobRef>;
  confirm(draft: GoalDraft): Promise<Goal>;
}
