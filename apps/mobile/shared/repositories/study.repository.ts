import type {
  AnswerResult,
  FolderMap,
  FolderMode,
  FolderProgress,
  FolderStudyPlan,
  SessionMinutes,
  SessionPreview,
  StudyAnswer,
  StudySession,
  WordProgress,
} from "@yuny/shared";

export type StartStudyInput =
  /** `extra_new` — «Ещё 7 новых слов» после «Сегодня»: раунд знакомства в папке, где есть новые. */
  | { mode: "today"; minutes?: SessionMinutes; extra_new?: boolean }
  | { mode: "folder"; folder_id: string; folder_mode?: FolderMode };

export interface SubmitAnswerInput {
  task_id: string;
  /** Один на ответ: повтор после обрыва сети не засчитывается дважды. */
  request_id: string;
  answer: StudyAnswer;
  latency_ms: number;
}

/**
 * Учёба слов (`session-build`, `review-submit`; #63/#66/#67). Что спросить,
 * сколько и когда — решает сервер; клиент только выводит. Ответы
 * прогоняются через схемы `packages/shared/schemas/study.ts`.
 */
export interface StudyRepository {
  /** Карточка «Сегодня» и три плана окна «Повторим?» — без записи. */
  preview(): Promise<SessionPreview>;
  /** Стадии и «пора освежить» по каждой папке — «Мой словарь» (#70). */
  folderProgress(): Promise<FolderProgress[]>;
  /** Карта папки: стадия, «пора освежить», пара у каждого слова (#70). */
  folderMap(folderId: string): Promise<FolderMap>;
  /** Карточка слова: стадия, навыки, повторение, пары (#70). */
  wordProgress(word: { headword: string; reading: string | null }): Promise<WordProgress>;
  /** Что предложить на экране папки: главный режим, остальные, нагрузка (#69). */
  folderPlan(folderId: string): Promise<FolderStudyPlan>;
  /** Задания сессии «Сегодня» или папки. */
  start(input: StartStudyInput): Promise<StudySession>;
  /** Ответ → память; итог, разбор и вставленные задания. */
  submit(input: SubmitAnswerInput): Promise<AnswerResult>;
  /** Итог блока различения пары — по карточке пары, после её заданий. */
  pairStart(taskId: string): Promise<void>;
}
