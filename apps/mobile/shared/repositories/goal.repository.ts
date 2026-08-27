import type { Goal, GoalOutcome, Skill } from "@yuny/shared";

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
 * Proposed contract addition (TZ.md §21.2 rule 3 — propose, don't work
 * around silently). The `goal-analyze` row in TZ.md §6's Edge Function
 * table already promises a richer result than `JobRef` alone carries:
 * "job_id → outcomes, required skills, feasibility, предложенные
 * корректировки". This is the shape that result resolves to once the job
 * completes — `getAnalysis(jobId)` is the missing method to fetch it
 * (mirrors the `analyze()` → `getAnalysis()` split this repository now
 * has with `complete()` → `getResult()` on `AssessmentRepository`).
 * `target_situations`/`required_skills` are advisory display-only fields
 * for screen 04 (MVP Spec "System identifies: target situations; language
 * outcomes; required skills") — they are not persisted to `goals` (TZ.md §5
 * has no such columns), so they are not part of `GoalDraft`.
 */
export interface GoalAnalysis {
  title: string;
  target_situations: string[];
  required_skills: Skill[];
  outcomes: Pick<GoalOutcome, "label" | "description" | "position">[];
}

/**
 * A reference to an async backend job (TZ.md §6 "Асинхронные операции").
 * The client never polls — it subscribes to `jobs` via Realtime once
 * Supabase is wired in (Phase 6). For mock data the job resolves inline.
 *
 * `assessment_evaluate` added here (missing from the original union) to
 * match the loading-copy table in TZ.md §10, which already lists
 * "assessment_evaluate → Checking your answers…" as a real job kind.
 */
export interface JobRef {
  job_id: string;
  kind:
    | "goal_analyze"
    | "assessment_evaluate"
    | "mission_generate"
    | "material_ingest"
    | "speaking_assess";
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
  getAnalysis(jobId: string): Promise<GoalAnalysis>;
  confirm(draft: GoalDraft): Promise<Goal>;
}
