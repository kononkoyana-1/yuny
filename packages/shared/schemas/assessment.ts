import { z } from "zod";
import { CefrLevelSchema } from "./cefr";
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
  /**
   * What the learner claimed on screen 03 against what the ladder concluded.
   * Screen 07 shows the comparison, and it is the backend that decides both
   * halves — the client never derives a level (TZ.md §3, Rule 1).
   *
   * `assessed_cefr` is null when no answered question carried a band: an
   * unlevelled bank must not be reported as a measured level.
   */
  declared_cefr: CefrLevelSchema.nullable(),
  assessed_cefr: CefrLevelSchema.nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
