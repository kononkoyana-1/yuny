import { t } from "@/shared/i18n";

export interface QueueInfo {
  queued: number;
  eta_days: number | null;
  per_day: number | null;
}

/**
 * «В очереди 180 слов · примерно 23 дня при 8 в день» (#85); потолок новых 0 —
 * «… · новые приходят только из папки». Очередь пуста — строки нет.
 */
export function queueText(q: QueueInfo): string | null {
  if (q.queued <= 0) return null;
  const words = t("learn.queue.words", { count: q.queued });
  const tail =
    q.per_day === null || q.eta_days === null
      ? t("learn.queue.folderOnly")
      : t("learn.queue.eta", { count: q.eta_days, perDay: q.per_day });
  return `${words} · ${tail}`;
}
