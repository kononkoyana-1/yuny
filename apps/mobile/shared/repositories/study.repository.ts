import type { SessionPreview } from "@yuny/shared";

/**
 * Учёба слов (`session-build`, #63/#66). Что спросить, сколько и когда —
 * решает сервер; клиент только выводит. Ответ прогоняется через схемы
 * `packages/shared/schemas/study.ts`.
 */
export interface StudyRepository {
  /** Карточка «Сегодня» и три плана окна «Повторим?» — без записи. */
  preview(): Promise<SessionPreview>;
}
