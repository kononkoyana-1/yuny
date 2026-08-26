import { z } from "zod";
import { SkillStateSchema } from "./skillState";

/**
 * `learning_states` table (TZ.md §5). `skill_states` is the one-to-many
 * relation joined in for convenience — the repository is responsible for
 * assembling it from separate rows if the backend returns them separately.
 */
export const LearningStateSchema = z.object({
  id: z.uuid(),
  goal_id: z.uuid(),
  updated_at: z.iso.datetime({ offset: true }),
  skill_states: z.array(SkillStateSchema),
});

export type LearningState = z.infer<typeof LearningStateSchema>;
