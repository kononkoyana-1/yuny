import { DictionarySearchRequestSchema, DictionarySearchResponseSchema } from "@yuny/shared";
import { invokeEdge } from "@/shared/lib/edge";
import type { DictionaryRepository } from "../dictionary.repository";

export const supabaseDictionaryRepository: DictionaryRepository = {
  async search(req) {
    const body = DictionarySearchRequestSchema.parse(req);
    const data = await invokeEdge<unknown>("dictionary-search", body);
    return DictionarySearchResponseSchema.parse(data);
  },
};
