import { useCallback, useEffect, useReducer, useRef } from "react";
import type { AnswerResult, Exercise, StudyAnswer } from "@yuny/shared";
import { studyRepository } from "@/shared/repositories";
import { localVerdict, type Verdict } from "@/shared/lib/studyVerdict";
import { uuid } from "@/shared/lib/uuid";
import { anchorOf, dropWord, insertNext, pairBlockLength, wordKey } from "./queue";
import { createOutbox } from "./outbox";

/** Одна на приложение: ответы в пути переживают выход с экрана (exercise.design.md §3.4). */
const outbox = createOutbox((input) => studyRepository.submit(input));

export interface Answered {
  task: Exercise;
  given: StudyAnswer;
  /** Итог по ключу — сразу. */
  local: Verdict | null;
  /** Итог сервера — когда дойдёт. */
  result: AnswerResult | null;
  /** Сервер окончательно отказал (не сеть — её очередь переждёт). */
  failed: boolean;
}

interface State {
  items: Exercise[];
  index: number;
  answered: Answered | null;
}

type Action =
  | { type: "answer"; given: StudyAnswer }
  | { type: "result"; taskId: string; result: AnswerResult }
  | { type: "failed"; taskId: string }
  | { type: "advance" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "answer": {
      const task = state.items[state.index];
      if (!task || state.answered) return state;
      return { ...state, answered: { task, given: action.given, local: localVerdict(task, action.given), result: null, failed: false } };
    }
    case "result": {
      let items = insertNext(state.items, anchorOf(state.items, action.taskId, state.index), action.result.next);
      const task = items.find((e) => e.task_id === action.taskId);
      const key = task ? wordKey(task) : null;
      if (action.result.known && key) items = dropWord(items, state.index, key);
      const answered =
        state.answered?.task.task_id === action.taskId ? { ...state.answered, result: action.result } : state.answered;
      return { ...state, items, answered };
    }
    case "failed":
      return state.answered?.task.task_id === action.taskId
        ? { ...state, answered: { ...state.answered, failed: true } }
        : state;
    case "advance":
      return { ...state, index: state.index + 1, answered: null };
  }
}

/** Задания без лотка: после ответа сразу следующее (exercise.design.md §4.1, §4.3, §4.9). */
export function advancesImmediately(e: Exercise, given: StudyAnswer): boolean {
  return e.code === "intro" || e.code === "pair_card" || "self" in given;
}

/**
 * Ход сессии (#67): текущее задание, ответ, итог и переход дальше. Итог
 * показывается сразу по ключу; ответ уходит в очередь отправки, результат
 * сервера уточняет итог и вставляет задания (повтор, блок пары, «Уже знаю»).
 */
export function useStudySession(initial: readonly Exercise[]) {
  const [state, dispatch] = useReducer(reducer, { items: [...initial], index: 0, answered: null });
  // Ставится эффектом при показе задания — не во время рендера.
  const shownAt = useRef(0);
  const pairBlock = useRef<{ cardTaskId: string; remaining: number } | null>(null);
  const current = state.items[state.index] ?? null;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [current?.task_id]);

  const answer = useCallback(
    (given: StudyAnswer) => {
      const task = state.items[state.index];
      if (!task || state.answered) return;
      const latency_ms = Date.now() - shownAt.current;
      dispatch({ type: "answer", given });

      outbox
        .submit({ task_id: task.task_id, request_id: uuid(), answer: given, latency_ms })
        .then((result) => dispatch({ type: "result", taskId: task.task_id, result }))
        .catch(() => dispatch({ type: "failed", taskId: task.task_id }));

      // Блок различения: карточка пары и её задания; после них — итог блока.
      const block = pairBlock.current;
      if (task.code === "pair_card") {
        pairBlock.current = { cardTaskId: task.task_id, remaining: pairBlockLength(state.items, state.index) };
      } else if (block) {
        block.remaining -= 1;
        if (block.remaining <= 0) {
          pairBlock.current = null;
          // Итог блока сервер считает по журналу — после того, как ответы дойдут.
          void outbox.drained().then(() => studyRepository.pairStart(block.cardTaskId)).catch(() => undefined);
        }
      }

      if (advancesImmediately(task, given)) dispatch({ type: "advance" });
    },
    [state.items, state.index, state.answered],
  );

  const next = useCallback(() => dispatch({ type: "advance" }), []);

  return {
    current,
    answered: state.answered,
    /** Сколько заданий пройдено и сколько всего (вставки меняют «всего»). */
    done: state.index,
    total: state.items.length,
    finished: current === null,
    answer,
    next,
  };
}
