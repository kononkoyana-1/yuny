/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  meaningFor,
  meaningsFor,
  buildExercise,
  buildPairCard,
  type Candidate,
  type CharEntry,
  charNotes,
  classify,
  type ContextSentence,
  easierCode,
  explanation,
  pinyinA11y,
  resultOutcome,
  shuffleTiles,
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

// ------------------------------------------------------------ контекст (#64)

const SENTENCE: ContextSentence = {
  id: "ctx1",
  tier: "T2",
  zh: "我想买咖啡。",
  pinyin: "wǒ xiǎng mǎi kāfēi.",
  ru: "Я хочу купить кофе.",
  tokens: ["我", "想", "买", "咖啡", "。"],
  tokenLevels: [1, 1, null, 2, null],
  targetIndex: 2,
  altOrders: [],
  hskMax: 2,
};

Deno.test("знакомство: пример из кэша; нет предложения — null", () => {
  const b = buildExercise({ code: "intro", word: MAI3, candidates: [], seed: 1, sentence: SENTENCE })!;
  assertEquals(b.body.intro!.example, { zh: "我想买咖啡。", pinyin: "wǒ xiǎng mǎi kāfēi.", ru: "Я хочу купить кофе." });
  assertEquals(buildExercise({ code: "intro", word: MAI3, candidates: [], seed: 1 })!.body.intro!.example, null);
});

Deno.test("C1: пропуск на месте слова, варианты — знаки, без слов самой фразы и синонимов", () => {
  const pool: Candidate[] = [
    ...POOL,
    { headword: "想", reading: "xiǎng", gloss: "хотеть", source: "user" },
    { headword: "购买", reading: "gòumǎi", gloss: "покупать", source: "shared_char" },
  ];
  const b = buildExercise({ code: "C1", word: MAI3, candidates: pool, seed: 3, sentence: SENTENCE })!;
  assertEquals(b.body.code, "C1");
  assertEquals(b.body.sentence, { tokens: ["我", "想", "", "咖啡", "。"], blank_index: 2, ru: "Я хочу купить кофе." });
  const texts = b.body.options!.map((o) => o.text);
  assertEquals(texts.length, 4);
  assert(texts.includes("买") && !texts.includes("想") && !texts.includes("购买"));
  assertEquals(b.body.options!.find((o) => o.id === b.body.key!.option_id)!.text, "买");
  assertEquals(b.ticket.exercise, "C1");
  assertEquals(b.ticket.context_id, "ctx1");
  assertEquals(buildExercise({ code: "C1", word: MAI3, candidates: POOL, seed: 3 }), null);
});

Deno.test("C2: плитки без пунктуации вперемешку, допустимые порядки в ключе и билете", () => {
  const s = { ...SENTENCE, altOrders: [["想", "我", "买", "咖啡"]] };
  const b = buildExercise({ code: "C2", word: MAI3, candidates: [], seed: 7, sentence: s })!;
  const shown = b.body.tiles!.map((t) => t.text);
  assertEquals([...shown].sort(), ["买", "咖啡", "我", "想"].sort());
  assert(shown.join("") !== "我想买咖啡" && shown.join("") !== "想我买咖啡");
  assertEquals(b.body.key, { tokens: ["我", "想", "买", "咖啡"], orders: [["我", "想", "买", "咖啡"], ["想", "我", "买", "咖啡"]] });
  assertEquals(b.body.sentence!.ru, "Я хочу купить кофе.");
  assertEquals(b.ticket.tiles, shown);
  assertEquals(b.ticket.expected_orders, b.body.key!.orders);
  // Ответ плитками → классификатор: порядок из допустимых — верно, те же слова иначе — порядок.
  const order = (tokens: string[]) =>
    classify({ target: MAI3, answer: { kind: "order", tokens }, expectedOrders: b.ticket.expected_orders });
  assertEquals(order(["想", "我", "买", "咖啡"]).outcome, "ok");
  assertEquals(order(["咖啡", "我", "想", "买"]).outcome, "order");
});

Deno.test("C2: коллокация и фраза из двух плиток не годятся; все перестановки верны — плиток не собрать", () => {
  assertEquals(buildExercise({ code: "C2", word: MAI3, candidates: [], seed: 1, sentence: { ...SENTENCE, tier: "T1" } }), null);
  const two = { ...SENTENCE, tokens: ["买", "咖啡"], tokenLevels: [null, 2], targetIndex: 0 };
  assertEquals(buildExercise({ code: "C2", word: MAI3, candidates: [], seed: 1, sentence: two }), null);
  assertEquals(shuffleTiles(["a", "b"], [["a", "b"], ["b", "a"]], 1), null);
  assertEquals(easierCode("C2"), "C1");
});

Deno.test("значение знака: пометка «гл. А» — не значение, история и имена — в конце, чужое чтение — нет", () => {
  const DONG: CharEntry = {
    headword: "动",
    reading: "dòng",
    compact: ["гл. А", "двигаться, передвигаться; шевелиться", "действовать, быть деятельным"],
    senses: [],
  };
  assertEquals(meaningFor(DONG, { base: "dong", tone: 4 }), "двигаться, передвигаться; шевелиться");

  const HAN: CharEntry = {
    headword: "汉",
    reading: "hàn",
    compact: [
      "ист. Хань, Ханьская династия (206 г. до н. э. — 220 г. н. э.)",
      "ист. Ханьская эпоха; ханьский",
      "Китай; китайский",
      "геогр. (сокр. вм. 汉水) Ханьшуй, река Хань",
    ],
    senses: [],
  };
  assertEquals(meaningFor(HAN, { base: "han", tone: 4 }), "Китай; китайский");
  assertEquals(meaningsFor(HAN, { base: "han", tone: 4 }).at(-1), "геогр. (сокр. вм. 汉水) Ханьшуй, река Хань");

  // Два чтения, строки подписаны чтением; гнездо «fú собств.» — только фамилия.
  const FU: CharEntry = {
    headword: "服",
    reading: "fú; fù",
    compact: ["платье, одежда; форма; наряд, убор", "fù доза, приём, порция (лекарства)", "* fú колчан"],
    senses: [
      { nest: "I", gloss: "сущ.", header: true },
      { nest: "I", gloss: "fú платье, одежда; форма; наряд, убор" },
      { nest: "III", gloss: "fú собств.", header: true },
      { nest: "III", gloss: "Фу (фамилия)" },
    ],
  };
  assertEquals(meaningFor(FU, { base: "fu", tone: 2 }), "платье, одежда; форма; наряд, убор");
  const all = meaningsFor(FU, { base: "fu", tone: 2 });
  assert(!all.some((g) => g.includes("доза")), "значение чтения fù не для fú");
  assertEquals(all.at(-1), "* колчан");
  assertEquals(meaningFor(FU, { base: "fu", tone: 4 }), "доза, приём, порция (лекарства)");
});
