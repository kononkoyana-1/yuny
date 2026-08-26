import { z } from "zod";

/**
 * `goal_outcomes` table (TZ.md §5) — the concrete language outcomes a Goal
 * decomposes into, shown on screen 05 (Goal Confirmation) and screen 10 (Goal).
 */
export const GoalOutcomeSchema = z.object({
  id: z.uuid(),
  goal_id: z.uuid(),
  label: z.string().min(1),
  description: z.string().min(1),
  position: z.number().int().nonnegative(),
  created_at: z.iso.datetime({ offset: true }),
});

export type GoalOutcome = z.infer<typeof GoalOutcomeSchema>;
