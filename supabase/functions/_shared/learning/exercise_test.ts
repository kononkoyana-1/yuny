/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  buildExercise,
  buildPairCard,
  type Candidate,
  type CharEntry,
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

const HAO: CharEntry = {
  headword: "好",
  reading: "hǎo, hào",
  compact: ["хороший, добрый, прекрасный", "очень, весьма", "любить, увлекаться"],
  senses: [
    { nest: "I", gloss: "прил. hǎo", header: true },
    { nest: "I", gloss: "хороший, добрый, прекрасный" },
    { nest: "II", gloss: "гл. hào", header: true },
    { nest: "II", gloss: "любить, увлекаться" },
  ],
};
const SHU: CharEntry = { headword: "舒", reading: "shū", compact: ["вольготный", "расправлять"] };
const FU: CharEntry = { headword: "服", reading: "fú", compact: ["одежда; подчиняться", "принимать (лекарство)"] };

Deno.test("знакомство 舒服: новый знак и знак из своих слов — чтение, значение, слова с пиньинем", () => {
  const own = [
    { headword: "衣服", reading: "yīfu" },
    { headword: "服务", reading: "fúwù" },
    { headword: "舒服", reading: "shūfu" },
    { headword: "卖", reading: "mài" },
  ];
  assertEquals(charNotes({ headword: "舒服", reading: "shūfu" }, own, [SHU, FU, HAO]), [
    { char: "舒", reading: "shū", meaning: "вольготный", known_in: [] },
    // В 舒服 服 — лёгкий тон; чтение и значение — из статьи знака.
    {
      char: "服",
      reading: "fú",
      meaning: "одежда; подчиняться",
      known_in: [{ headword: "衣服", reading: "yīfu" }, { headword: "服务", reading: "fúwù" }],
    },
  ]);
});

Deno.test("знакомство: у знака два чтения — берётся то, что в этом слове", () => {
  const [hao3] = charNotes({ headword: "好吃", reading: "hǎochī" }, [], [HAO]);
  assertEquals([hao3.reading, hao3.meaning], ["hǎo", "хороший, добрый, прекрасный"]);
  const [hao4] = charNotes({ headword: "好奇", reading: "hàoqí" }, [], [HAO]);
  assertEquals([hao4.reading, hao4.meaning], ["hào", "любить, увлекаться"]);
  // Те же чтения отдельными статьями.
  const split: CharEntry[] = [
    { headword: "好", reading: "hào", compact: ["любить"] },
    { headword: "好", reading: "hǎo", compact: ["хороший"] },
  ];
  assertEquals(charNotes({ headword: "好吃", reading: "hǎochī" }, [], split)[0].meaning, "хороший");
  // Без чтения слова не угадываем, какое из двух.
  const [unknown] = charNotes({ headword: "好奇", reading: null }, [], [HAO]);
  assertEquals([unknown.reading, unknown.meaning], [null, null]);
});

Deno.test("знакомство: статьи на знак нет — чтение из слова, значения нет", () => {
  const notes = charNotes({ headword: "舒服", reading: "shūfu" }, [], [SHU]);
  assertEquals(notes[1], { char: "服", reading: "fu", meaning: null, known_in: [] });
  // Статья без русского значения — тоже без значения.
  const bare = charNotes({ headword: "舒", reading: "shū" }, [], [{ headword: "舒", reading: "shū", compact: ["Shu"] }]);
  assertEquals(bare[0].meaning, null);
});

Deno.test("знакомство: задание, кнопки и повтор знака", () => {
  assertEquals(charNotes(MAI3, [{ headword: "买东西", reading: "mǎi dōngxi" }, { headword: "买", reading: "mǎi" }]), [
    { char: "买", reading: "mǎi", meaning: null, known_in: [{ headword: "买东西", reading: "mǎi dōngxi" }] },
  ]);
  const b = buildExercise({ code: "intro", word: MAI3, candidates: [], seed: 1, ownWords: [{ headword: "买单", reading: "mǎidān" }] })!;
  assertEquals(b.body.intro!.actions, "know_or_remember");
  assertEquals(b.body.intro!.char_notes[0].known_in, [{ headword: "买单", reading: "mǎidān" }]);
  assertEquals(b.body.is_check, false);
  assertEquals(b.ticket.exercise, "intro");
  const again = buildExercise({ code: "intro", word: MAI3, candidates: [], seed: 1, introActions: "remember" })!;
  assertEquals(again.body.intro!.actions, "remember");
});

Deno.test("«Уже знаю»: задания проверки помечены для клиента", () => {
  const b = buildExercise({ code: "R2", word: MAI3, candidates: [], seed: 1, check: "known" })!;
  assertEquals(b.body.is_check, true);
  assertEquals(b.ticket.check, "known");
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
