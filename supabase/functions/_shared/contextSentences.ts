/**
 * Кэш предложений со словом (#64): общий на всех пользователей, таблицы
 * `context_batches` (заказ на слово) и `context_sentences` (проверенные
 * предложения). Генерация — в фоне, задачей в `jobs` (`context_generate`),
 * никогда не на лету в упражнении: занятие берёт только то, что уже в кэше.
 * Нет покрытого предложения — у знакомства нет примера, «Использую» не
 * спрашивается (vocabulary-engine.md §7).
 *
 * Проверка — чистыми функциями `learning/context.ts`; здесь база и ИИ.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiJson, createJob, objectSchema, runJobInBackground } from "./shared.ts";
import {
  BATCH_COUNT,
  checkBatch,
  type ContextSentence,
  type ContextUse,
  FUNCTION_WORDS,
  type KnownWords,
  knownWords,
  type Lexicon,
  pickSentence,
  type PlanInput,
  readSentence,
  senseKey,
  TIER_LENGTH,
  unlockedSkills,
  type WordKey,
} from "./learning/mod.ts";
import { must, type Row, type StudyLexeme } from "./studyData.ts";

/** Слово в смысле, в котором его учат: перевод пользователя. */
export interface ContextWord extends WordKey {
  translation: string | null;
}

/** Идущая генерация считается зависшей через 10 минут; неудачная повторяется через сутки. */
const PENDING_STALE_MS = 10 * 60_000;
const FAILED_RETRY_MS = 24 * 3_600_000;
/** Готовые не подошли пользователю — ещё пачка не раньше чем через 6 часов и не больше трёх раз. */
const MORE_AFTER_MS = 6 * 3_600_000;
const MAX_ROUNDS = 3;
/** Слов за один фоновый запуск: генерация — несколько секунд на слово. */
const MAX_PER_RUN = 4;
const CHUNK = 100;

const COLUMNS = "id, headword, reading, sense_key, tier, zh, pinyin, ru, tokens, token_levels, target_index, alt_orders, hsk_max";

/** Ключ слова в кэше: заголовок, чтение, смысл. */
export function contextKey(w: ContextWord): string {
  return `${w.headword}\u0000${w.reading ?? ""}\u0000${senseKey(w.translation)}`;
}

const rowKey = (r: Row) => `${r.headword}\u0000${r.reading ?? ""}\u0000${r.sense_key ?? ""}`;

function chunks<T>(xs: T[], n = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** Предложения из кэша по словам: ключ — `contextKey`. */
export async function loadContexts(admin: SupabaseClient, words: ContextWord[]): Promise<Map<string, ContextSentence[]>> {
  const wanted = new Set(words.map(contextKey));
  const out = new Map<string, ContextSentence[]>();
  const heads = [...new Set(words.map((w) => w.headword))];
  for (const part of chunks(heads)) {
    const rows = must(await admin.from("context_sentences").select(COLUMNS).in("headword", part).limit(10_000)) as Row[];
    for (const r of rows) {
      const key = rowKey(r);
      if (!wanted.has(key)) continue;
      const s = readSentence(r);
      if (s) (out.get(key) ?? out.set(key, []).get(key)!).push(s);
    }
  }
  return out;
}

/** Одно предложение по id — для повтора C1/C2 после ошибки (то же предложение). */
export async function loadSentence(admin: SupabaseClient, id: string): Promise<ContextSentence | null> {
  const row = must(await admin.from("context_sentences").select(COLUMNS).eq("id", id).maybeSingle()) as Row | null;
  return row ? readSentence(row) : null;
}

// ------------------------------------------------------------- генерация

const ITEM = objectSchema(
  {
    tier: { type: "string", enum: ["T1", "T2"] },
    zh: { type: "string" },
    pinyin: { type: "string" },
    ru: { type: "string" },
    tokens: { type: "array", items: { type: "string" } },
    target_index: { type: "integer" },
    alt_orders: { type: "array", items: { type: "array", items: { type: "string" } } },
  },
  ["tier", "zh", "pinyin", "ru", "tokens", "target_index", "alt_orders"],
);

const SCHEMA = objectSchema({ items: { type: "array", items: ITEM } }, ["items"]);

const SYSTEM = `Ты пишешь короткие китайские фразы для ученика, чей родной язык — русский.
Цель — чтобы ученик вспомнил и употребил ОДНО слово в естественной фразе.

Правила:
1. Используй слово TARGET ровно в указанном смысле SENSE_RU. Если слово многозначно — только этот смысл. Слово стоит во фразе отдельным словом, а не частью другого слова.
2. Все остальные слова — ТОЛЬКО из KNOWN_WORDS и FUNCTION_WORDS, а если их не хватает — самые частые слова HSK1–2. Если без чужого слова фраза не складывается — напиши другую фразу, а не добавляй слово.
3. Грамматика — самая простая: подлежащее, сказуемое, дополнение; 想/要 + глагол, 不 + глагол, 太…了, 在 + место.
4. T1 — коллокация из ${TIER_LENGTH.T1[0]}–${TIER_LENGTH.T1[1]} иероглифов без знаков препинания (买票). T2 — простое предложение из ${TIER_LENGTH.T2[0]}–10 иероглифов с точкой, вопросом или восклицанием в конце (我想买咖啡。).
5. Так говорят люди: в магазине, в чате, дома. Не «это книга», не «小明是学生», не лозунги, не перечисления. Разные подлежащие и ситуации в пачке. Никаких имён 小明/小红.
6. ru — естественный русский перевод, не подстрочник.
7. pinyin — пиньинь со знаками тонов, слова через пробел, по слогу на каждый иероглиф.
8. tokens — фраза, разрезанная на слова, как в словаре; target_index — номер TARGET в tokens.
9. alt_orders — другие допустимые порядки слов той же фразы (без знаков препинания), если они есть; иначе пустой список.`;

/** Подстроки из иероглифов длиной 1–4 — кандидаты в слова словаря. */
function substrings(texts: string[]): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    for (const run of t.match(/\p{Script=Han}+/gu) ?? []) {
      const chars = [...run];
      for (let i = 0; i < chars.length; i++) {
        for (let len = 1; len <= 4 && i + len <= chars.length; len++) out.add(chars.slice(i, i + len).join(""));
      }
    }
  }
  return [...out];
}

