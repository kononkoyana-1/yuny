/**
 * Проверка ответов (TZ.md §9).
 *
 * Кто что считает:
 *   * карточки — только код, по словарю, ни одного запроса к Gemini;
 *   * чтение с утверждениями — процент считает код (верных из восьми), ИИ
 *     только объясняет ошибки, и только если они есть;
 *   * развёрнутые ответы и перевод — процент и разбор ставит ИИ.
 *
 * Чистые проверки и приведение ответа ИИ к форме — здесь, без базы и сети,
 * с тестами в `taskCheck_test.ts`. Вызов Gemini — в `aiReview`.
 */
import { aiJson, HandlerError, objectSchema } from "./shared.ts";
import { type CardKey, normalizeAnswer } from "./wordCards.ts";

export interface CheckError {
  fragment: string;
  what: string;
  correct: string;
}

export interface CheckResult {
  score_percent: number;
  comment: string | null;
  errors: CheckError[];
}

const HANZI = /[一-鿿]/;

// ----------------------------------------------------------------- ответы

/**
 * Ответ по всем пунктам задания — или код, почему он не принят. Ответ без
 * иероглифов в задании, где отвечают по-китайски, не принимается (TZ.md §8):
 * клиент ловит это раньше подсказкой, сервер — на случай, если не поймал.
 */
export function requireAnswers(
  raw: unknown,
  ids: string[],
  kind: "boolean" | "chinese" | "text",
): Record<string, string | boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new HandlerError("invalid_request", 400);
  }
  const answers = raw as Record<string, unknown>;
  const out: Record<string, string | boolean> = {};
  for (const id of ids) {
    const value = answers[id];
    if (kind === "boolean") {
      if (typeof value !== "boolean") throw new HandlerError("answer_incomplete", 422);
      out[id] = value;
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") {
      throw new HandlerError("answer_incomplete", 422);
    }
    if (kind === "chinese" && !HANZI.test(value)) throw new HandlerError("answer_not_chinese", 422);
    out[id] = value.trim().slice(0, 2000);
  }
  return out;
}

// --------------------------------------------------------- проверки кодом

/**
 * Карточки (TZ.md §9): засчитывается любой синоним выбранного значения, после
 * нормализации — регистр, края, ё = е. В обратную сторону ключ — написание
 * иероглифов, и сравнение то же. Комментария нет, есть список ошибок с
 * правильным ответом.
 */
export function checkCards(answers: Record<string, string>, keys: CardKey[]): CheckResult {
  const errors: CheckError[] = [];
  let correct = 0;
  for (const key of keys) {
    const given = normalizeAnswer(answers[key.id] ?? "");
    if (key.accepted.includes(given)) {
      correct += 1;
    } else {
      errors.push({
        fragment: answers[key.id] ?? "",
        what: key.direction === "zh_ru" ? "Неверный перевод" : "Неверное написание",
        correct: key.display,
      });
    }
  }
  return {
    score_percent: keys.length === 0 ? 0 : Math.round((correct / keys.length) * 100),
    comment: null,
    errors,
  };
}

/** Чтение: процент — доля верно оценённых утверждений. Что не так — список. */
export function checkStatements(
  answers: Record<string, boolean>,
  keys: { id: string; is_true: boolean }[],
  statements: { id: string; text: string }[],
): { score_percent: number; wrong: { id: string; text: string; is_true: boolean }[] } {
  const wrong = keys
    .filter((key) => answers[key.id] !== key.is_true)
    .map((key) => ({ ...key, text: statements.find((s) => s.id === key.id)?.text ?? "" }));
  return {
    score_percent: Math.round(((keys.length - wrong.length) / keys.length) * 100),
    wrong,
  };
}

// --------------------------------------------------------------- проверка ИИ

const REVIEW_SCHEMA = objectSchema(
  {
    score_percent: { type: "integer" },
    comment: { type: "string" },
    errors: {
      type: "array",
      items: objectSchema(
        { fragment: { type: "string" }, what: { type: "string" }, correct: { type: "string" } },
        ["fragment", "what", "correct"],
      ),
    },
  },
  ["score_percent", "comment", "errors"],
);

const REVIEW_SYSTEM = `Ты проверяешь ответ ученика, который учит китайский язык, а родной у него — русский.

Правила разбора:
- По существу. Что не так, почему не так, как правильно. Без похвалы ради похвалы: если ошибок нет — так и скажи одной фразой, без восторгов.
- Грамматические ошибки называй своими именами: порядок слов, неверная конструкция, лишнее или пропущенное 了, неверное счётное слово — как есть.
- comment — связный разбор на русском, 2–6 предложений. Примеры и исправления — на китайском.
- errors — конкретные ошибки: fragment — что написал ученик (как есть), what — в чём ошибка (по-русски, коротко), correct — как правильно (по-китайски).
- Не придирайся к тому, что верно, но сказано иначе, чем в эталоне: эталон — один из верных вариантов, а не единственный.`;

/** Ответ ИИ к форме: процент в границах и целый, пустые ошибки выброшены. */
export function shapeReview(raw: CheckResult): CheckResult {
  const score = Math.round(Number(raw.score_percent));
  return {
    score_percent: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0,
    comment: raw.comment?.trim() || null,
    errors: (raw.errors ?? [])
      .map((e) => ({ fragment: e.fragment?.trim() ?? "", what: e.what?.trim() ?? "", correct: e.correct?.trim() ?? "" }))
      .filter((e) => e.what !== ""),
  };
}

export async function aiReview(task: string, prompt: string): Promise<CheckResult> {
  const raw = await aiJson<CheckResult>({
    name: `review_${task}`,
    description: "Проверь ответ ученика и разбери ошибки по существу",
    schema: REVIEW_SCHEMA,
    system: REVIEW_SYSTEM,
    prompt,
    maxTokens: 4000,
  });
  return shapeReview(raw);
}
