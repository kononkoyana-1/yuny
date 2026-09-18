/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";

import { levelReport, segment, withinLevel } from "./hskLevel.ts";

// Кусок настоящего списка HSK 2.0: слово → уровень.
const HSK = new Map<string, number>([
  ["我", 1], ["你", 1], ["去", 1], ["商店", 1], ["买", 1], ["多少", 1], ["钱", 1], ["苹果", 1],
  ["太", 1], ["了", 1], ["是", 1], ["很", 1], ["好", 1], ["这", 1], ["个", 1], ["吗", 1],
  ["贵", 2], ["便宜", 2], ["卖", 2], ["一", 1], ["斤", 3],
  ["经济", 4], ["价格", 4], ["影响", 3], ["通货膨胀", 6], ["显著", 6],
]);
const lexicon = new Set(HSK.keys());

Deno.test("сегментация: длинное слово словаря раньше отдельных знаков", () => {
  assertEquals(segment("我去商店买苹果。", lexicon), ["我", "去", "商店", "买", "苹果"]);
  assertEquals(segment("通货膨胀", lexicon), ["通货膨胀"]);
});

Deno.test("сегментация: пунктуация, цифры и латиница пропускаются", () => {
  assertEquals(segment("A：这个多少钱？ B：5块。", lexicon), ["这", "个", "多少", "钱", "块"]);
});

Deno.test("текст уровня HSK 2 для ученика HSK 2 проходит", () => {
  const text = "我去商店买苹果。苹果多少钱一斤？太贵了！这个很便宜。";
  const report = levelReport(text, HSK, new Set(["斤"]), 2);
  assertEquals(report.above, 0);
  assertEquals(withinLevel(report), true);
});

Deno.test("слово материала засчитывается, даже если оно выше уровня (TZ.md §4)", () => {
  const withMaterial = levelReport("苹果多少钱一斤？", HSK, new Set(["斤"]), 2);
  const without = levelReport("苹果多少钱一斤？", HSK, new Set(), 2);
  assertEquals(withMaterial.above, 0);
  assertEquals(without.offenders, ["斤"]);
});

Deno.test("текст, набитый лексикой HSK 4–6, для ученика HSK 2 отклоняется", () => {
  const text = "通货膨胀显著影响价格。经济很好吗？";
  const report = levelReport(text, HSK, new Set(), 2);
  assertEquals(report.offenders.sort(), ["价格", "影响", "显著", "经济", "通货膨胀"].sort());
  assertEquals(withinLevel(report), false);
});

Deno.test("знак вне HSK считается выше уровня", () => {
  const report = levelReport("我买鳄梨。", HSK, new Set(), 6);
  assertEquals(report.offenders.sort(), ["梨", "鳄"].sort());
});

Deno.test("для ученика HSK 6 те же слова в норме", () => {
  const report = levelReport("通货膨胀显著影响价格。", HSK, new Set(), 6);
  assertEquals(report.above, 0);
});

Deno.test("пустой текст не падает", () => {
  assertEquals(levelReport("", HSK, new Set(), 1).share, 0);
});
