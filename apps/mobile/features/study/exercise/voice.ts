import type { Exercise } from "@yuny/shared";

/**
 * Что озвучить в задании (#86) и когда. Звук не должен подсказывать
 * проверяемое: до ответа — только там, где чтение и так видно или не
 * проверяется (R1: иероглиф → значение; W1: значение и пиньинь → иероглиф).
 * В P1/P2, R2, W2 — после ответа; в предложениях (C1/C2) — всё предложение
 * после ответа. Варианты ответа не озвучиваются: по звуку их можно было бы
 * сопоставить с пиньинем, не узнавая знак.
 */
export function voiceText(task: Exercise, done: boolean): string | null {
  const word = task.lexeme?.headword ?? null;
  switch (task.code) {
    case "R1":
    case "W1":
      return word;
    case "R2":
    case "P1":
    case "P2":
    case "W2":
      return done ? word : null;
    case "C1":
    case "C2":
      return done ? sentenceText(task) : null;
    default:
      // Знакомство и карточка пары озвучивают себя сами.
      return null;
  }
}

/** Предложение целиком: C2 — по ключу, C1 — токены с правильным словом в пропуске. */
function sentenceText(task: Exercise): string | null {
  if (task.key?.tokens?.length) return task.key.tokens.join("");
  const s = task.sentence;
  if (!s) return null;
  const answer = task.options?.find((o) => o.id === task.key?.option_id)?.text ?? "";
  const text = s.tokens.map((tok, i) => (i === s.blank_index ? answer : tok)).join("");
  return text || null;
}
