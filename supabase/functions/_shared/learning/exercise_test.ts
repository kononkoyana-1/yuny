/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  buildExercise,
  buildPairCard,
  type Candidate,
  charNotes,
  classify,
  explanation,
  pinyinA11y,
  resultOutcome,
  toneLabel,
} from "./mod.ts";

const MAI3 = { lexemeId: "l1", headword: "买", reading: "mǎi", translation: "покупать; купить" };
const POOL: Candidate[] = [
  { headword: "卖", reading: "mài", gloss: "продавать", source: "pair" },
  { headword: "买卖", reading: "mǎimài", gloss: "торговля", source: "shared_char" },
  { headword: "麦", reading: "mài", gloss: "пшеница", source: "homophone" },
  { headword: "猫", reading: "māo", gloss: "кошка", source: "user" },
  { headword: "红", reading: "hóng", gloss: "красный", source: "level" },
  { headword: "桌", reading: "zhuō", gloss: "стол", source: "level" },
];

Deno.test("подпись тона и чтение для диктора", () => {
  assertEquals(toneLabel("mǎi"), "3-й тон");
  assertEquals(toneLabel("dòufu"), "4-й + лёгкий");
  assertEquals(toneLabel(null), null);
  assertEquals(pinyinA11y("mǎi"), "mǎi, третий тон");
});

Deno.test("R1: варианты-значения, ключ указывает на правильный, билет знает значения", () => {
  const b = buildExercise({ code: "R1", word: MAI3, candidates: POOL, seed: 5 })!;
  assertEquals(b.body.code, "R1");
  assertEquals(b.body.options!.length, 4);
  const right = b.body.options!.find((o) => o.id === b.body.key!.option_id)!;
  assertEquals(right.text, "покупать");
  assertEquals(b.ticket.expected, "покупать");
  assertEquals(b.ticket.options!.map((o) => o.value), b.body.options!.map((o) => o.text));
  assertEquals(b.body.lexeme!.tone_label, "3-й тон");
});

Deno.test("P2: ключ — нормализованный пиньинь", () => {
  const b = buildExercise({ code: "P2", word: MAI3, candidates: [], seed: 1 })!;
  assertEquals(b.body.key, { pinyin: "mai3" });
});

Deno.test("W1: 6 знаков; мало кандидатов — null", () => {
  assertEquals(buildExercise({ code: "W1", word: MAI3, candidates: POOL, seed: 2 })!.body.options!.length, 6);
  assertEquals(buildExercise({ code: "W1", word: MAI3, candidates: POOL.slice(0, 2), seed: 2 }), null);
});

Deno.test("знакомство: знаки слова и где они уже встречаются", () => {
  assertEquals(charNotes("买", ["买东西", "买单", "买", "卖"]), [{ char: "买", known_in: ["买东西", "买单"] }]);
  const b = buildExercise({ code: "intro", word: MAI3, candidates: [], seed: 1, ownHeadwords: ["买单"] })!;
  assertEquals(b.body.intro!.actions, "know_or_remember");
  assertEquals(b.ticket.exercise, "intro");
});

Deno.test("задание на пару: обычный рендерер, в память — X1", () => {
  const b = buildExercise({ code: "X1", word: MAI3, candidates: POOL, seed: 3, pairId: "p1" })!;
  assertEquals(b.body.code, "R1");
  assertEquals(b.ticket.exercise, "X1");
  assertEquals(b.ticket.pair_id, "p1");
  const card = buildPairCard(MAI3, { lexemeId: null, headword: "卖", reading: "mài", translation: "продавать" }, "p1");
  assertEquals(card.body.pair!.b.tone_label, "4-й тон");
  assertEquals(card.body.pair!.difference, null);
});

Deno.test("исход для клиента и разбор", () => {
  const opts = buildExercise({ code: "R1", word: MAI3, candidates: POOL, seed: 5 })!.ticket.options!;
  const conf = classify({
    target: MAI3,
    answer: { kind: "choice", value: "продавать" },
    options: opts,
    known: [MAI3, { headword: "卖", reading: "mài" }],
  });
  assertEquals(resultOutcome(conf), "wrong");
  const lines = explanation(conf, MAI3, "продавать");
  assert(lines[0].includes("卖 mài — «продавать»"), lines[0]);
  const tone = classify({ target: MAI3, answer: { kind: "pinyin", text: "mai4" } });
  assertEquals(resultOutcome(tone), "partial");
  assertEquals(explanation(tone, MAI3, null), ["Слог верный, тон другой: mǎi — 3-й тон."]);
});
