/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";
import { type DictWord, directionOf, normalizePhrase, phrasePinyin, segmentPhrase } from "./phrase.ts";

const d = (reading: string, gloss: string, hskLevel: number | null = null): DictWord => ({ reading, compact: [gloss], hskLevel });

const DICT = new Map<string, DictWord>([
  ["我", d("wǒ", "я", 1)],
  ["想", d("xiǎng", "хотеть; думать", 1)],
  ["我想", d("wǒxiǎng", "я думаю")],
  ["买", d("mǎi", "покупать", 1)],
  ["咖啡", d("kāfēi", "кофе", 2)],
  ["别", d("bié", "не надо", 2)],
  ["别跑", d("biépǎo", "не убегай")],
  ["跑", d("pǎo", "бежать")],
  ["了", d("le", "гл. А")],
]);
const HSK = new Map<string, number>([["我", 1], ["想", 1], ["买", 1], ["咖啡", 2], ["别", 2]]);

Deno.test("разбор: 我想买咖啡 → 我 · 想 · 买 · 咖啡 (我想 — сочетание слов HSK)", () => {
  const words = segmentPhrase("我想买咖啡。", DICT, HSK);
  assertEquals(words.map((w) => w.text), ["我", "想", "买", "咖啡", "。"]);
  assertEquals(words[3], { text: "咖啡", reading: "kāfēi", meaning: "кофе", inDictionary: true, punct: false });
  assertEquals(phrasePinyin(words), "wǒ xiǎng mǎi kāfēi");
});

Deno.test("разбор: 别跑 — слово словаря, не делится на слова HSK", () => {
  assertEquals(segmentPhrase("别跑", DICT, HSK).map((w) => w.text), ["别跑"]);
});

Deno.test("разбор: неизвестный знак — отдельно, без перевода; пометка «гл. А» — не значение", () => {
  const words = segmentPhrase("买龘了", DICT, HSK);
  assertEquals(words.map((w) => [w.text, w.meaning, w.inDictionary]), [
    ["买", "покупать", true],
    ["龘", null, false],
    ["了", null, true],
  ]);
  assertEquals(phrasePinyin(words), "mǎi ? le");
});

Deno.test("язык и ключ кэша", () => {
  assertEquals(directionOf("我想买咖啡"), "zh-ru");
  assertEquals(directionOf("Хочу купить кофе"), "ru-zh");
  assertEquals(directionOf("hello"), null);
  assertEquals(normalizePhrase("  Хочу   купить  ЁЛКУ "), "хочу купить елку");
  assertEquals(normalizePhrase("我 想 买"), "我想买");
});
