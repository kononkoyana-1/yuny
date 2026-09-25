import type { Exercise, StudyAnswer } from "@yuny/shared";
import type { Answered } from "../session/useStudySession";

/** Общие пропы рендерера задания (exercise.design.md §4). */
export interface ExerciseProps {
  task: Exercise;
  answered: Answered | null;
  onAnswer: (answer: StudyAnswer) => void;
  /** ≥ `breakpoints.wide`: подсказки клавиш на вариантах. */
  wide: boolean;
  /** «Задание 7 из 10» — начало подписи сцены для диктора. */
  progressLabel: string;
}
