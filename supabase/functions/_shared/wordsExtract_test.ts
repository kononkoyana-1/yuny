/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";

import { MAX_EXTRACTED, normalizeWords, resolveWord, type WordRow } from "./wordsExtract.ts";

const raw = (word: string, reading = "", file = "", ai = "значение") => ({
  word,
  reading,
  translation_in_file: file,
  meaning_ru: ai,
});

const row = (word: string, reading: string | null, file: string | null, ai: string | null): WordRow => ({
  word,
  reading,
  fileTranslation: file,
  aiMeaning: ai,
});

const 行 = [
  { id: 1, headword: "行", reading: "xíng", compact: ["идти", "годиться", "ладно"] },
  { id: 2, headword: "行", reading: "háng", compact: ["ряд", "профессия"] },
];

Deno.test("слова: повторы и слова без иероглифов отбрасываются, пустые поля — null", () => {
  const rows = normalizeWords([raw("商店", "shāngdiàn"), raw(" 商店 "), raw("hello"), raw("买", "", " ", "")]);
  assertEquals(rows, [
    { word: "商店", reading: "shāngdiàn", fileTranslation: null, aiMeaning: "значение" },
    { word: "买", reading: null, fileTranslation: null, aiMeaning: null },
  ]);
});

Deno.test("слова: не больше потолка", () => {
  const many = Array.from({ length: MAX_EXTRACTED + 5 }, (_, i) => raw(`字${String.fromCharCode(0x4e00 + i)}`));
  assertEquals(normalizeWords(many).length, MAX_EXTRACTED);
});

Deno.test("перевод из файла важнее словаря, статья всё равно находится по чтению", () => {
  assertEquals(resolveWord(row("行", "háng", "ряд, шеренга", "ряд"), 行), {
    word: "行",
    reading: "háng",
    translation: "ряд, шеренга",
    source: "file",
    entry_id: 2,
  });
});

Deno.test("только иероглифы — перевод предлагает словарь, не больше трёх значений", () => {
  const word = resolveWord(row("行", "xíng", null, "идти"), [
    { ...行[0], compact: ["идти", "годиться", "ладно", "четвёртое"] },
  ]);
  assertEquals(word?.translation, "идти; годиться; ладно");
  assertEquals(word?.source, "dictionary");
});

Deno.test("слова нет в словаре — перевод из файла, иначе от модели", () => {
  assertEquals(resolveWord(row("网红", "wǎnghóng", "блогер", "интернет-знаменитость"), [])?.source, "file");
  const ai = resolveWord(row("网红", "wǎnghóng", null, "интернет-знаменитость"), []);
  assertEquals([ai?.translation, ai?.source, ai?.entry_id], ["интернет-знаменитость", "ai", null]);
});

Deno.test("ни статьи, ни перевода — слова нет", () => {
  assertEquals(resolveWord(row("网红", null, null, null), []), null);
});