/** Словарь для проверки: статьи БКРС и слова HSK среди подстрок фраз. */
async function loadLexicon(admin: SupabaseClient, texts: string[]): Promise<Lexicon> {
  const readings = new Map<string, string[]>();
  const hsk = new Map<string, number>();
  for (const part of chunks(substrings(texts), 150)) {
    const [entries, levels] = await Promise.all([
      admin.from("dictionary_entries").select("headword, reading").in("headword", part).limit(5_000),
      admin.from("hsk_words").select("word, level").in("word", part),
    ]);
    for (const e of must(entries) as Row[]) {
      const list = readings.get(e.headword) ?? readings.set(e.headword, []).get(e.headword)!;
      if (e.reading) list.push(e.reading);
    }
    for (const h of must(levels) as Row[]) hsk.set(h.word, Math.min(hsk.get(h.word) ?? 9, h.level));
  }
  return { readings, hsk };
}

interface Claimed extends ContextWord {
  batchId: string;
  round: number;
}

async function generate(admin: SupabaseClient, w: Claimed, knownList: string[]): Promise<number> {
  const sense = (w.translation ?? "").split(";")[0].trim() || null;
  let saved = 0;
  try {
    const raw = await aiJson<unknown>({
      name: "context_sentences",
      description: "Короткие фразы со словом для ученика",
      schema: SCHEMA,
      system: SYSTEM,
      prompt: JSON.stringify({
        target: w.headword,
        reading: w.reading,
        sense_ru: sense,
        count: { T1: BATCH_COUNT.T1, T2: BATCH_COUNT.T2 },
        known_words: knownList,
        function_words: [...FUNCTION_WORDS],
      }),
      maxTokens: 4000,
    });
    const items = (raw as { items?: unknown[] })?.items ?? [];
    const lexicon = await loadLexicon(admin, items.map((i) => String((i as Row)?.zh ?? "")));
    const sentences = checkBatch(raw, w, lexicon);
    if (sentences.length < items.length) {
      console.warn("context_rejected", w.headword, `${sentences.length}/${items.length}`);
    }
    const model = Deno.env.get("GEMINI_MODEL") ?? null;
    if (sentences.length) {
      const res = await admin.from("context_sentences").upsert(
        sentences.map((s) => ({
          batch_id: w.batchId,
          headword: w.headword,
          reading: w.reading,
          sense_key: senseKey(w.translation),
          tier: s.tier,
          zh: s.zh,
          pinyin: s.pinyin,
          ru: s.ru,
          tokens: s.tokens,
          token_levels: s.tokenLevels,
          target_index: s.targetIndex,
          alt_orders: s.altOrders,
          hsk_max: s.hskMax,
          model,
        })),
        { onConflict: "headword,reading,sense_key,zh", ignoreDuplicates: true },
      );
      if (res.error) throw res.error;
      saved = sentences.length;
    }
    // Первая пачка пустая — неудача (повтор через сутки); следующие дополняют готовое.
    await admin.from("context_batches").update(
      saved || w.round > 1 ? { status: "ready", model } : { status: "failed" },
    ).eq("id", w.batchId).eq("status", "pending");
  } catch (error) {
    console.error("context_failed", w.headword, error);
    await admin.from("context_batches").update({ status: w.round > 1 ? "ready" : "failed" }).eq("id", w.batchId)
      .eq("status", "pending");
  }
  return saved;
}

