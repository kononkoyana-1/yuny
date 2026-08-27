import { z } from "zod";
import { SkillSchema } from "./skillState";
import { MascotStateSchema } from "./mascotState";

/**
 * `missions` row (TZ.md §5). Phase 5 restricts this client's view to the
 * two task types it actually renders — `vocabulary_choice` (multiple
 * choice) and `vocabulary_recall` (text input) — not the full eight-type
 * registry TZ.md §9 describes; adding a renderer later means widening this
 * union, not redesigning it.
 */
export const TaskTypeSchema = z.enum(["vocabulary_choice", "vocabulary_recall"]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

/** Renderer payload for `vocabulary_choice` — never carries the answer. */
export const MultipleChoicePayloadSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
});

/** Renderer payload for `vocabulary_recall` — never carries the answer. */
export const TextInputPayloadSchema = z.object({
  sentence_with_blank: z.string().min(1),
});

export const MissionTaskSchema = z.object({
  id: z.uuid(),
  mission_id: z.uuid(),
  type: TaskTypeSchema,
  payload: z.union([MultipleChoicePayloadSchema, TextInputPayloadSchema]),
  position: z.number().int().nonnegative(),
  status: z.enum(["pending", "in_progress", "completed"]),
});
export type MissionTask = z.infer<typeof MissionTaskSchema>;

export const MissionSchema = z.object({
  id: z.uuid(),
  goal_id: z.uuid(),
  title: z.string().min(1),
  purpose: z.string().min(1),
  why: z.string().min(1),
  estimated_minutes: z.number().int().positive(),
  status: z.enum(["pending", "active", "completed", "skipped"]),
  tasks: z.array(MissionTaskSchema),
});
export type Mission = z.infer<typeof MissionSchema>;

/**
 * `activity-submit`'s response for one task (TZ.md §6) — feedback and
 * evidence strength already decided server-side (TZ.md §3 Rule 1); the
 * client only renders them.
 */
export const TaskResultSchema = z.object({
  feedback: z.object({
    went_well: z.string().min(1),
    improve: z.string().min(1),
    example: z.string().nullable(),
  }),
  evidence: z.object({
    strength: z.enum(["weak", "moderate", "strong"]),
  }),
  mascot_state: MascotStateSchema.nullable(),
  mission_completed: z.boolean(),
});
export type TaskResult = z.infer<typeof TaskResultSchema>;

/**
 * Mission Result screen's aggregate (TZ.md-external Phase 5 task) —
 * derived from the same persisted `activities`/`evidence` rows every time,
 * live or after an app restart, rather than from transient navigation
 * state. `skills_practiced` is informational only; no skill-gap logic
 * reads it back (no adaptive learning in this phase).
 */
export const MissionResultSchema = z.object({
  mission_id: z.uuid(),
  title: z.string().min(1),
  total_tasks: z.number().int().positive(),
  correct_tasks: z.number().int().nonnegative(),
  skills_practiced: z.array(SkillSchema),
});
export type MissionResult = z.infer<typeof MissionResultSchema>;
