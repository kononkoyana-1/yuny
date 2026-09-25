import type { AnswerResult, Exercise, StudyAnswer } from "@yuny/shared";
import { pinyinCanonical } from "@/shared/lib/dictionaryText";

export type Verdict = "correct" | "partial" | "wrong";

/**
 * Итог сразу, по ключу в задании (решение 2026-09-24, `study.ts`): лоток не
 * ждёт сети. Окончательный исход, разбор и партнёра путаницы присылает
 * `review-submit` — они заменяют этот итог, как только придут.
 *
 * `null` — задание без проверки: знакомство, карточка пары, самооценка R2.
 */
export function localVerdict(e: Exercise, answer: StudyAnswer): Verdict | null {
  if ("choice" in answer || "self" in answer) return null;
  if ("blank" in answer) return "wrong";
  const key = e.key;
  if (!key) return null;
  if ("option_id" in answer) return key.option_id === undefined ? null : answer.option_id === key.option_id ? "correct" : "wrong";
  if ("text" in answer) {
    if (key.pinyin === undefined) return null;
    const [letters, tones] = pinyinCanonical(answer.text).split("|");
    const [keyLetters, keyTones] = pinyinCanonical(key.pinyin).split("|");
    if (letters !== keyLetters) return "wrong";
    return tones === keyTones ? "correct" : "partial";
  }
  if ("tile_ids" in answer) {
    if (!key.tokens || !e.tiles) return null;
    const text = new Map(e.tiles.map((t) => [t.id, t.text]));
    return answer.tile_ids.map((id) => text.get(id)).join("") === key.tokens.join("") ? "correct" : "wrong";
  }
  return null;
}

/** Исход для лотка: сервер важнее ключа. */
export function trayOutcome(local: Verdict | null, result: AnswerResult | null): Verdict | null {
  if (result && result.outcome !== "seen") return result.outcome;
  return local;
}

/** Верный ответ для «Правильно — …»: текст варианта, пиньинь или фраза. */
export function correctAnswerText(e: Exercise, result: AnswerResult | null): string | null {
  if (result?.correct.text) return result.correct.text;
  const key = e.key;
  if (!key) return null;
  if (key.option_id) return e.options?.find((o) => o.id === key.option_id)?.text ?? null;
  if (key.tokens) return key.tokens.join("");
  return e.lexeme?.reading ?? key.pinyin ?? null;
}
