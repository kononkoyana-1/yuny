import type { WordsExtractRequest, WordsExtractResponse, WordsExtractResult } from "@yuny/shared";

/**
 * Слова из загруженного файла (`words-extract`). Файлы в Storage кладёт
 * `ModuleRepository.uploadFile` — путь и папка загрузки у обоих потоков общие.
 */
export interface WordsRepository {
  /**
   * Ставит разбор файла. Повтор с тем же `material_id` отдаёт ту же задачу,
   * пока она идёт или готова; после упавшей — запускает новую по тем же
   * файлам, это и есть «Попробовать ещё раз».
   */
  extract(req: WordsExtractRequest): Promise<WordsExtractResponse>;
  /** Ждёт задачу; отклоняется `BackendError` с кодом задачи. */
  awaitWords(jobId: string, timeoutMs?: number): Promise<WordsExtractResult>;
  /** «Отмена»: идущий разбор больше не ждём, загруженные файлы удаляются. */
  cancel(materialId: string): Promise<void>;
}
