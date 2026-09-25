/**
 * Кэш контрастных карточек (#71): общий на всех пользователей, таблица
 * `contrast_cards`. Генерация — в фоне: при первой путанице пары, чтобы к
 * интервенции (вторая путаница) карточка уже была. Нет карточки — пара
 * показывается без коллокаций, как раньше.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiJson, objectSchema } from "./shared.ts";
import { canonicalPair, checkContrast, type ContrastBody, readContrast, type WordKey } from "./learning/mod.ts";
import type { Row } from "./studyData.ts";

/** Идущая генерация считается зависшей через 5 минут; неудачная повторяется через сутки. */
const PENDING_STALE_MS = 5 * 60_000;
const FAILED_RETRY_MS = 24 * 3_600_000;

type Side = WordKey & { meaning: string | null };

// deno-lint-ignore no-explicit-any
function samePair(q: any, a: WordKey, b: WordKey) {
  const on = (query: typeof q, col: string, v: string | null) => (v === null ? query.is(col, null) : query.eq(col, v));
  return on(on(q.eq("headword_a", a.headword).eq("headword_b", b.headword), "reading_a", a.reading), "reading_b", b.reading);
}

async function findRow(admin: SupabaseClient, a: WordKey, b: WordKey): Promise<Row | null> {
  const { data } = await samePair(admin.from("contrast_cards").select("id, status, body, updated_at"), a, b).maybeSingle();
  return (data ?? null) as Row | null;
}

/** Готовая карточка пары (стороны — в порядке пары) или `null`. */
export async function loadContrast(admin: SupabaseClient, a: WordKey, b: WordKey): Promise<ContrastBody | null> {
  const [x, y] = canonicalPair(a, b);
  const row = await findRow(admin, x, y);
  if (row?.status !== "ready") return null;
  const body = readContrast(row.body, x, y);
  if (!body) return null;
  // Просили в обратном порядке — коллокации тоже наоборот.
  return x.headword === a.headword && x.reading === a.reading
    ? body
    : { collocations: [body.collocations[1], body.collocations[0]] };
}

const SCHEMA = objectSchema(
  {
    collocations: {
      type: "array",
      items: objectSchema({ zh: { type: "string" }, pinyin: { type: "string" }, ru: { type: "string" } }, [
        "zh",
        "pinyin",
        "ru",
      ]),
    },
  },
  ["collocations"],
);

const SYSTEM = `Ты помогаешь русскоязычному ученику различать два китайских слова, которые он путает.
Дай по одной короткой частотной коллокации на каждое слово — так, чтобы по ним было видно, чем слова различаются.

Правила:
1. collocations — ровно два элемента: первый для слова A, второй для слова B.
2. zh — 2–6 иероглифов, только иероглифы, без знаков препинания. Содержит само слово (A в первой, B во второй) и НЕ содержит другое слово пары.
3. Лучше всего — параллельные коллокации с общей частью: 买东西 / 卖东西.
4. pinyin — пиньинь со знаками тонов, по слогу на иероглиф; у самого слова — то чтение, что дано.
5. ru — перевод коллокации на русский, 1–5 слов.`;

async function generate(admin: SupabaseClient, id: string, a: Side, b: Side): Promise<void> {
  const side = (label: string, s: Side) => `${label}: ${s.headword} ${s.reading ?? ""}${s.meaning ? ` — «${s.meaning}»` : ""}`;
  try {
    const raw = await aiJson<unknown>({
      name: "contrast_card",
      description: "Коллокации для различения пары слов",
      schema: SCHEMA,
      system: SYSTEM,
      prompt: `${side("A", a)}\n${side("B", b)}`,
      maxTokens: 800,
    });
    const body = checkContrast(raw, a, b);
    if (!body) console.warn("contrast_rejected", a.headword, b.headword, JSON.stringify(raw).slice(0, 400));
    await admin.from("contrast_cards").update(
      body
        ? { status: "ready", body, model: Deno.env.get("GEMINI_MODEL") ?? null }
        : { status: "failed", body: null },
    ).eq("id", id).eq("status", "pending");
  } catch (error) {
    console.error("contrast_failed", a.headword, b.headword, error);
    await admin.from("contrast_cards").update({ status: "failed" }).eq("id", id).eq("status", "pending");
  }
}

/**
 * Карточки нет (или прошлая попытка устарела) — занять строку и запустить
 * генерацию в фоне. Не ждёт ответа ИИ; ошибки только в журнал.
 */
export async function ensureContrast(admin: SupabaseClient, a: Side, b: Side): Promise<void> {
  try {
    const [x, y] = canonicalPair(a, b) as [Side, Side];
    const row = await findRow(admin, x, y);
    let id: string | null = null;
    if (!row) {
      const { data } = await admin.from("contrast_cards").insert({
        headword_a: x.headword,
        reading_a: x.reading,
        headword_b: y.headword,
        reading_b: y.reading,
      }).select("id").maybeSingle();
      id = (data?.id as string | undefined) ?? null; // конфликт — генерирует другой запрос
    } else {
      const age = Date.now() - new Date(row.updated_at as string).getTime();
      const stale = (row.status === "pending" && age > PENDING_STALE_MS) ||
        (row.status === "failed" && age > FAILED_RETRY_MS);
      if (stale) {
        const { data } = await admin.from("contrast_cards").update({ status: "pending" }).eq("id", row.id)
          .eq("updated_at", row.updated_at).select("id").maybeSingle();
        id = (data?.id as string | undefined) ?? null;
      }
    }
    if (!id) return;
    const task = generate(admin, id, x, y);
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(task);
  } catch (error) {
    console.error("contrast_ensure_failed", error);
  }
}
