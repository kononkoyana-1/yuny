import {
  AnswerResultSchema,
  FolderMapSchema,
  FolderProgressListSchema,
  FolderStudyPlanSchema,
  SessionPreviewSchema,
  StudySessionSchema,
  WordProgressSchema,
} from "@yuny/shared";
import { invokeEdge } from "@/shared/lib/edge";
import type { StudyRepository } from "../study.repository";

/** Граница суток — полночь по часам пользователя; сервер считает её по смещению. */
const tzOffsetMin = () => -new Date().getTimezoneOffset();

export const supabaseStudyRepository: StudyRepository = {
  async preview() {
    const data = await invokeEdge<unknown>("session-build", { action: "preview", tz_offset_min: tzOffsetMin() });
    return SessionPreviewSchema.parse(data);
  },

  async folderProgress() {
    const data = await invokeEdge<unknown>("learning-overview", { action: "folders", tz_offset_min: tzOffsetMin() });
    return FolderProgressListSchema.parse(data);
  },

  async folderMap(folderId) {
    const data = await invokeEdge<unknown>("learning-overview", {
      action: "folder",
      folder_id: folderId,
      tz_offset_min: tzOffsetMin(),
    });
    return FolderMapSchema.parse(data);
  },

  async wordProgress(word) {
    const data = await invokeEdge<unknown>("learning-overview", {
      action: "word",
      headword: word.headword,
      reading: word.reading,
      tz_offset_min: tzOffsetMin(),
    });
    return WordProgressSchema.parse(data);
  },

  async folderPlan(folderId) {
    const data = await invokeEdge<unknown>("session-build", {
      action: "folder_preview",
      folder_id: folderId,
      tz_offset_min: tzOffsetMin(),
    });
    return FolderStudyPlanSchema.parse(data);
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

  async reportContext(taskId) {
    await invokeEdge<unknown>("review-submit", { action: "report_context", task_id: taskId });
  },
};
