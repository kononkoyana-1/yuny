/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals, assertThrows } from "jsr:@std/assert@1";

import { checkCards, checkStatements, requireAnswers, shapeReview } from "./taskCheck.ts";
import { HandlerError } from "./shared.ts";
import type { CardKey } from "./wordCards.ts";

const KEYS: CardKey[] = [
  { id: "a", direction: "zh_ru", accepted: ["дешевый", "недорогой"], display: "дешёвый, недорогой" },
  { id: "b", direction: "zh_ru", accepted: ["дорогой", "дорогостоящий"], display: "дорогой, дорогостоящий" },
  { id: "c", direction: "ru_zh", accepted: ["商店"], display: "商店" },
  { id: "d", direction: "ru_zh", accepted: ["苹果"], display: "苹果" },
];

Deno.test("карточки: регистр, края и ё не важны", () => {
  const r = checkCards({ a: "  Дешёвый ", b: "ДОРОГОЙ", c: " 商店", d: "苹果" }, KEYS);
  assertEquals(r.score_percent, 100);
  assertEquals(r.errors, []);
});

Deno.test("карточки: любой синоним значения засчитывается", () => {
  assertEquals(checkCards({ a: "недорогой", b: "дорогостоящий", c: "商店", d: "苹果" }, KEYS).score_percent, 100);
});

Deno.test("карточки: синоним вне статьи не засчитывается (TZ.md §9)", () => {
  const r = checkCards({ a: "бюджетный", b: "дорогой", c: "商店", d: "苹果" }, KEYS);
  assertEquals(r.score_percent, 75);
  assertEquals(r.errors, [{ fragment: "бюджетный", what: "Неверный перевод", correct: "дешёвый, недорогой" }]);
});

Deno.test("карточки: в обратную сторону сверяется написание", () => {
  const r = checkCards({ a: "дешевый", b: "дорогой", c: "商舖", d: "" }, KEYS);
  assertEquals(r.score_percent, 50);
  assertEquals(r.errors.map((e) => [e.what, e.correct]), [["Неверное написание", "商店"], ["Неверное написание", "苹果"]]);
});

Deno.test("карточки: комментария нет — только список ошибок", () => {
  assertEquals(checkCards({}, KEYS).comment, null);
});

Deno.test("чтение: процент — доля верных из восьми, ошибки с правильным ответом", () => {
  const keys = Array.from({ length: 8 }, (_, i) => ({ id: `s${i + 1}`, is_true: i % 2 === 0 }));
  const statements = keys.map((k) => ({ id: k.id, text: `句子${k.id}` }));
  const answers = Object.fromEntries(keys.map((k) => [k.id, k.is_true]));
  answers.s1 = false;
  answers.s2 = true;
  const r = checkStatements(answers, keys, statements);
  assertEquals(r.score_percent, 75);
  assertEquals(r.wrong.map((w) => [w.id, w.is_true]), [["s1", true], ["s2", false]]);
});

Deno.test("ответ без иероглифов не принимается (TZ.md §8)", () => {
  const err = assertThrows(() => requireAnswers({ q1: "я не знаю" }, ["q1"], "chinese"), HandlerError);
  assertEquals((err as HandlerError).code, "answer_not_chinese");
});

Deno.test("пропущенный пункт — answer_incomplete", () => {
  const err = assertThrows(() => requireAnswers({ q1: "我去商店" }, ["q1", "q2"], "chinese"), HandlerError);
  assertEquals((err as HandlerError).code, "answer_incomplete");
  const err2 = assertThrows(() => requireAnswers({ s1: "true" }, ["s1"], "boolean"), HandlerError);
  assertEquals((err2 as HandlerError).code, "answer_incomplete");
});

Deno.test("ответ ИИ: процент зажат в 0–100, пустые ошибки выброшены", () => {
  const r = shapeReview({
    score_percent: 130.4,
    comment: "  Порядок слов.  ",
    errors: [{ fragment: "我商店去", what: "Порядок слов", correct: "我去商店" }, { fragment: "", what: "", correct: "" }],
  });
  assertEquals(r.score_percent, 100);
  assertEquals(r.comment, "Порядок слов.");
  assertEquals(r.errors.length, 1);
  assertEquals(shapeReview({ score_percent: Number.NaN, comment: "", errors: [] }), { score_percent: 0, comment: null, errors: [] });
});
