import { z } from "zod";

/**
 * `skill_states` table (TZ.md §5). `level`, `confidence`, and `trend` are
 * backend-computed (TZ.md §3, Rule 1) — the client only renders them.
 */
export const SkillSchema = z.enum([
  "speaking",
  "listening",
  "vocabulary",
  "grammar",
  "reading",
  "writing",
]);
export type Skill = z.infer<typeof SkillSchema>;

export const SkillTrendSchema = z.enum(["improving", "stable", "declining"]);
export type SkillTrend = z.infer<typeof SkillTrendSchema>;

export const SkillStateSchema = z.object({
  id: z.uuid(),
  learning_state_id: z.uuid(),
  skill: SkillSchema,
  /** 0..1 normalized proficiency within the skill. */
  level: z.number().min(0).max(1),
  /** 0..1 backend confidence in the level estimate. */
  confidence: z.number().min(0).max(1),
  trend: SkillTrendSchema,
});

export type SkillState = z.infer<typeof SkillStateSchema>;
