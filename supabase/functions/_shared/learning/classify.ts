/**
 * Классификатор ответа (docs/learning/vocabulary-engine.md, раздел 5): что
 * именно не так, если не так, и с каким словом спутали. Оценку ставит он, а
 * не пользователь. Детерминированный, без ИИ.
 */
import { MODEL } from "./config.ts";
import type { Grade } from "./memory.ts";
import { normalizePinyin, sameSyllables } from "./pinyin.ts";

export type Outcome =
  | "ok"
  | "blank"
  | "confusion"
  | "tone"
  | "syllable"
  | "form_similar"
  | "homophone"
  | "order"
  | "wrong"
  | "seen";

export interface WordKey {
  headword: string;
  reading: string | null;
}

/**
 * Вариант ответа на экране. `headword` — чьё это слово; `similarity` —
 * почему дистрактор попал в варианты (его знает генератор вариантов, #62).
 */
export interface OptionMeta extends WordKey {
  value: string;
  similarity?: "form" | "sound" | "meaning";
}

export type Answer =
  /** R2: открыл ответ и сказал, вспомнил ли. */
  | { kind: "self"; remembered: boolean }
  /** P2, C3: набранный пиньинь. */
  | { kind: "pinyin"; text: string }
  /** R1, R3, P1, W1, W2, C1, X*: выбранный вариант (`value`). */
  | { kind: "choice"; value: string | null }
  /** C2: слова в порядке, в котором их собрали. */
  | { kind: "order"; tokens: string[] }
  /** Знакомство со словом — не оценивается. */
  | { kind: "seen" };

export interface ClassifyInput {
  target: WordKey;
  answer: Answer;
  /** Для выбора: все варианты на экране, правильный — тоже. */
  options?: OptionMeta[];
  /** Для C2: правильный порядок и другие допустимые. */
  expectedOrders?: string[][];
  /** Слова словаря пользователя — чтобы узнать партнёра путаницы. */
  known?: WordKey[];
  /** Правильно, но со второй попытки. */
  secondTry?: boolean;
  latencyMs?: number | null;
  /** Медиана времени ответа пользователя на этот формат; нет данных — `null`. */
  medianMs?: number | null;
}

export interface Classified {
  outcome: Outcome;
  /** С каким словом спутали: заголовок и чтение. */
  partner: WordKey | null;
  /** Для модели памяти; `null` у знакомства. */
  grade: Grade | null;
}

const blankText = (s: string | null | undefined) => !s || !s.trim();

function speedGrade(input: ClassifyInput): Grade {
  if (input.secondTry) return { kind: "error", error: "second_try" };
  const { latencyMs, medianMs } = input;
  if (latencyMs == null || !medianMs) return { kind: "success", rating: 3 };
  if (latencyMs < MODEL.fastShare * medianMs) return { kind: "success", rating: 4 };
  if (latencyMs > MODEL.slowShare * medianMs) return { kind: "success", rating: 2 };
  return { kind: "success", rating: 3 };
}

const sameWord = (a: WordKey, b: WordKey) => a.headword === b.headword && (a.reading ?? "") === (b.reading ?? "");

function knownOther(input: ClassifyInput, pred: (w: WordKey) => boolean): WordKey | null {
  return (input.known ?? []).find((w) => !sameWord(w, input.target) && pred(w)) ?? null;
}

const err = (outcome: Exclude<Outcome, "ok" | "seen">, partner: WordKey | null = null): Classified => ({
  outcome,
  partner,
  grade: { kind: "error", error: outcome },
});

export function classify(input: ClassifyInput): Classified {
  const { answer, target } = input;

  switch (answer.kind) {
    case "seen":
      return { outcome: "seen", partner: null, grade: null };

    case "self":
      return answer.remembered ? { outcome: "ok", partner: null, grade: speedGrade(input) } : err("blank");

    case "pinyin": {
      if (blankText(answer.text)) return err("blank");
      const given = normalizePinyin(answer.text);
      const expected = target.reading ? normalizePinyin(target.reading) : null;
      if (given && expected && given === expected) {
        return { outcome: "ok", partner: null, grade: speedGrade(input) };
      }
      if (!given || !expected) return err("syllable");
      // Набрал чтение другого слова из своего словаря с тем же знаком или
      // слогами — это путаница с ним (mai4 при 卖 mài), а не просто тон.
      const partner = knownOther(input, (w) => !!w.reading && normalizePinyin(w.reading) === given);
      if (partner) return err("confusion", partner);
      return sameSyllables(answer.text, target.reading!) ? err("tone") : err("syllable");
    }

    case "choice": {
      if (answer.value === null || blankText(answer.value)) return err("blank");
      const chosen = input.options?.find((o) => o.value === answer.value) ?? null;
      if (chosen ? sameWord(chosen, target) : false) {
        return { outcome: "ok", partner: null, grade: speedGrade(input) };
      }
      if (!chosen) return err("wrong");
      const partner: WordKey = { headword: chosen.headword, reading: chosen.reading };
      // Слово из своего словаря — самое точное: это пара, которую нужно разводить.
      if (knownOther(input, (w) => sameWord(w, partner))) return err("confusion", partner);
      if (chosen.similarity === "form") return err("form_similar", partner);
      if (chosen.similarity === "sound" ||
        (chosen.reading && target.reading && sameSyllables(chosen.reading, target.reading))) {
        return err("homophone", partner);
      }
      return err("wrong", partner);
    }

    case "order": {
      if (!answer.tokens.length) return err("blank");
      const orders = input.expectedOrders ?? [];
      if (orders.some((o) => o.join("\u0000") === answer.tokens.join("\u0000"))) {
        return { outcome: "ok", partner: null, grade: speedGrade(input) };
      }
      const bag = (xs: string[]) => [...xs].sort().join("\u0000");
      if (orders.some((o) => bag(o) === bag(answer.tokens))) return err("order");
      return err("wrong");
    }
  }
}
