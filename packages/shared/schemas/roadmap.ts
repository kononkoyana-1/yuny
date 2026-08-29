import { z } from "zod";
import { CefrLevelSchema } from "./cefr";

/**
 * `roadmap_modules` row — the learner's route to their goal, broken into
 * themed blocks (docs/onboarding-v2.md §6).
 *
 * Read-only on the client, and that is a product decision, not an
 * oversight: TZ.md §7 rejects a lesson catalogue because it competes with
 * "one best next action". The map shows where you are and what is coming;
 * it never lets you pick the next lesson yourself. If a screen ever makes a
 * module tappable-to-start, that decision has been reversed.
 */
export const RoadmapModuleKindSchema = z.enum(["foundation", "topic"]);
export type RoadmapModuleKind = z.infer<typeof RoadmapModuleKindSchema>;

/**
 * Exactly one module is `in_progress`; the next is `available`; the rest are
 * `locked`. The client renders this ordering, it does not compute it.
 */
export const RoadmapModuleStatusSchema = z.enum([
  "locked",
  "available",
  "in_progress",
  "completed",
]);
export type RoadmapModuleStatus = z.infer<typeof RoadmapModuleStatusSchema>;

export const RoadmapModuleSchema = z.object({
  id: z.uuid(),
  goal_id: z.uuid(),
  /** Null for a foundation module: it teaches basics rather than one theme. */
  topic_id: z.uuid().nullable(),
  position: z.number().int().nonnegative(),
  title: z.string().min(1),
  /** Backend copy explaining why this module belongs in this goal's route (TZ.md §16). */
  why: z.string().min(1),
  target_cefr: CefrLevelSchema,
  kind: RoadmapModuleKindSchema,
  status: RoadmapModuleStatusSchema,
});
export type RoadmapModule = z.infer<typeof RoadmapModuleSchema>;

/**
 * What Home and screen 08 render: the ordered modules plus where the learner
 * stands. `completed_modules` is a position in a route, not a score — TZ.md
 * §20 rules out numerical progress as the headline measure.
 */
export const RoadmapSchema = z.object({
  goal_id: z.uuid(),
  modules: z.array(RoadmapModuleSchema),
  completed_modules: z.number().int().nonnegative(),
  total_modules: z.number().int().positive(),
});
export type Roadmap = z.infer<typeof RoadmapSchema>;
