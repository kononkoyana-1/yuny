import { z } from "zod";
import { SkillSchema } from "./skillState";

/**
 * `recommendations` table (TZ.md §5) — backs Home's Today's Mission (TZ.md
 * §8 row 09, MVP Spec "Home — Recommendation": "In each moment the system
 * should strive to give: one best next action"). `reason` and
 * `skills_affected` are backend-computed (TZ.md §3 Rule 1 — skill priority
 * is never client-derived) and drive the "Why this?" progressive disclosure
 * (TZ.md §16 level 2/3).
 *
 * `mission_title`/`estimated_minutes` are denormalized onto the
 * recommendation itself rather than requiring a separate `Mission` fetch —
 * `recommendation-get`'s real output is already "recommendation + reason +
 * mission_id" (TZ.md §6), and Home only needs enough to render a mission
 * preview card, not the full `missions`/`activities` data model (that's
 * Phase 5's job, TZ.md §19).
 */
export const RecommendationSchema = z.object({
  id: z.uuid(),
  goal_id: z.uuid(),
  mission_id: z.uuid(),
  mission_title: z.string().min(1),
  estimated_minutes: z.number().int().positive(),
  reason: z.string().min(1),
  skills_affected: z.array(SkillSchema).min(1),
  created_at: z.iso.datetime({ offset: true }),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;
