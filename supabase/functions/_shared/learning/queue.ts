/**
 * Сколько слов в папках изучено и сколько впереди (#85). Механика приёма не
 * меняется (vocabulary-engine.md, daily-and-folder-study.md §6) — здесь только
 * счёт для экранов.
 *
 * Срок — по настройке «Новых слов в день» (`max_new`), а не по факту: раунды
 * «Ещё 7» разгоняют фактический темп, и «примерно 1 день при 47 в день»
 * ничего человеку не говорит. Настройка — то, чем он управляет.
 */
import { newQueue, type PlanInput } from "./session.ts";

type QueueInput = Pick<PlanInput, "lexemes" | "states" | "maxNew">;

export interface QueueView {
  /** Слов в папке (или во всех папках — слово в двух папках одно). */
  total: number;
  /** Изучено: начатые и отмеченные «Уже знаю». */
  learned: number;
  /** Впереди: ещё ни разу не учили. */
  queued: number;
  /** Примерно дней до конца при `max_new` в день; `null` — `max_new = 0`, новые только из папки. */
  etaDays: number | null;
}

/** Папка или все папки (`folderId = null`). */
export function queueView(input: QueueInput, folderId: string | null): QueueView {
  const total = folderId === null
    ? input.lexemes.length
    : input.lexemes.filter((l) => l.folderIds.includes(folderId)).length;
  const queued = newQueue(input, folderId).length;
  return {
    total,
    learned: total - queued,
    queued,
    etaDays: input.maxNew > 0 ? Math.ceil(queued / input.maxNew) : null,
  };
}
