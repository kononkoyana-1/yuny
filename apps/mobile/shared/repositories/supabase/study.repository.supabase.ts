import { SessionPreviewSchema } from "@yuny/shared";
import { invokeEdge } from "@/shared/lib/edge";
import type { StudyRepository } from "../study.repository";

/** Граница суток — 04:00 по часам пользователя; сервер считает её по смещению. */
const tzOffsetMin = () => -new Date().getTimezoneOffset();

export const supabaseStudyRepository: StudyRepository = {
  async preview() {
    const data = await invokeEdge<unknown>("session-build", { action: "preview", tz_offset_min: tzOffsetMin() });
    return SessionPreviewSchema.parse(data);
  },
};
