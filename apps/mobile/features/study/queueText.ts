import { t } from "@/shared/i18n";

export interface QueueInfo {
  learned: number;
  queued: number;
  eta_days: number | null;
  per_day: number | null;
}

/** «Изучено 12 из 40 · осталось 28» (#85); слов нет — строки нет. */
export function learnedText(q: Pick<QueueInfo, "learned" | "queued">): string | null {
  const total = q.learned + q.queued;
  if (total <= 0) return null;
  if (q.queued <= 0) return t("learn.queue.allLearned", { count: total });
  return t("learn.queue.learned", { learned: q.learned, total, left: q.queued });
}

/**
 * «примерно 4 дня при 8 новых в день» — по настройке «Новых слов в день»;
 * в настройках 0 — «учите раундами по папке». Впереди ничего — строки нет.
 */
export function etaText(q: QueueInfo): string | null {
  if (q.queued <= 0) return null;
  if (q.per_day === null || q.eta_days === null) return t("learn.queue.folderOnly");
  return t("learn.queue.eta", { count: q.eta_days, perDay: q.per_day });
}

/** Строка карты папки: изучено и срок. */
export function queueText(q: QueueInfo): string | null {
  const learned = learnedText(q);
  const eta = etaText(q);
  return learned && eta ? `${learned} — ${eta}` : learned;
}

/** Нижняя строка сводки по всем словам. */
export function totalsEtaText(q: { queued: number; eta_days: number | null }, perDay: number | null): string | null {
  if (q.queued <= 0) return t("learn.queue.stats.done");
  if (perDay === null || q.eta_days === null) return t("learn.queue.stats.folderOnly");
  return t("learn.queue.stats.eta", { count: q.eta_days, perDay });
}
