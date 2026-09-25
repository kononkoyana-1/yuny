/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  checkBatch,
  checkSentence,
  type ContextSentence,
  covered,
  knownWords,
  type Lexicon,
  maxMatch,
  pickSentence,
  readSentence,
  senseKey,
  unknownWords,
  userLevel,
} from "./mod.ts";

const MAI = { headword: "买", reading: "mǎi" };
const XUE = { headword: "学", reading: "xué" };

/** Срез словаря: чтения статей и уровни HSK. 我想 — «фраза» из БКРС, в HSK её нет. */
const LEX: Lexicon = {
  readings: new Map([
    ["我", ["wǒ"]],
    ["想", ["xiǎng"]],
    ["我想", ["wǒ xiǎng"]],
    ["买", ["mǎi"]],
    ["咖啡", ["kāfēi"]],
    ["今天", ["jīntiān"]],
    ["去", ["qù"]],
    ["超市", ["chāoshì"]],
    ["票", ["piào"]],
    ["学校", ["xuéxiào"]],
    ["学", ["xué"]],
    ["水果", ["shuǐguǒ"]],
    ["了", ["le", "liǎo"]],
    ["一", ["yī"]],
    ["个", ["gè"]],
  ]),
  hsk: new Map([
    ["我", 1], ["想", 1], ["买", 1], ["咖啡", 2], ["今天", 1], ["去", 1], ["超市", 3], ["票", 2],
    ["学校", 1], ["学", 1], ["水果", 1], ["了", 1], ["一", 1], ["个", 1],
  ]),
};

const good = { zh: "我想买咖啡。", pinyin: "wǒ xiǎng mǎi kāfēi.", ru: "Я хочу купить кофе.", tokens: ["我", "想", "买", "咖啡", "。"], target_index: 2 };

Deno.test("нарезка: самое длинное слово словаря, пунктуация — отдельно", () => {
  const has = (w: string) => LEX.readings.has(w);
  assertEquals(maxMatch("我想买咖啡。", has), ["我想", "买", "咖啡", "。"]);
  assertEquals(maxMatch("今天去超市", has), ["今天", "去", "超市"]);
});

Deno.test("проверка: годная фраза — слова по словарю, целевое на месте, пиньинь по словам", () => {
  const s = checkSentence(good, MAI, "T2", LEX)!;
  // «我想» — статья БКРС, но целиком из слов HSK: режется на 我 + 想.
  assertEquals(s.tokens, ["我", "想", "买", "咖啡", "。"]);
  assertEquals(s.targetIndex, 2);
  assertEquals(s.pinyin, "wǒ xiǎng mǎi kāfēi.");
  assertEquals(s.tokenLevels, [1, 1, null, 2, null]);
  assertEquals(s.hskMax, 2);
  assertEquals(s.altOrders, []);
});

Deno.test("проверка: целевое слово по разметке модели, иначе единственное вхождение", () => {
  // Разметка модели не сходится с текстом — берём единственное вхождение.
  assertEquals(checkSentence({ ...good, tokens: ["x"], target_index: 5 }, MAI, "T2", LEX)?.targetIndex, 2);
  // Слова нет вовсе.
  assertEquals(checkSentence({ ...good, zh: "我想去超市。", pinyin: "wǒ xiǎng qù chāoshì" }, MAI, "T2", LEX), null);
});

Deno.test("проверка: отказы — тон слова, чужой слог, латиница, перевод, длина, тир", () => {
  const no = (patch: Record<string, unknown>, tier: "T1" | "T2" = "T2") =>
    assertEquals(checkSentence({ ...good, ...patch }, MAI, tier, LEX), null);
  no({ pinyin: "wǒ xiǎng mài kāfēi" }); // тон целевого слова не тот
  no({ pinyin: "wǒ xiāo mǎi kāfēi" }); // 想 — не xiao
  no({ pinyin: "wǒ xiǎng mǎi kā" }); // слогов меньше, чем знаков
  no({ zh: "我想买coffee。" }); // латиница
  no({ ru: "I want to buy coffee." }); // не по-русски
  no({ zh: "我想买咖啡我想买咖啡我想买咖啡。" }); // длиннее тира
  no({}, "T1"); // в коллокации нет пунктуации и не больше 4 знаков
  no({ zh: "我想买茶。", pinyin: "wǒ xiǎng mǎi chá" }); // 茶 нет в словаре-срезе
});

Deno.test("проверка: слово внутри более длинного слова HSK — фраза не про него", () => {
  const raw = { zh: "我去学校。", pinyin: "wǒ qù xuéxiào", ru: "Я иду в школу.", tokens: ["我", "去", "学校", "。"], target_index: 2 };
  assertEquals(checkSentence(raw, XUE, "T2", LEX), null);
});

Deno.test("проверка: коллокация T1 и допустимые порядки — по тексту, не по нарезке модели", () => {
  const t1 = checkSentence({ zh: "买票", pinyin: "mǎi piào", ru: "купить билет", tokens: ["买", "票"], target_index: 0 }, MAI, "T1", LEX);
  assertEquals(t1?.tokens, ["买", "票"]);
  const s = checkSentence({
    zh: "今天我去超市买水果。",
    pinyin: "jīntiān wǒ qù chāoshì mǎi shuǐguǒ",
    ru: "Сегодня я пойду в супермаркет за фруктами.",
    tokens: ["今天", "我", "去", "超市", "买", "水果", "。"],
    target_index: 4,
    alt_orders: [["我", "今天", "去超市", "买", "水果"], ["我", "买", "水果"], ["今天", "我", "去", "超市", "买", "水果"]],
  }, MAI, "T2", LEX)!;
  // Первый — годен (другая нарезка, те же плитки), второй — не те слова, третий — сам порядок фразы.
  assertEquals(s.altOrders, [["我", "今天", "去", "超市", "买", "水果"]]);
  assertEquals(s.hskMax, 3);
});

