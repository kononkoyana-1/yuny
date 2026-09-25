import {
  WordsExtractRequestSchema,
  WordsExtractResponseSchema,
  WordsExtractResultSchema,
} from "@yuny/shared";
import { uuid } from "@/shared/lib/uuid";
import { BackendError } from "@/shared/lib/backendError";
import type { WordsRepository } from "../words.repository";
import { delay } from "./delay";
import { mockExtractedWords } from "./words.fixtures";

/**
 * Переключатель отказа, по образцу `EXPO_PUBLIC_MOCK_DICTIONARY_ERROR`:
 * `rejected` — в файле нет китайских слов, `failed` — упал сам разбор,
 * `slow` — разбор идёт минуту (проверить «Отмена»).
 */
const MOCK_WORDS = process.env.EXPO_PUBLIC_MOCK_WORDS;

export const mockWordsRepository: WordsRepository = {
  async extract(req) {
    const { material_id } = WordsExtractRequestSchema.parse(req);
    return delay(
      WordsExtractResponseSchema.parse({ job_id: uuid(), kind: "words_extract", material_id }),
      300,
    );
  },

  async cancel() {},

  async awaitWords() {
    // `slow` — разбор идёт минуту: видно «Отмена».
    await delay(undefined, MOCK_WORDS === "slow" ? 60_000 : 1500);
    if (MOCK_WORDS === "rejected") throw new BackendError("not_language_material");
    if (MOCK_WORDS === "failed") throw new BackendError("ai_unavailable");
    return WordsExtractResultSchema.parse(mockExtractedWords);
  },
};
