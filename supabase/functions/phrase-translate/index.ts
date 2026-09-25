/**
 * `phrase-translate` (#76): перевод фразы из поиска и слова, из которых она
 * состоит.
 *
 * Тело: { text } — китайская фраза (→ русский) или русская (→ китайский).
 * Ответ: { direction, translation, zh, pinyin, words: [{ text, reading,
 * meaning, in_dictionary, punct }] }.
 *
 * Перевод — ИИ, общий кэш `phrase_translations` по нормализованному тексту;
 * новых переводов не больше 60 в час на пользователя (из кэша — без лимита).
 * Разбор на слова и пиньинь — кодом по словарю (`_shared/phrase.ts`), не
 * моделью: для русского запроса разбирается китайский перевод.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiJson, handler, HandlerError, json, objectSchema, requireString } from "../_shared/shared.ts";
import { must, type Row } from "../_shared/studyData.ts";
import {
  type DictWord,
  type Direction,
  directionOf,
  MAX_PHRASE,
  normalizePhrase,
  phrasePinyin,
  phraseSubstrings,
  segmentPhrase,
} from "../_shared/phrase.ts";

const HOURLY_LIMIT = 60;

const SCHEMA = objectSchema({ translation: { type: "string" } }, ["translation"]);

const SYSTEM = {
  "zh-ru": `Переведи китайскую фразу на русский так, как сказал бы носитель русского: естественно, без подстрочника, точно по смыслу. Только перевод, без пояснений и транскрипции.`,
  "ru-zh": `Переведи русскую фразу на китайский (упрощённые иероглифы, путунхуа) так, как естественно сказали бы в Китае. Только иероглифы и знаки препинания, без пиньиня и пояснений.`,
} as const;

async function translate(admin: SupabaseClient, userId: string, norm: string, text: string, direction: Direction) {
  const cached = must(
    await admin.from("phrase_translations").select("translation").eq("text_norm", norm).eq("direction", direction)
      .maybeSingle(),
  ) as Row | null;
  if (cached) return cached.translation as string;

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin.from("phrase_translations").select("id", { count: "exact", head: true })
    .eq("created_by", userId).gte("created_at", since);
  if ((count ?? 0) >= HOURLY_LIMIT) throw new HandlerError("phrase_rate_limited", 429);

  const raw = await aiJson<{ translation?: string }>({
    name: "phrase_translate",
    description: direction === "zh-ru" ? "Перевод с китайского на русский" : "Перевод с русского на китайский",
    schema: SCHEMA,
    system: SYSTEM[direction],
    prompt: text,
    maxTokens: 600,
  });
  const translation = (raw.translation ?? "").trim();
  const ok = direction === "zh-ru" ? /[А-Яа-яЁё]/.test(translation) : /\p{Script=Han}/u.test(translation);
  if (!ok || translation.length > 400) throw new HandlerError("ai_invalid_output", 502);
  // Гонка двух одинаковых запросов — побеждает первый, второй просто читает кэш.
  await admin.from("phrase_translations").upsert(
    { text_norm: norm, direction, translation, model: Deno.env.get("GEMINI_MODEL") ?? null, created_by: userId },
    { onConflict: "text_norm,direction", ignoreDuplicates: true },
  );
  return translation;
}

/** Статьи и уровни HSK для всех подстрок фразы. */
async function lexicon(admin: SupabaseClient, zh: string) {
  const subs = phraseSubstrings(zh);
  const dict = new Map<string, DictWord>();
  const hsk = new Map<string, number>();
  if (!subs.length) return { dict, hsk };
  const [entries, levels] = await Promise.all([
    admin.from("dictionary_entries").select("headword, reading, compact, hsk_level").in("headword", subs).limit(2000),
    admin.from("hsk_words").select("word, level").in("word", subs),
  ]);
  for (const e of must(entries) as Row[]) {
    // Несколько статей на заголовок — берём первую с русским значением.
    const prev = dict.get(e.headword);
    const russian = (e.compact ?? []).some((c: string) => /[А-Яа-яЁё]/.test(c));
    if (!prev || (russian && !prev.compact.some((c) => /[А-Яа-яЁё]/.test(c)))) {
      dict.set(e.headword, { reading: e.reading, compact: e.compact ?? [], hskLevel: e.hsk_level ?? null });
    }
  }
  for (const h of must(levels) as Row[]) hsk.set(h.word, Math.min(hsk.get(h.word) ?? 9, h.level));
  return { dict, hsk };
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const text = requireString(body, "text").trim();
    if (text.length > MAX_PHRASE) throw new HandlerError("phrase_too_long", 400);
    const direction = directionOf(text);
    if (!direction) throw new HandlerError("invalid_request", 400);

    const translation = await translate(admin, userId, normalizePhrase(text), text, direction);
    const zh = direction === "zh-ru" ? text : translation;
    const { dict, hsk } = await lexicon(admin, zh);
    const words = segmentPhrase(zh, dict, hsk);
    return json({
      direction,
      translation,
      zh,
      pinyin: phrasePinyin(words),
      words: words.map((w) => ({
        text: w.text,
        reading: w.reading,
        meaning: w.meaning,
        in_dictionary: w.inDictionary,
        punct: w.punct,
      })),
    });
  }),
);
