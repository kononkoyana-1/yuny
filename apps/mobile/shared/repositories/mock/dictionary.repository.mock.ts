import {
  DictionarySearchRequestSchema,
  DictionarySearchResponseSchema,
  type DictionaryEntry,
  type DictionaryQueryKind,
} from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { pinyinPlain, queryKind, readingsPlain } from "@/shared/lib/dictionaryText";
import type { DictionaryRepository } from "../dictionary.repository";
import { delay } from "./delay";
import { mockDictionary } from "./dictionary.fixtures";

/**
 * Переключатель ошибки поиска, по образцу `EXPO_PUBLIC_MOCK_MODULES_EMPTY`:
 * без него состояние ошибки экрана словаря в моке не увидеть.
 */
const MOCK_DICTIONARY_ERROR = process.env.EXPO_PUBLIC_MOCK_DICTIONARY_ERROR === "true";

const DEFAULT_LIMIT = 20;

/**
 * Лестница рангов `public.dictionary_search`, упрощённая: 0 — точное
 * совпадение, 1 — префикс, 2 — попадание в перевод.
 */
function rankOf(entry: Omit<DictionaryEntry, "rank">, query: string, kind: DictionaryQueryKind) {
  if (kind === "hanzi") {
    if (entry.headword === query) return 0;
    return entry.headword.startsWith(query) ? 1 : null;
  }
  if (kind === "pinyin") {
    const needle = pinyinPlain(query);
    const readings = readingsPlain(entry.reading);
    if (readings.includes(needle)) return 0;
    return readings.some((r) => r.startsWith(needle)) ? 1 : null;
  }
  const needle = query.trim().toLocaleLowerCase("ru");
  return entry.senses.some((s) => s.gloss.toLocaleLowerCase("ru").includes(needle)) ? 2 : null;
}

export const mockDictionaryRepository: DictionaryRepository = {
  async search(req) {
    const { query, limit = DEFAULT_LIMIT, offset = 0 } = DictionarySearchRequestSchema.parse(req);
    await delay(undefined, 350);
    if (MOCK_DICTIONARY_ERROR) throw new BackendError("dictionary_unavailable");

    const kind = queryKind(query);
    const ranked = mockDictionary
      .map((entry) => ({ ...entry, rank: rankOf(entry, query, kind) }))
      .filter((entry): entry is DictionaryEntry => entry.rank !== null)
      .sort((a, b) => a.rank - b.rank || a.headword.length - b.headword.length);

    return DictionarySearchResponseSchema.parse({
      query,
      kind,
      limit,
      offset,
      has_more: ranked.length > offset + limit,
      items: ranked.slice(offset, offset + limit),
    });
  },
};
