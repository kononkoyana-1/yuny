import { AnswerResultSchema, SessionPreviewSchema, StudySessionSchema } from "@yuny/shared";
import { invokeEdge } from "@/shared/lib/edge";
import type { StudyRepository } from "../study.repository";

/** Граница суток — 04:00 по часам пользователя; сервер считает её по смещению. */
const tzOffsetMin = () => -new Date().getTimezoneOffset();

export const supabaseStudyRepository: StudyRepository = {
  async preview() {
    const data = await invokeEdge<unknown>("session-build", { action: "preview", tz_offset_min: tzOffsetMin() });
    return SessionPreviewSchema.parse(data);
  },

  async start(input) {
    const data = await invokeEdge<unknown>("session-build", { action: "start", ...input, tz_offset_min: tzOffsetMin() });
    return StudySessionSchema.parse(data);
  },

  async submit(input) {
    const data = await invokeEdge<unknown>("review-submit", { ...input });
    return AnswerResultSchema.parse(data);
  },

  async pairStart(taskId) {
    await invokeEdge<unknown>("review-submit", { action: "pair_start", task_id: taskId });
  },
};
