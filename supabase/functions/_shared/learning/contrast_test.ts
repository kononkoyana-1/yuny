/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assertEquals } from "jsr:@std/assert@1";
import { checkCollocation, checkContrast } from "./mod.ts";

const MAI3 = { headword: "买", reading: "mǎi" };
const MAI4 = { headword: "卖", reading: "mài" };
const YI = { headword: "已", reading: "yǐ" };
const YIJING = { headword: "已经", reading: "yǐjīng" };

Deno.test("контраст: годные коллокации проходят, пиньинь — со знаками тонов", () => {
  const card = checkContrast(
    {
      collocations: [
        { zh: "买东西", pinyin: "mai3 dong1xi", ru: "покупать вещи" },
        { zh: "卖东西", pinyin: "mài dōngxi", ru: "продавать вещи" },
      ],
    },
    MAI3,
    MAI4,
  );
  assertEquals(card, {
    collocations: [
      { zh: "买东西", pinyin: "mǎi dōngxi", ru: "покупать вещи" },
      { zh: "卖东西", pinyin: "mài dōngxi", ru: "продавать вещи" },
    ],
  });
});

Deno.test("контраст: коллокация без слова, с партнёром или с чужим чтением — отказ", () => {
  const ok = { zh: "买东西", pinyin: "mǎi dōngxi", ru: "покупать вещи" };
  assertEquals(checkCollocation(ok, MAI3, MAI4)?.zh, "买东西");
  assertEquals(checkCollocation({ ...ok, zh: "东西" , pinyin: "dōngxi" }, MAI3, MAI4), null); // нет самого слова
  assertEquals(checkCollocation({ ...ok, zh: "买卖", pinyin: "mǎimai" }, MAI3, MAI4), null); // партнёр внутри
  assertEquals(checkCollocation({ ...ok, pinyin: "mài dōngxi" }, MAI3, MAI4), null); // тон слова не тот
  assertEquals(checkCollocation({ ...ok, pinyin: "mǎi dōng" }, MAI3, MAI4), null); // слогов меньше, чем знаков
  assertEquals(checkCollocation({ ...ok, zh: "买东西！" }, MAI3, MAI4), null); // не только иероглифы
  assertEquals(checkCollocation({ ...ok, zh: "买" , pinyin: "mǎi" }, MAI3, MAI4), null); // одно слово — не коллокация
  assertEquals(checkCollocation({ ...ok, ru: "buy things" }, MAI3, MAI4), null); // перевод не по-русски
  assertEquals(checkCollocation({ zh: "买东西" }, MAI3, MAI4), null);
});

Deno.test("контраст: партнёр внутри слова (已 / 已经) не мешает, лёгкий тон в сочетании допустим", () => {
  const card = checkContrast(
    {
      collocations: [
        { zh: "早已", pinyin: "zǎoyǐ", ru: "давно уже" },
        { zh: "已经来了", pinyin: "yǐjīng lái le", ru: "уже пришёл" },
      ],
    },
    YI,
    YIJING,
  );
  assertEquals(card?.collocations[1].pinyin, "yǐjīng lái le");
  assertEquals(checkContrast({ collocations: [] }, YI, YIJING), null);
  assertEquals(checkContrast(null, YI, YIJING), null);
});
