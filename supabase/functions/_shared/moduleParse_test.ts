/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";

import { MAX_WORDS, normalizeVocabulary, pickEntry, shortTitle } from "./moduleParse.ts";

const word = (w: string, reading = "", meaning = "значение", hint = "подсказка") => ({
  word: w,
  reading,
  meaning_ru: meaning,
  sense_hint: hint,
});

Deno.test("слова: повторы и слова без иероглифов отбрасываются", () => {
  const rows = normalizeVocabulary([
    word("商店", "shāngdiàn"),
    word(" 商店 ", "shāngdiàn"),
    word("hello"),
    word("买", "mǎi"),
  ]);
  assertEquals(rows.map((r) => [r.position, r.word]), [[1, "商店"], [2, "买"]]);
});

Deno.test("слова: без значения — не слово, без подсказки — подсказкой служит значение", () => {
  const rows = normalizeVocabulary([
    word("卖", "mài", "  "),
    word("贵", "guì", "дорогой", ""),
  ]);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].sense_hint, "дорогой");
  assertEquals(rows[0].reading, "guì");
});

Deno.test("словарь: статья выбирается по чтению из разбора", () => {
  const candidates = [
    { id: 1, headword: "行", reading: "xíng" },
    { id: 2, headword: "行", reading: "háng" },
  ];
  assertEquals(pickEntry(candidates, "háng")?.id, 2);
  assertEquals(pickEntry(candidates, "xing")?.id, 1);
});

Deno.test("словарь: у статьи несколько чтений через запятую или точку с запятой", () => {
  const candidates = [
    { id: 1, headword: "大", reading: "dà; dài; tài" },
    { id: 2, headword: "打", reading: "dǎ, dá" },
  ];
  assertEquals(pickEntry(candidates, "dài")?.id, 1);
  assertEquals(pickEntry(candidates, "dá")?.id, 2);
});

Deno.test("словарь: чтение не совпало — первая статья; статей нет — null", () => {
  assertEquals(pickEntry([{ id: 7, headword: "了", reading: "le" }], "liǎo")?.id, 7);
  assertEquals(pickEntry([], "le"), null);
});

Deno.test("название: короткое как есть, длинное — по границе слова", () => {
  assertEquals(shortTitle("  Урок 5.   В магазине "), "Урок 5. В магазине");
  const long = "Домашнее задание по теме покупки в магазине и на рынке";
  const cut = shortTitle(long);
  assertEquals(cut, "Домашнее задание по теме покупки в…");
});

Deno.test("слова: больше потолка не берём — схема его Gemini не передаёт", () => {
  const many = Array.from({ length: MAX_WORDS + 30 }, (_, i) => word(String.fromCharCode(0x4e00 + i)));
  assertEquals(normalizeVocabulary(many).length, MAX_WORDS);
});
