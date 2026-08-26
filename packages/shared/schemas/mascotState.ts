import { z } from "zod";

/**
 * `mascot_states` table (TZ.md §5 / §11). `stage`, `mood`, and
 * `growth_progress` are backend-computed from Evidence — the client never
 * derives them (TZ.md §3 Rule 1, §11 "Правила").
 */
export const MascotStageSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type MascotStage = z.infer<typeof MascotStageSchema>;

export const MascotMoodSchema = z.enum(["neutral", "thinking", "celebrating", "resting"]);
export type MascotMood = z.infer<typeof MascotMoodSchema>;

export const MascotStateSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  stage: MascotStageSchema,
  mood: MascotMoodSchema,
  /** 0..1 progress within the current stage. */
  growth_progress: z.number().min(0).max(1),
  updated_at: z.iso.datetime({ offset: true }),
});

export type MascotState = z.infer<typeof MascotStateSchema>;
