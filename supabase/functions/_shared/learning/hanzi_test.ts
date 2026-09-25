/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 *
 * Строки — как их заливает `scripts/hanzi-import.mjs` из Make Me a Hanzi.
 */
import { assertEquals } from "jsr:@std/assert@1";
import { buildPairCard, type HanziChar, maxStrokes, pairDifference, readHanzi, sharedComponents, wordDifference } from "./mod.ts";

const ROWS = [
  { character: "买", stroke_count: 6, decomposition: "⿱乛头", radical: "大", etymology_type: null, components: ["乛", "头"] },
  {
    character: "卖",
    stroke_count: 8,
    decomposition: "⿱十买",
    radical: "十",
    etymology_type: "pictophonetic",
    etymology_semantic: "买",
    etymology_phonetic: "买",
    components: ["十", "买"],
  },
  { character: "已", stroke_count: 3, decomposition: null, radical: "己", etymology_type: null, components: [] },
  { character: "己", stroke_count: 3, decomposition: "⿱？乚", radical: "己", etymology_type: "pictographic", components: ["乚"] },
  { character: "大", stroke_count: 3, decomposition: "⿻一人", radical: "大", etymology_type: "ideographic", components: ["一", "人"] },
  { character: "太", stroke_count: 4, decomposition: "⿵大丶", radical: "大", etymology_type: "ideographic", components: ["大", "丶"] },
  {
    character: "们",
    stroke_count: 5,
    decomposition: "⿰亻门",
    radical: "亻",
    etymology_type: "pictophonetic",
    etymology_semantic: "亻",
    etymology_phonetic: "门",
    components: ["亻", "门"],
  },
  { character: "门", stroke_count: 3, decomposition: "？", radical: "门", etymology_type: "pictographic", components: [] },
  { character: "东", stroke_count: 5, decomposition: "？", radical: "一", etymology_type: null, components: [] },
  { character: "西", stroke_count: 6, decomposition: "？", radical: "西", etymology_type: null, components: [] },
  { character: "意", stroke_count: 13, decomposition: "⿱音心", radical: "心", etymology_type: "ideographic", components: ["音", "心"] },
];
const CHARS = new Map(ROWS.map((r) => [r.character, readHanzi(r)!] as [string, HanziChar]));
const c = (x: string) => CHARS.get(x);

Deno.test("买/卖: 卖 = 十 + 买, общий компонент 买", () => {
  assertEquals(sharedComponents(c("买"), c("卖")), ["买"]);
  const d = pairDifference(c("买"), c("卖"))!;
  assertEquals(d.formula, "卖 = 十 + 买");
  assertEquals(d.added, ["十"]);
  assertEquals(pairDifference(c("卖"), c("买"))!.formula, "卖 = 十 + 买");
});

Deno.test("大/太: 太 = 大 + 丶", () => {
  assertEquals(sharedComponents(c("大"), c("太")), ["大"]);
  assertEquals(pairDifference(c("大"), c("太"))!.formula, "太 = 大 + 丶");
});

Deno.test("已/己: разбор неполный — строки нет", () => {
  assertEquals(sharedComponents(c("已"), c("己")), []);
  assertEquals(pairDifference(c("已"), c("己")), null);
  assertEquals(pairDifference(c("已"), undefined), null);
});

Deno.test("слова: подсказка из этимологии, только если чтение подтверждает", () => {
  const mai3 = { headword: "买", reading: "mǎi" };
  const mai4 = { headword: "卖", reading: "mài" };
  assertEquals(wordDifference(mai3, mai4, CHARS), {
    difference: "卖 = 十 + 买",
    mnemonic: "卖 — сверху 十, снизу 买: читается похоже на 买",
  });
  // Чтение не подтверждает звуковую часть — подсказки нет, строка разбора есть.
  assertEquals(wordDifference(mai3, { headword: "卖", reading: "shòu" }, CHARS).mnemonic, null);
  assertEquals(wordDifference(mai3, { headword: "卖", reading: null }, CHARS).mnemonic, null);
  // Смысловая часть — добавка.
  assertEquals(
    wordDifference({ headword: "门", reading: "mén" }, { headword: "们", reading: "men" }, CHARS).mnemonic,
    "们 — слева 亻, справа 门: читается похоже на 门, смысловая часть 亻",
  );
  // Этимология без частей — подсказки нет.
  assertEquals(wordDifference({ headword: "大", reading: "dà" }, { headword: "太", reading: "tài" }, CHARS), {
    difference: "太 = 大 + 丶",
    mnemonic: null,
  });
});

Deno.test("многосложные: сравниваем единственный различающийся знак", () => {
  const a = { headword: "买东西", reading: "mǎi dōngxi" };
  const b = { headword: "卖东西", reading: "mài dōngxi" };
  assertEquals(wordDifference(a, b, CHARS).difference, "卖 = 十 + 买");
  assertEquals(wordDifference(a, b, CHARS).mnemonic, "卖 — сверху 十, снизу 买: читается похоже на 买");
  assertEquals(wordDifference(a, { headword: "卖", reading: "mài" }, CHARS).difference, null);
  assertEquals(wordDifference({ headword: "东西", reading: null }, { headword: "买卖", reading: null }, CHARS).difference, null);
  assertEquals(wordDifference(a, b, new Map()).difference, null);
});

Deno.test("число черт слова — самый сложный знак", () => {
  assertEquals(maxStrokes("意大", CHARS), 13);
  assertEquals(maxStrokes("买", CHARS), 6);
  assertEquals(maxStrokes("猫", CHARS), null);
});

Deno.test("карточка пары: строка разбора и подсказка из данных о знаках", () => {
  const mai3 = { lexemeId: "l1", headword: "买", reading: "mǎi", translation: "покупать" };
  const mai4 = { lexemeId: null, headword: "卖", reading: "mài", translation: "продавать" };
  const card = buildPairCard(mai3, mai4, "p1", null, CHARS);
  assertEquals(card.body.pair!.difference, "卖 = 十 + 买");
  assertEquals(card.body.pair!.mnemonic, "卖 — сверху 十, снизу 买: читается похоже на 买");
  assertEquals(buildPairCard(mai3, mai4, "p1").body.pair!.difference, null);
});
