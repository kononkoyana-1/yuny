/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import { type Candidate, classify, pickOptions, toneVariants } from "./mod.ts";

const MAI3 = { headword: "买", reading: "mǎi", gloss: "покупать; купить" };

const POOL: Candidate[] = [
  { headword: "卖", reading: "mài", gloss: "продавать", source: "pair" },
  { headword: "买卖", reading: "mǎimài", gloss: "торговля", source: "shared_char" },
  { headword: "埋", reading: "mái", gloss: "закапывать", source: "same_sound" },
  { headword: "麦", reading: "mài", gloss: "пшеница", source: "homophone" },
  { headword: "购买", reading: "gòumǎi", gloss: "покупать", source: "shared_char" },
  { headword: "猫", reading: "māo", gloss: "кошка", source: "user" },
  { headword: "红", reading: "hóng", gloss: "красный", source: "level" },
  { headword: "桌子", reading: "zhuōzi", gloss: "стол", source: "level" },
];

Deno.test("тот же слог с другим тоном", () => {
  assertEquals(toneVariants("mǎi"), ["māi", "mái", "mài"]);
  assertEquals(toneVariants("dòufu").length, 7);
  assertEquals(toneVariants("не пиньинь"), []);
});

Deno.test("значение: пара путаницы всегда среди вариантов, синоним правильного — нет", () => {
  for (let seed = 1; seed < 30; seed++) {
    const opts = pickOptions({ kind: "meaning", target: MAI3, candidates: POOL, count: 3, seed })!;
    const values = opts.map((o) => o.value);
    assertEquals(opts.length, 4);
    assert(values.includes("покупать"));
    assert(values.includes("продавать"));
    // 购买 «покупать» — синоним, оба ответа были бы верны.
    assert(!opts.some((o) => o.headword === "购买"));
    assertEquals(new Set(values).size, 4);
  }
});

Deno.test("значение: правдоподобные раньше случайных", () => {
  const opts = pickOptions({ kind: "meaning", target: MAI3, candidates: POOL, count: 3, seed: 7 })!;
  const heads = opts.map((o) => o.headword).sort();
  assertEquals(heads, ["买", "买卖", "卖", "埋"].sort());
});

Deno.test("пиньинь: два варианта тона и чужие чтения; тон своего слова классифицируется как тон", () => {
  const opts = pickOptions({ kind: "pinyin", target: MAI3, candidates: POOL, count: 3, seed: 3 })!;
  const own = opts.filter((o) => o.headword === "买");
  assertEquals(own.length, 3); // правильный + 2 тона
  const wrongTone = own.find((o) => o.value !== "mǎi")!;
  const c = classify({ target: MAI3, answer: { kind: "choice", value: wrongTone.value }, options: opts });
  assertEquals(c.outcome, "tone");
  assertEquals(c.partner, null);
});

Deno.test("знак: похожие по форме и звучанию, исключённые слова раунда не берутся", () => {
  const opts = pickOptions({
    kind: "hanzi",
    target: MAI3,
    candidates: POOL,
    count: 3,
    exclude: ["卖"],
    seed: 11,
  })!;
  const heads = opts.map((o) => o.headword);
  assert(!heads.includes("卖"));
  assert(heads.includes("买卖") && heads.includes("购买"));
  assertEquals(opts.find((o) => o.headword === "买卖")!.similarity, "form");
});

Deno.test("мало кандидатов — null, сборщик берёт другой формат", () => {
  assertEquals(pickOptions({ kind: "hanzi", target: MAI3, candidates: POOL.slice(0, 2), count: 3, seed: 1 }), null);
});

Deno.test("одинаковый seed — одинаковые варианты", () => {
  const a = pickOptions({ kind: "hanzi", target: MAI3, candidates: POOL, count: 5, seed: 42 });
  const b = pickOptions({ kind: "hanzi", target: MAI3, candidates: POOL, count: 5, seed: 42 });
  assertEquals(a, b);
});

Deno.test("значение: пометки, отсылки и имена из словаря — не варианты", () => {
  const JIU = { headword: "旧", reading: "jiù", gloss: "старый" };
  const pool: Candidate[] = [
    { headword: "臼", reading: "jiù", gloss: "гл.", source: "homophone" },
    { headword: "舅", reading: "jiù", gloss: "употребляется вместо какого-то иероглифа", source: "homophone" },
    { headword: "柩", reading: "jiù", gloss: "вм. 救 спасать", source: "homophone" },
    { headword: "鹫", reading: "jiù", gloss: "Цзю (фамилия)", source: "homophone" },
    { headword: "酒", reading: "jiǔ", gloss: "вино; спиртное", source: "same_sound" },
    { headword: "新", reading: "xīn", gloss: "новый", source: "level" },
    { headword: "书", reading: "shū", gloss: "книга", source: "level" },
    { headword: "水", reading: "shuǐ", gloss: "* вода", source: "level" },
  ];
  for (let seed = 1; seed < 20; seed++) {
    const values = pickOptions({ kind: "meaning", target: JIU, candidates: pool, count: 3, seed })!.map((o) => o.value);
    assert(values.includes("старый"));
    for (const bad of ["гл.", "употребляется вместо какого-то иероглифа", "вм. 救 спасать", "Цзю (фамилия)"]) {
      assert(!values.includes(bad), `«${bad}» в вариантах`);
    }
  }
});