/** Занять заказ на слово: новый, зависший, неудачный давно или «ещё пачку». `null` — не нужно или занят другим. */
async function claim(admin: SupabaseClient, w: ContextWord & { more: boolean }, row: Row | undefined): Promise<Claimed | null> {
  if (!row) {
    const { data } = await admin.from("context_batches").insert({
      headword: w.headword,
      reading: w.reading,
      sense_key: senseKey(w.translation),
    }).select("id").maybeSingle();
    // Конфликт — заказ занял другой запрос.
    return data?.id ? { ...w, batchId: data.id as string, round: 1 } : null;
  }
  const age = Date.now() - new Date(row.updated_at as string).getTime();
  const retry = (row.status === "pending" && age > PENDING_STALE_MS) || (row.status === "failed" && age > FAILED_RETRY_MS);
  const more = row.status === "ready" && w.more && row.rounds < MAX_ROUNDS && age > MORE_AFTER_MS;
  if (!retry && !more) return null;
  const round = more ? row.rounds + 1 : row.rounds;
  const { data } = await admin.from("context_batches").update({ status: "pending", rounds: round }).eq("id", row.id)
    .eq("updated_at", row.updated_at).select("id").maybeSingle();
  return data?.id ? { ...w, batchId: row.id as string, round } : null;
}

/**
 * Заказать предложения для слов в фоне. `more` — готовые предложения есть,
 * но пользователю не подходят по словам: нужна ещё пачка с его знакомыми
 * словами. Не ждёт ИИ; ошибки только в журнал.
 */
export async function ensureContexts(
  admin: SupabaseClient,
  userId: string,
  words: (ContextWord & { more: boolean })[],
  knownList: string[],
): Promise<void> {
  try {
    const unique = [...new Map(words.map((w) => [contextKey(w), w])).values()];
    if (!unique.length) return;
    const rows = new Map<string, Row>();
    for (const part of chunks([...new Set(unique.map((w) => w.headword))])) {
      const found = must(
        await admin.from("context_batches").select("id, headword, reading, sense_key, status, rounds, updated_at")
          .in("headword", part),
      ) as Row[];
      for (const r of found) rows.set(rowKey(r), r);
    }
    const claimed: Claimed[] = [];
    for (const w of unique) {
      if (claimed.length >= MAX_PER_RUN) break;
      const c = await claim(admin, w, rows.get(contextKey(w)));
      if (c) claimed.push(c);
    }
    if (!claimed.length) return;
    const jobId = await createJob(admin, userId, "context_generate", {
      words: claimed.map((c) => ({ headword: c.headword, reading: c.reading, round: c.round })),
    });
    runJobInBackground(admin, jobId, async () => {
      let sentences = 0;
      for (const c of claimed) sentences += await generate(admin, c, knownList);
      return { words: claimed.length, sentences };
    });
  } catch (error) {
    console.error("context_ensure_failed", error);
  }
}

// ---------------------------------------------------------------- занятие

/** Предложения для занятия: что знает пользователь, кэш и слова, где «Использую» можно спросить. */
export interface SessionContexts {
  known: KnownWords;
  /** Слова с покрытым предложением — для `PlanInput.contextReady`. */
  ready: Set<string>;
  /** Покрытое предложение для задачи; нет — `null`. */
  pick(l: StudyLexeme, use: ContextUse, seed: number): ContextSentence | null;
  /** Догрузить кэш для слов, которых ещё нет (знакомства из плана). */
  load(words: StudyLexeme[]): Promise<void>;
}

/**
 * Кэш для занятия: слова, у которых открыт «Использую», и ближайшие новые
 * (пример в знакомстве). Каким из них не хватает покрытого предложения —
 * заказ в фоне, к следующему занятию будет.
 */
export async function sessionContexts(
  admin: SupabaseClient,
  userId: string,
  input: Pick<PlanInput, "lexemes" | "states">,
  lexemes: StudyLexeme[],
  upcoming: StudyLexeme[],
): Promise<SessionContexts> {
  const known = knownWords(lexemes, input.states);
  const useWords = lexemes.filter((l) => {
    const st = input.states[l.id];
    return !!st?.read && unlockedSkills(st, l.goal).includes("use");
  });
  const words = [...new Map([...useWords, ...upcoming].map((l) => [contextKey(l), l])).values()];
  const cache = await loadContexts(admin, words);
  const loaded = new Set(words.map(contextKey));
  const listOf = (l: StudyLexeme) => cache.get(contextKey(l)) ?? [];
  const pick = (l: StudyLexeme, use: ContextUse, seed: number) => pickSentence(listOf(l), { use, known, seed });
  const ready = new Set(useWords.filter((l) => pick(l, "C1", 0)).map((l) => l.id));

  const useIds = new Set(useWords.map((l) => l.id));
  const missing = words
    .filter((l) => (useIds.has(l.id) ? !ready.has(l.id) : !pick(l, "example", 0)))
    .map((l) => ({ ...l, more: listOf(l).length > 0 }));
  if (missing.length) {
    const task = ensureContexts(admin, userId, missing, known.list);
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(task);
    else await task;
  }

  return {
    known,
    ready,
    pick,
    async load(more: StudyLexeme[]) {
      const fresh = more.filter((l) => !loaded.has(contextKey(l)));
      if (!fresh.length) return;
      for (const l of fresh) loaded.add(contextKey(l));
      for (const [k, v] of await loadContexts(admin, fresh)) cache.set(k, v);
    },
  };
}
