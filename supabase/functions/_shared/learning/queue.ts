/**
 * Очередь новых слов (#85): сколько ждёт приёма и когда закончится. Механика
 * приёма не меняется (vocabulary-engine.md, daily-and-folder-study.md §6) —
 * здесь только счёт для экранов.
 */
import { DAY_MS } from "./config.ts";
import { newQueue, type PlanInput } from "./session.ts";

/** За сколько последних дней считаем фактический приём. */
const RATE_WINDOW_DAYS = 7;

type QueueInput = Pick<PlanInput, "lexemes" | "states" | "dayStart" | "maxNew">;

/**
 * Новых слов в день на деле: начатые за 7 дней (включая «Уже знаю» и раунды
 * папки), поделённые на дни с первого начатого слова, но не больше 7. Истории
 * нет — потолок из настроек; потолок 0 — новые приходят только из папки, срока нет.
 */
export function intakeRate(input: QueueInput): number | null {
  if (input.maxNew === 0) return null;
  const windowStart = input.dayStart.getTime() - (RATE_WINDOW_DAYS - 1) * DAY_MS;
  let started = 0;
  let earliest = Infinity;
  for (const l of input.lexemes) {
    const read = input.states[l.id]?.read;
    if (!read) continue;
    const at = read.unlockedAt.getTime();
    earliest = Math.min(earliest, at);
    if (at >= windowStart) started++;
  }
  if (started === 0) return input.maxNew;
  const days = Math.min(RATE_WINDOW_DAYS, Math.max(1, Math.ceil((input.dayStart.getTime() + DAY_MS - earliest) / DAY_MS)));
  return started / days;
}

export interface QueueView {
  /** Слов ждёт приёма: без состояния навыков; «Уже знаю» сюда не входит. */
  queued: number;
  /** Примерно дней до конца очереди; `null` — потолок новых 0. */
  etaDays: number | null;
}

/** Очередь папки или всех папок (`folderId = null`; слово в двух папках — одно). */
export function queueView(input: QueueInput, folderId: string | null, rate = intakeRate(input)): QueueView {
  const queued = newQueue(input, folderId).length;
  return { queued, etaDays: rate === null ? null : Math.ceil(queued / rate) };
}

/** «при 8 в день» — округлённый темп приёма, не меньше 1. */
export function perDay(rate: number | null): number | null {
  return rate === null ? null : Math.max(1, Math.round(rate));
}