Deno.test("пачка: без повторов, неизвестный тир и брак отброшены", () => {
  const list = checkBatch({ items: [{ ...good, tier: "T2" }, { ...good, tier: "T2" }, { ...good, tier: "T9" }, { tier: "T2" }] }, MAI, LEX);
  assertEquals(list.length, 1);
  assertEquals(checkBatch(null, MAI, LEX), []);
});

const sentence = (over: Partial<ContextSentence> = {}): ContextSentence => ({
  ...checkSentence(good, MAI, "T2", LEX)!,
  id: "s1",
  ...over,
});

Deno.test("покрытие: слова пользователя, белый список, HSK до его уровня, составные из знакомых", () => {
  const s = sentence({ tokens: ["我想", "买", "咖啡", "。"], tokenLevels: [1, null, 2, null], targetIndex: 1 });
  // 我想 делится на 我 + 想 из белого списка; 咖啡 — неизвестно.
  assertEquals(unknownWords(s, { words: new Set(), level: 0 }), ["咖啡"]);
  assertEquals(unknownWords(s, { words: new Set(), level: 1 }), ["咖啡"]);
  assert(covered(s, { words: new Set(), level: 2 }));
  assert(covered(s, { words: new Set(["咖啡"]), level: 0 }));
  // Целевое слово само по себе не мешает, даже если его не знают.
  assert(!unknownWords(s, { words: new Set(), level: 0 }).includes("买"));
});

Deno.test("уровень пользователя — по его словарю: ≥ 5 слов уровня и ≥ 60% на «Узнаю»", () => {
  const words = (level: number, known: number, total: number) =>
    Array.from({ length: total }, (_, i) => ({ hskLevel: level, known: i < known }));
  assertEquals(userLevel([]), 0);
  assertEquals(userLevel(words(1, 6, 8)), 1);
  assertEquals(userLevel(words(1, 3, 8)), 0);
  // HSK2 слов мало — не решает; HSK3 пройден → 3.
  assertEquals(userLevel([...words(1, 6, 8), ...words(2, 1, 2), ...words(3, 5, 6)]), 3);
  // Проваленный уровень останавливает: выше не смотрим.
  assertEquals(userLevel([...words(1, 1, 8), ...words(3, 6, 6)]), 0);
  assertEquals(userLevel([{ hskLevel: null, known: true }]), 0);
});

Deno.test("выбор: только покрытые, для C2 — предложение из 3+ плиток, недавнее — в последнюю очередь", () => {
  const known = { words: new Set(["咖啡", "票"]), level: 0 };
  const t1 = sentence({ id: "c", tier: "T1", zh: "买票", tokens: ["买", "票"], tokenLevels: [null, 2], targetIndex: 0 });
  const a = sentence({ id: "a" });
  const b = sentence({ id: "b", zh: "我想买咖啡了。" });
  const hard = sentence({ id: "h", tokens: ["我想", "买", "超市", "。"], tokenLevels: [1, null, 3, null] });
  assertEquals(pickSentence([t1, hard], { use: "C2", known, seed: 0 }), null);
  assertEquals(pickSentence([t1, hard], { use: "C1", known, seed: 0 })?.id, "c");
  assertEquals(pickSentence([t1, a], { use: "example", known, seed: 0 })?.id, "a");
  assertEquals(pickSentence([a, b], { use: "C2", known, seed: 0, avoid: new Set(["a"]) })?.id, "b");
});

Deno.test("кэш: строка читается обратно, битая — null; ключ смысла", () => {
  const row = {
    id: "x", tier: "T2", zh: "我想买咖啡。", pinyin: "wǒxiǎng mǎi kāfēi.", ru: "Я хочу купить кофе.",
    tokens: ["我想", "买", "咖啡", "。"], token_levels: [1, null, 2, null], target_index: 1, alt_orders: [], hsk_max: 2,
  };
  assertEquals(readSentence(row)?.tokens, ["我想", "买", "咖啡", "。"]);
  assertEquals(readSentence({ ...row, target_index: 9 }), null);
  assertEquals(readSentence({ ...row, token_levels: [1] }), null);
  assertEquals(senseKey("Покупать; купить"), "покупать");
  assertEquals(senseKey(null), "");
});

Deno.test("известные слова — по памяти «Читаю» (от 3 дней), в промпт — самые устойчивые первыми", () => {
  const lexemes = [
    { id: "a", headword: "咖啡", hskLevel: 2 },
    { id: "b", headword: "票", hskLevel: 2 },
    { id: "c", headword: "超市", hskLevel: 3 },
  ];
  const k = knownWords(lexemes, { a: { read: { stability: 4 } }, b: { read: { stability: 30 } }, c: { read: { stability: 1 } } });
  assertEquals([...k.words].sort(), ["咖啡", "票"].sort());
  assertEquals(k.list, ["票", "咖啡"]);
  assertEquals(k.level, 0);
});
