import type { Exercise, StudyAnswer } from "@yuny/shared";
import type { Answered } from "./useStudySession";

/**
 * Очередь заданий сессии (#67): что показать следующим. Чистые функции —
 * оболочка только вызывает их.
 *
 * Вставленные сервером задания (`AnswerResult.next`) бывают двух видов:
 * повтор после ошибки (`is_retry`) возвращается «через 2–3 задания»
 * (vocabulary-engine.md §5), остальное — блок пары и проверка «Уже знаю» —
 * идёт сразу за текущим.
 */

/** Сколько других заданий пройдёт до повтора после ошибки. */
export const RETRY_GAP = 2;

/** Сколько заданий на различение идёт за карточкой пары (как `pairBlockSides` на сервере). */
export const PAIR_BLOCK_SIZE = 4;

export function insertNext(items: readonly Exercise[], anchor: number, next: readonly Exercise[]): Exercise[] {
  if (next.length === 0) return [...items];
  const immediate = next.filter((e) => !e.is_retry);
  const retries = next.filter((e) => e.is_retry);
  const out = [...items];
  out.splice(anchor + 1, 0, ...immediate);
  const at = Math.min(anchor + 1 + immediate.length + RETRY_GAP, out.length);
  out.splice(at, 0, ...retries);
  return out;
}

/** Одно слово — одна пара «знак + чтение». */
export function wordKey(e: Exercise): string | null {
  return e.lexeme ? `${e.lexeme.headword}|${e.lexeme.reading ?? ""}` : null;
}

/** «Уже знаю» подтверждено: остальные задания этого слова после `index` не нужны. */
export function dropWord(items: readonly Exercise[], index: number, key: string): Exercise[] {
  return items.filter((e, i) => i <= index || e.code === "pair_card" || wordKey(e) !== key);
}

/**
 * Проверка «Уже знаю» не пройдена: оставшиеся её задания по этому слову не
 * нужны — дальше «Тогда запомним» и снова знакомство (folder-study.design.md §4).
 */
export function dropChecks(items: readonly Exercise[], index: number, key: string): Exercise[] {
  return items.filter((e, i) => i <= index || !e.is_check || wordKey(e) !== key);
}

/** Задание, к которому прицепить вставку: само отвеченное или текущее, если человек уже ушёл дальше. */
export function anchorOf(items: readonly Exercise[], taskId: string, index: number): number {
  const at = items.findIndex((e) => e.task_id === taskId);
  return Math.max(at, index);
}

/** Сколько заданий идёт за карточкой пары на позиции `index` (не больше блока и конца очереди). */
export function pairBlockLength(items: readonly Exercise[], index: number): number {
  return Math.min(PAIR_BLOCK_SIZE, items.length - index - 1);
}

/**
 * Задания без лотка: после ответа сразу следующее (exercise.design.md §4.1,
 * §4.3, §4.9). Кроме «Не вспомнил» в проверке «Уже знаю»: там лоток
 * «Тогда запомним» (folder-study.design.md §4).
 */
export function advancesImmediately(e: Exercise, given: StudyAnswer): boolean {
  if ("self" in given) return !(e.is_check && given.self === "forgot");
  return e.code === "intro" || e.code === "pair_card";
}

/** Проверка «Уже знаю» не пройдена: не вспомнил, ошибся или почти (сервер важнее ключа). */
export function checkFailed(a: Pick<Answered, "task" | "given" | "local" | "result">): boolean {
  if (!a.task.is_check) return false;
  if (a.result) return a.result.outcome !== "correct";
  if ("self" in a.given) return a.given.self === "forgot";
  return a.local !== null && a.local !== "correct";
}
