/**
 * `dictionary-search` (TZ.md §13) — словарь одним полем: иероглиф, пиньинь и
 * русский перевод ищутся вместе, потому что поле у пользователя одно
 * (TZ.md §11, экран 04).
 *
 * Сам поиск живёт в `public.dictionary_search`: лестница «точное совпадение →
 * префикс → попадание в перевод» и выбор индекса под письменность — работа
 * планировщика, а не функции. Здесь остаются границы запроса, форма ответа и
 * признак «есть ещё».
 *
 * `action: "article"` — статья в листе: уровень HSK, состав слова, слова со
 * знаком (словарь 2.0, #79 #80 #84; `article.ts`). Без `action` — поиск.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HandlerError, json, requireString } from "../_shared/shared.ts";
import { isSearchable, pinyinPlain, queryKind } from "./search.ts";
import { article } from "./article.ts";

/** Держится заодно со `DictionarySearchRequestSchema` в `packages/shared`. */
const MAX_QUERY = 64;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 40;

interface SearchRow {
  id: number;
  headword: string;
  reading: string | null;
  senses: unknown;
  compact: string[];
  hsk_level: number | null;
  rank: number;
}

function boundedInt(
  body: Record<string, unknown>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = body[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HandlerError("invalid_request", 400);
  }
  return Math.min(Math.max(Math.round(value), min), max);
}

Deno.serve(
  handler(async ({ admin, body, userId }) => {
    if (body.action === "article") return json(await article(admin, userId, body));

    const query = requireString(body, "query").slice(0, MAX_QUERY);
    const limit = boundedInt(body, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = boundedInt(body, "offset", 0, 0, 10_000);

    const kind = queryKind(query);

    // Латиница без единой буквы (скажем, «...») запросом не является. Пустой
    // ответ тут честнее ошибки: пользователь ещё набирает.
    if (!isSearchable(query, kind)) {
      return json({ query, kind, limit, offset, has_more: false, items: [] });
    }

    // Строка сверх страницы — весь признак «есть ещё». `count(*)` по миллиону
    // строк стоил бы дороже самой выдачи, а листалке хватает и этого.
    const { data, error } = await admin.rpc("dictionary_search", {
      p_query: kind === "pinyin" ? pinyinPlain(query) : query,
      p_limit: limit + 1,
      p_offset: offset,
    });

    if (error) {
      console.error("dictionary_search_failed", error);
      throw new HandlerError("dictionary_unavailable", 503);
    }

    const rows = (data ?? []) as SearchRow[];
    const items = rows.slice(0, limit).map((row) => ({
      id: row.id,
      headword: row.headword,
      reading: row.reading,
      senses: row.senses ?? [],
      compact: row.compact ?? [],
      hsk_level: row.hsk_level,
      rank: row.rank,
    }));

    return json({
      query,
      kind,
      limit,
      offset,
      has_more: rows.length > limit,
      items,
    });
  }),
);
