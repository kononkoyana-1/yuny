import type { Exercise } from "@yuny/shared";

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

/** Сколько заданий на различение идёт за карточкой пары. */
export const PAIR_BLOCK_SIZE = 3;

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

/** Задание, к которому прицепить вставку: само отвеченное или текущее, если человек уже ушёл дальше. */
export function anchorOf(items: readonly Exercise[], taskId: string, index: number): number {
  const at = items.findIndex((e) => e.task_id === taskId);
  return Math.max(at, index);
}

/** Сколько заданий идёт за карточкой пары на позиции `index` (не больше блока и конца очереди). */
export function pairBlockLength(items: readonly Exercise[], index: number): number {
  return Math.min(PAIR_BLOCK_SIZE, items.length - index - 1);
}
