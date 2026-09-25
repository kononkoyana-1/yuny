import {
  DictionaryArticleRequestSchema,
  DictionaryArticleSchema,
  DictionarySearchRequestSchema,
  DictionarySearchResponseSchema,
} from "@yuny/shared";
import { invokeEdge } from "@/shared/lib/edge";
import type { DictionaryRepository } from "../dictionary.repository";

export const supabaseDictionaryRepository: DictionaryRepository = {
  async search(req) {
    const body = DictionarySearchRequestSchema.parse(req);
    const data = await invokeEdge<unknown>("dictionary-search", body);
    return DictionarySearchResponseSchema.parse(data);
  },
  async article(req) {
    const body = DictionaryArticleRequestSchema.parse(req);
    const data = await invokeEdge<unknown>("dictionary-search", { action: "article", ...body });
    return DictionaryArticleSchema.parse(data);
  },
};
