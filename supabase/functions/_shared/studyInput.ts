/**
 * Вход планировщика для одного пользователя: слова в папках, память навыков,
 * пары, настройки, темп и граница его дня. Общий для `session-build` и
 * `learning-overview` — оба считают по одним и тем же данным.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { DAY_MS, MODEL, type PlanInput } from "./learning/mod.ts";
import { loadLexemes, loadPairs, loadStates, must, type Row } from "./studyData.ts";

/**
 * Сутки начинаются в полночь по часам пользователя: выученное вечером после
 * полуночи уже «вчерашнее» (решение владельца, было 04:00).
 */
const DAY_BOUNDARY_H = 0;

export function dayStart(now: Date, tzOffsetMin: number): Date {
  const local = now.getTime() + tzOffsetMin * 60_000 - DAY_BOUNDARY_H * 3_600_000;
  const startLocal = Math.floor(local / DAY_MS) * DAY_MS;
  return new Date(startLocal - tzOffsetMin * 60_000 + DAY_BOUNDARY_H * 3_600_000);
}

/** Темп: заданий в минуту по медиане ответа (+ время на чтение задания); мало данных — 4. */
async function pace(admin: SupabaseClient, userId: string): Promise<number> {
  const rows = must(
    await admin.from("review_events").select("latency_ms").eq("user_id", userId).not("latency_ms", "is", null)
      .order("created_at", { ascending: false }).limit(200),
  ) as Row[];
  if (rows.length < 20) return 4;
  const xs = rows.map((r) => r.latency_ms as number).sort((a, b) => a - b);
  return 60_000 / (xs[Math.floor(xs.length / 2)] + 5_000);
}

/** Что уже спрашивали сегодня: навыки и пары (в «Сегодня» не повторяем). */
async function reviewedSince(admin: SupabaseClient, userId: string, since: Date): Promise<Set<string>> {
  const rows = must(
    await admin.from("review_events").select("lexeme_id, skill, pair_id, exercise").eq("user_id", userId)
      .gte("created_at", since.toISOString()).not("rating", "is", null),
  ) as Row[];
  const out = new Set<string>();
  for (const r of rows) {
    if (r.skill && r.lexeme_id) out.add(`${r.lexeme_id}:${r.skill}`);
    if (r.pair_id && String(r.exercise).startsWith("X")) out.add(r.pair_id);
  }
  return out;
}

export async function loadInput(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const now = new Date();
  const tz = typeof body.tz_offset_min === "number" ? Math.max(-840, Math.min(840, body.tz_offset_min)) : 0;
  const start = dayStart(now, tz);
  const [lexemes, states, pairs, settings, p, reviewed] = await Promise.all([
    loadLexemes(admin, userId),
    loadStates(admin, userId),
    loadPairs(admin, userId),
    admin.from("learning_settings").select("session_minutes, max_new, retention, last_prompt_on").eq("user_id", userId)
      .maybeSingle(),
    pace(admin, userId),
    reviewedSince(admin, userId, start),
  ]);
  const s = (settings.data ?? {}) as Row;
  const input: Omit<PlanInput, "mode" | "minutes"> = {
    now,
    dayStart: start,
    pace: p,
    maxNew: s.max_new ?? 8,
    retention: s.retention ?? MODEL.retention,
    lexemes,
    states,
    pairs,
    reviewedToday: reviewed,
    seed: Math.floor(Math.random() * 2 ** 31),
  };
  // День пользователя (граница — полночь по его часам) как `YYYY-MM-DD`: им
  // помечается, что окно «Повторим?» сегодня уже было.
  const today = new Date(start.getTime() + tz * 60_000).toISOString().slice(0, 10);
  return {
    input,
    lexemes,
    defaultMinutes: (s.session_minutes ?? 10) as number,
    today,
    lastPromptOn: (s.last_prompt_on ?? null) as string | null,
  };
}

