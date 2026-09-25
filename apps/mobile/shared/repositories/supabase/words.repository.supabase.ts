import {
  WordsExtractRequestSchema,
  WordsExtractResponseSchema,
  WordsExtractResultSchema,
} from "@yuny/shared";
import { awaitJob } from "@/shared/lib/jobs";
import { invokeEdge } from "@/shared/lib/edge";
import type { WordsRepository } from "../words.repository";

export const supabaseWordsRepository: WordsRepository = {
  async extract(req) {
    const body = WordsExtractRequestSchema.parse(req);
    const data = await invokeEdge<unknown>("words-extract", body);
    return WordsExtractResponseSchema.parse(data);
  },

  async cancel(materialId) {
    await invokeEdge<unknown>("words-extract", { action: "cancel", material_id: materialId });
  },

  async awaitWords(jobId, timeoutMs = 120_000) {
    const result = await awaitJob<unknown>(jobId, timeoutMs);
    return WordsExtractResultSchema.parse(result);
  },
};
