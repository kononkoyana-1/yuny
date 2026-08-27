import { z } from "zod";
import { LearningStateSchema } from "./learningState";
import { SkillSchema } from "./skillState";

/**
 * Proposed contract addition (not yet in `TZ.md §6`'s Edge Function table).
 * Mirrors `assessment-next`'s real shape (`goal_id` + previous answers →
 * next question | `{ done: true }`) closely enough that a real
 * `SupabaseAssessmentRepository` can implement `AssessmentRepository`
 * without changing any screen. Deliberately text-only (no audio) — Speaking
 * Activity renderers are Phase 5 (`TZ.md §19`), so the MVP assessment tests
 * vocabulary/grammar/reading only.
 */
export const AssessmentQuestionSchema = z.object({
  id: z.uuid(),
  skill: SkillSchema,
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
});

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

/**
 * Proposed contract addition mirroring `assessment-complete`'s real output
 * (initial `learning_state` + `skill_states`, `TZ.md §6`) plus the
 * presentation-only "Stronger / Needs Work / Priority" summary that screen
 * 07 needs (`TZ.md §8` row 07). That summary is backend-owned by the same
 * logic (`TZ.md §3` Rule 1 — "приоритет навыков" is never client-derived),
 * so it must arrive as data, not be computed from `skill_states` on-device.
 */
export const AssessmentResultSchema = z.object({
  id: z.uuid(),
  goal_id: z.uuid(),
  learning_state: LearningStateSchema,
  stronger_skill: SkillSchema,
  needs_work_skill: SkillSchema,
  priority_label: z.string().min(1),
  /** Short ordered list of focus areas for screen 08 (Learning Strategy). */
  focus_areas: z.array(z.string().min(1)).min(1),
  created_at: z.iso.datetime({ offset: true }),
});

export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
