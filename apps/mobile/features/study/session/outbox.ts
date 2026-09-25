import type { AnswerResult } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import type { SubmitAnswerInput } from "@/shared/repositories";

/** Ошибки, после которых тот же ответ стоит отправить ещё раз. */
const TRANSIENT = new Set(["network_error", "busy_retry", "empty_response"]);

/** Паузы между попытками; дальше — последняя. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 30000];

export function isTransient(error: unknown): boolean {
  return error instanceof BackendError && TRANSIENT.has(error.code);
}

export interface Outbox {
  /** Отправляет по порядку; при обрыве сети повторяет, пока не дойдёт. Отказ — только окончательный. */
  submit(input: SubmitAnswerInput): Promise<AnswerResult>;
  /** Сколько ответов ещё не дошло. */
  pending(): number;
  /** Когда дойдут (или окончательно не дойдут) все ответы, отправленные до этого вызова. */
  drained(): Promise<void>;
}

/**
 * Очередь отправки ответов (#67, «очередь при потере сети»). Живёт вне
 * экрана: выход из сессии не отменяет ответы в пути (exercise.design.md
 * §3.4). Итог человек уже видел по ключу, так что ожидание сети ему не мешает.
 * Повтор идёт с тем же `request_id` — сервер не засчитает ответ дважды.
 */
export function createOutbox(
  send: (input: SubmitAnswerInput) => Promise<AnswerResult>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Outbox {
  let tail: Promise<unknown> = Promise.resolve();
  let waiting = 0;

  async function deliver(input: SubmitAnswerInput): Promise<AnswerResult> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await send(input);
      } catch (error) {
        if (!isTransient(error)) throw error;
        await sleep(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]!);
      }
    }
  }

  return {
    submit(input) {
      waiting++;
      const run = tail.then(() => deliver(input)).finally(() => {
        waiting--;
      });
      tail = run.catch(() => undefined);
      return run;
    },
    pending: () => waiting,
    drained: () => tail.then(() => undefined),
  };
}
