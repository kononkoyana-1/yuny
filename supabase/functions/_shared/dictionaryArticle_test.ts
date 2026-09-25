/**
 * Статья в листе (#79, #80, #84): состав слова, уровень HSK, слова со знаком.
 *
 *   DENO_NO_PACKAGE_JSON=1 deno test supabase/functions/_shared/dictionaryArticle_test.ts
 */
import { assertEquals } from "jsr:@std/assert@1";
import { charPosition, charWords, composition, hskLevelOf, shortGloss } from "./dictionaryArticle.ts";
import type { CharEntry } from "./learning/mod.ts";

const DIAN: CharEntry = { headword: "电", reading: "diàn", compact: ["электричество; электрический", "молния"] };
const NAO: CharEntry = { headword: "脑", reading: "nǎo", compact: ["мозг; голова"] };
const HAO: CharEntry = {
  headword: "好",
  reading: "hǎo, hào",
  compact: ["хороший, добрый, прекрасный", "любить"],
  senses: [
    { nest: "I", gloss: "прил. hǎo", header: true },
    { nest: "I", gloss: "хороший, добрый, прекрасный" },
    { nest: "II", gloss: "гл. hào", header: true },
    { nest: "II", gloss: "любить, увлекаться (чем-л.)" },
  ],
};
const FU: CharEntry = { headword: "服", reading: "fú", compact: ["одежда, платье"] };
const YI: CharEntry = { headword: "衣", reading: "yī", compact: ["одежда"] };

Deno.test("состав: 电脑 → 电 diàn «электричество» · 脑 nǎo «мозг»", () => {
  assertEquals(composition("电脑", "diànnǎo", [DIAN, NAO]), [
    { char: "电", reading: "diàn", meaning: "электричество", entry_reading: "diàn" },
    { char: "脑", reading: "nǎo", meaning: "мозг", entry_reading: "nǎo" },
  ]);
});

Deno.test("состав: чтение знака в этом слове, значение — для этого чтения", () => {
  const out = composition("爱好", "àihào", [HAO]);
  assertEquals(out[1], { char: "好", reading: "hào", meaning: "любить, увлекаться", entry_reading: "hǎo, hào" });
  // Статьи 爱 нет — чтение из слова, значения нет.
  assertEquals(out[0], { char: "爱", reading: "ài", meaning: null, entry_reading: null });
});

Deno.test("состав: лёгкий тон в слове — статья знака находится без тона", () => {
  const out = composition("衣服", "yīfu", [YI, FU]);
  assertEquals(out.map((c) => [c.reading, c.meaning]), [["yī", "одежда"], ["fu", "одежда, платье"]]);
});

Deno.test("состав: чтение не делится по слогам — первое чтение статьи знака", () => {
  const out = composition("好电", null, [HAO, DIAN]);
  assertEquals(out.map((c) => [c.reading, c.meaning]), [["hǎo", "хороший, добрый"], ["diàn", "электричество"]]);
});

Deno.test("состав: повторы знака сохраняются, у слова из одного знака состава нет", () => {
  assertEquals(composition("好好", "hǎohǎo", [HAO]).length, 2);
  assertEquals(composition("好", "hǎo", [HAO]), []);
  // Латиница и цифры в заголовке — не знаки.
  assertEquals(composition("T恤", "T xù", []).length, 0);
});

Deno.test("короткое значение: первый пункт, не больше двух вариантов, без пояснений", () => {
  assertEquals(shortGloss("хороший, добрый, прекрасный; здоровый"), "хороший, добрый");
  assertEquals(shortGloss("звонить (по телефону)"), "звонить");
  assertEquals(shortGloss("说；可以说。"), null);
  assertEquals(shortGloss(null), null);
});

Deno.test("позиция знака: начало, середина, конец", () => {
  assertEquals(charPosition("看书", "看"), "start");
  assertEquals(charPosition("好看", "看"), "end");
  assertEquals(charPosition("看不见", "不"), "middle");
});

Deno.test("слова со знаком: свои первыми, потом HSK по уровню, потом словарь", () => {
  const out = charWords(
    "看",
    [{ headword: "难看", reading: "nánkàn", gloss: null, hsk_level: 3, stage: "recall" }],
    [
      { headword: "看法", reading: "kànfǎ", gloss: "взгляд, мнение", hsk_level: null },
      { headword: "看见", reading: "kànjiàn", gloss: "увидеть", hsk_level: 1 },
      { headword: "难看", reading: "nánkàn", gloss: "некрасивый", hsk_level: 3 },
      { headword: "看书", reading: "kànshū", gloss: "читать книгу", hsk_level: 1 },
      { headword: "看守", reading: "kānshǒu", gloss: "look after", hsk_level: null },
      { headword: "看", reading: "kàn", gloss: "смотреть", hsk_level: 1 },
    ],
  );
  assertEquals(out.map((w) => w.headword), ["难看", "看见", "看书", "看法"]);
  assertEquals(out[0], {
    headword: "难看",
    reading: "nánkàn",
    meaning: null,
    hsk_level: 3,
    position: "end",
    mine: true,
    stage: "recall",
  });
  assertEquals(out[1].position, "start");
  assertEquals(charWords("看", [], [{ headword: "看见", reading: null, gloss: "увидеть", hsk_level: 1 }], 0), []);
});

Deno.test("уровень HSK: из статьи, иначе меньший из списка", () => {
  assertEquals(hskLevelOf(2, [4]), 2);
  assertEquals(hskLevelOf(null, [4, 3]), 3);
  assertEquals(hskLevelOf(null, []), null);
});
