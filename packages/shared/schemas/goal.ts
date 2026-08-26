import { z } from "zod";

/**
 * `goals` table (TZ.md §5). `readiness_label`/`readiness_reason` are
 * backend-computed (TZ.md §3, Rule 1) — the client never derives them.
 */
export const GoalStatusSchema = z.enum(["draft", "active", "paused", "completed"]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

export const GoalSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  raw_input: z.string().min(1),
  title: z.string().min(1),
  target_language: z.string().min(2),
  deadline: z.iso.date(),
  daily_minutes: z.number().int().positive(),
  status: GoalStatusSchema,
  readiness_label: z.string().min(1).nullable(),
  readiness_reason: z.string().min(1).nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

export type Goal = z.infer<typeof GoalSchema>;
