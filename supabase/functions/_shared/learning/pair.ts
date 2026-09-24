/**
 * Пара путаницы (docs/learning/vocabulary-engine.md, раздел 5): порог
 * интервенции, память пары, ограничение интервалов слов, снятие пары.
 * Строка — `confusion_pairs`.
 */
import { DAY_MS, MODEL } from "./config.ts";
import { type Grade, type MemoryState, review } from "./memory.ts";
import type { WordKey } from "./classify.ts";

export type PairStatus = "pending" | "active" | "watch" | "resolved";

export interface PairState {
  status: PairStatus;
  memory: MemoryState | null;
  resolveStreak: number;
}

/**
 * Стороны пары в каноническом порядке — как требует `confusion_pairs_canonical`
 * (`collate "C"`): по кодовым точкам заголовка, затем чтения.
 */
export function canonicalPair(x: WordKey, y: WordKey): [WordKey, WordKey] {
  const key = (w: WordKey) => [w.headword, w.reading ?? ""] as const;
  const cmp = (a: string, b: string) => {
    const ca = [...a].map((c) => c.codePointAt(0)!);
    const cb = [...b].map((c) => c.codePointAt(0)!);
    for (let i = 0; i < Math.min(ca.length, cb.length); i++) if (ca[i] !== cb[i]) return ca[i] - cb[i];
    return ca.length - cb.length;
  };
  const [xh, xr] = key(x);
  const [yh, yr] = key(y);
  const c = cmp(xh, yh) || cmp(xr, yr);
  return c <= 0 ? [x, y] : [y, x];
}

/** Пора ли интервенция: путаниц за окно (30 дней) не меньше порога. */
export function needsIntervention(confusedAt: Date[], now: Date): boolean {
  const from = now.getTime() - MODEL.pair.windowDays * DAY_MS;
  return confusedAt.filter((d) => d.getTime() >= from && d.getTime() <= now.getTime()).length >=
    MODEL.pair.threshold;
}

/**
 * Итог блока различения после контрастной карточки: пара уходит в
 * расписание. Успех сразу после объяснения держится на рабочей памяти,
 * поэтому стабильность — со скидкой × 0.4.
 */
export function startPair(correct: number, total: number, now: Date): PairState {
  const grade: Grade = total > 0 && correct / total >= 0.75
    ? { kind: "success", rating: 3 }
    : { kind: "error", error: "confusion" };
  return {
    status: "active",
    memory: review(null, grade, {
      now,
      weight: MODEL.pair.interventionDiscount,
      initialDifficulty: MODEL.pair.initialDifficulty,
    }),
    resolveStreak: 0,
  };
}

/**
 * Проверка пары позже: задания X* или партнёр среди вариантов в обычном
 * задании. Различил — стабильность растёт, и если с прошлой проверки прошло
 * не меньше очередного интервала (1, 3, 7 дней), счётчик снятия растёт; три
 * подряд — пара решена. Спутал — счётчик в ноль, пара снова держит интервалы.
 */
export function reviewPair(pair: PairState, distinguished: boolean, weight: number, now: Date): PairState {
  if (!pair.memory) throw new Error("пара не в расписании");
  const gapDays = pair.memory.lastReview ? (now.getTime() - pair.memory.lastReview.getTime()) / DAY_MS : 0;
  const grade: Grade = distinguished ? { kind: "success", rating: 3 } : { kind: "error", error: "confusion" };
  const memory = review(pair.memory, grade, { now, weight, initialDifficulty: pair.memory.difficulty });

  if (!distinguished) return { status: "active", memory, resolveStreak: 0 };

  const need = MODEL.pair.resolveGaps[pair.resolveStreak] ?? Infinity;
  const streak = gapDays >= need ? pair.resolveStreak + 1 : pair.resolveStreak;
  const status: PairStatus = streak >= MODEL.pair.resolveGaps.length
    ? "resolved"
    : memory.stability >= MODEL.pair.capUntilStability
    ? "watch"
    : "active";
  return { status, memory, resolveStreak: streak };
}

/**
 * Срок навыка с учётом пары: пока пара `active` и её стабильность ниже 7
 * дней, интервал слова не растёт дальше срока пары.
 */
export function cappedDue(skillDue: Date, pair: PairState | null): Date {
  if (!pair || pair.status !== "active" || !pair.memory) return skillDue;
  if (pair.memory.stability >= MODEL.pair.capUntilStability) return skillDue;
  return pair.memory.due < skillDue ? pair.memory.due : skillDue;
}
