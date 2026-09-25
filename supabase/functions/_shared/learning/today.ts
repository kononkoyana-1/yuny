/**
 * Карточка «Сегодня» (#66, today-session.design.md §1): что показать над
 * словарём. Чистые функции поверх `buildSession` — клиент ничего из этого
 * не считает (TZ.md §3, правило 1).
 */
import { retrievabilityAt } from "./memory.ts";
import type { PlanInput, PlanPair, SessionPlan } from "./session.ts";

export type TodayState = "no_words" | "ready" | "done" | "nothing_due";

/**
 * - `no_words` — ни одного слова в папках: карточки нет.
 * - `ready` — в плане есть задания.
 * - `done` — план пуст, но сегодня уже отвечали.
 * - `nothing_due` — план пуст, сегодня не отвечали: повторять рано.
 */
export function todayState(input: Pick<PlanInput, "lexemes" | "reviewedToday">, plan: SessionPlan): TodayState {
  if (input.lexemes.length === 0) return "no_words";
  if (plan.tasks.length > 0) return "ready";
  return input.reviewedToday.size > 0 ? "done" : "nothing_due";
}

/**
 * «Сейчас вы вспомните ~N из M слов»: M — слова, которые уже учили (есть
 * хоть один отвеченный навык), N — сумма вероятностей вспомнить чтение
 * (для слова без ответа на чтение — лучший из навыков).
 */
export function recallNow(input: Pick<PlanInput, "lexemes" | "states">, now: Date): { recalled: number; total: number } {
  let sum = 0;
  let total = 0;
  for (const l of input.lexemes) {
    const skills = Object.values(input.states[l.id] ?? {}).filter((s) => s?.lastReview);
    if (skills.length === 0) continue;
    total++;
    const read = input.states[l.id]?.read;
    sum += read?.lastReview ? retrievabilityAt(read, now) : Math.max(...skills.map((s) => retrievabilityAt(s!, now)));
  }
  return { recalled: Math.round(sum), total };
}

export interface PlanDigest {
  /** Новые слова по папкам, в порядке первого появления в плане. */
  newSources: { folderId: string; count: number }[];
  /** Пары путаницы, которые разберём в этом плане. */
  pairs: { a: string; b: string }[];
}

/** Состав плана для строк героя: откуда новые слова и какие пары. */
export function planDigest(
  input: Pick<PlanInput, "lexemes" | "pairs">,
  plan: SessionPlan,
): PlanDigest {
  const folderOf = new Map(input.lexemes.map((l) => [l.id, l.folderIds[0]]));
  const counts = new Map<string, number>();
  for (const t of plan.tasks) {
    if (t.kind !== "intro") continue;
    const folder = folderOf.get(t.lexemeId);
    if (folder) counts.set(folder, (counts.get(folder) ?? 0) + 1);
  }
  const pairById = new Map<string, PlanPair>(input.pairs.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const pairs: PlanDigest["pairs"] = [];
  for (const t of plan.tasks) {
    if ((t.kind !== "pair" && t.kind !== "pair_card") || seen.has(t.pairId)) continue;
    seen.add(t.pairId);
    const p = pairById.get(t.pairId);
    if (p) pairs.push({ a: p.a.headword, b: p.b.headword });
  }
  return { newSources: [...counts].map(([folderId, count]) => ({ folderId, count })), pairs };
}

/** «~8 минут» под числом заданий — по темпу пользователя, не меньше минуты. */
export function estimateMinutes(tasks: number, pace: number): number {
  return tasks === 0 ? 0 : Math.max(1, Math.round(tasks / pace));
}
