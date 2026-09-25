import type { Exercise } from "@yuny/shared";
import { trayOutcome } from "@/shared/lib/studyVerdict";
import type { Answered } from "./useStudySession";

/**
 * Итоги порции и дня (today-session.design.md §3.9, §3.10). Всё — вывод того,
 * что прислал сервер (`outcome`, `stage_before`/`stage`, `pair_resolved`);
 * пока ответ сервера не дошёл, исход берётся из ключа задания.
 */

export type Stage = "new" | "meeting" | "recognize" | "recall" | "use" | "stable";
const STAGE_RANK: Record<Stage, number> = { new: 0, meeting: 1, recognize: 2, recall: 3, use: 4, stable: 5 };

export interface StageUp {
  headword: string;
  reading: string | null;
  from: Stage;
  to: Stage;
}

/** Ответ в истории сессии: номер порции, в которой он дан. */
export interface Logged extends Answered {
  portion: number;
}

/**
 * После каких заданий пауза: последнее задание каждой порции, кроме последней.
 * Порции задаёт сервер (`Exercise.portion`); вставленные потом задания (повтор,
 * блок пары) идут внутри текущей порции и паузы не добавляют.
 */
export function pauseAfter(exercises: readonly Exercise[]): Map<string, number> {
  const lastOf = new Map<number, string>();
  for (const e of exercises) lastOf.set(e.portion, e.task_id);
  const portions = [...lastOf.keys()].sort((a, b) => a - b);
  const out = new Map<string, number>();
  portions.slice(0, -1).forEach((p, i) => out.set(lastOf.get(p)!, i + 1));
  return out;
}

/** Сколько порций у сессии. */
export function portionCount(exercises: readonly Exercise[]): number {
  return new Set(exercises.map((e) => e.portion)).size;
}

/** Вспомнил — верно или почти (тон); знакомство и карточка пары не считаются. */
function recalled(a: Answered): boolean | null {
  if ("self" in a.given) return a.result ? a.result.outcome === "correct" : a.given.self === "recalled";
  const outcome = trayOutcome(a.local, a.result);
  if (!outcome) return null;
  return outcome !== "wrong";
}

/** Переходы стадий: по слову — первая стадия «до» и последняя «после», только рост. */
export function stageUps(log: readonly Answered[]): StageUp[] {
  const byWord = new Map<string, StageUp>();
  for (const a of log) {
    const r = a.result;
    const lexeme = a.task.lexeme;
    if (!r?.stage || !r.stage_before || !lexeme) continue;
    const key = `${lexeme.headword}|${lexeme.reading ?? ""}`;
    const prev = byWord.get(key);
    byWord.set(key, {
      headword: lexeme.headword,
      reading: lexeme.reading,
      from: prev?.from ?? r.stage_before,
      to: r.stage,
    });
  }
  return [...byWord.values()].filter((u) => STAGE_RANK[u.to] > STAGE_RANK[u.from]);
}

export interface PortionSummary {
  recalled: number;
  answered: number;
  stageUps: StageUp[];
}

export function portionSummary(log: readonly Logged[], portion: number): PortionSummary {
  const inPortion = log.filter((a) => a.portion === portion);
  const counted = inPortion.map(recalled).filter((r): r is boolean => r !== null);
  return {
    recalled: counted.filter(Boolean).length,
    answered: counted.length,
    stageUps: stageUps(inPortion).slice(0, 3),
  };
}

export interface DaySummary {
  advanced: StageUp[];
  pairsResolved: { a: string; b: string }[];
}

export function daySummary(log: readonly Answered[]): DaySummary {
  const seen = new Set<string>();
  const pairsResolved: { a: string; b: string }[] = [];
  for (const a of log) {
    const p = a.result?.pair_resolved;
    if (!p || seen.has(`${p.a}|${p.b}`)) continue;
    seen.add(`${p.a}|${p.b}`);
    pairsResolved.push(p);
  }
  return { advanced: stageUps(log), pairsResolved };
}
