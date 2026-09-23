import { describe, expect, it } from "@jest/globals";
import type { UserDictionaryItem } from "@yuny/shared";
import { folderCounts, groupSavedWords, searchSaved, translationLine } from "./saved";

let n = 0;
function item(folder: string, headword: string, reading: string | null, glosses: string[] = []): UserDictionaryItem {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    folder_id: folder,
    headword,
    reading,
    translation: null,
    translation_source: null,
    created_at: "2026-09-23T00:00:00.000Z",
    entry: {
      id: n,
      headword,
      reading,
      senses: glosses.map((gloss) => ({ nest: null, num: null, gloss })),
      compact: glosses,
    },
  };
}

const items = [
  item("a", "好吃", "hǎochī", ["вкусный"]),
  item("a", "好", "hǎo, hào", ["хороший", "любить"]),
  item("b", "好", "hǎo, hào", ["хороший", "любить"]),
  item("b", "打电话", "dǎ diànhuà", ["звонить по телефону"]),
];

describe("groupSavedWords", () => {
  it("merges one word kept in several folders", () => {
    const words = groupSavedWords(items);
    expect(words.map((w) => w.headword)).toEqual(["好吃", "好", "打电话"]);
    expect(words[1].items.map((i) => i.folder_id)).toEqual(["a", "b"]);
  });

  it("keeps two readings of the same characters apart", () => {
    const words = groupSavedWords([item("a", "便宜", "piányi"), item("a", "便宜", "biànyí")]);
    expect(words).toHaveLength(2);
  });
});

describe("folderCounts", () => {
  it("counts words per folder", () => {
    expect(Object.fromEntries(folderCounts(items))).toEqual({ a: 2, b: 2 });
  });
});

describe("searchSaved", () => {
  const words = groupSavedWords(items);
  const found = (q: string) => searchSaved(words, q).map((w) => w.headword);

  it("finds hanzi anywhere in the word", () => {
    expect(found("好")).toEqual(["好吃", "好"]);
    expect(found("电话")).toEqual(["打电话"]);
  });

  it("finds pinyin by the start of any reading, tones optional", () => {
    expect(found("hao")).toEqual(["好吃", "好"]);
    expect(found("hào")).toEqual(["好吃", "好"]);
    expect(found("haoc")).toEqual(["好吃"]);
    expect(found("dianhua")).toEqual([]);
  });

  it("finds Russian in the article's senses", () => {
    expect(found("Звонить")).toEqual(["打电话"]);
    expect(found("кошка")).toEqual([]);
  });

  it("finds Russian in the word's own translation from a file", () => {
    const own = groupSavedWords([{ ...item("c", "扫码", "sǎomǎ"), entry: null, translation: "отсканировать QR-код" }]);
    expect(searchSaved(own, "qr").map((w) => w.headword)).toEqual([]);
    expect(searchSaved(own, "сканир").map((w) => w.headword)).toEqual(["扫码"]);
  });

  it("keeps the first own translation of a word kept in several folders", () => {
    const own = groupSavedWords([
      { ...item("a", "买", "mǎi"), translation: null },
      { ...item("b", "买", "mǎi"), translation: "покупать", translation_source: "file" },
    ]);
    expect(own[0].translation).toBe("покупать");
    expect(own[0].translationSource).toBe("file");
  });

  it("returns nothing for an empty or letterless query", () => {
    expect(found("  ")).toEqual([]);
    expect(found("...")).toEqual([]);
  });
});

describe("translationLine", () => {
  const entry = { id: 1, headword: "买", reading: "mǎi", senses: [], compact: ["покупать", "купить"] };

  it("names a file or AI translation even when the entry is there", () => {
    expect(translationLine({ entry, translation: "брать", translationSource: "file" })).toEqual({
      kind: "file",
      text: "брать",
    });
    expect(translationLine({ entry: null, translation: "QR", translationSource: "ai" })?.kind).toBe("ai");
  });

  it("hides a dictionary copy while the entry it was copied from is shown", () => {
    expect(translationLine({ entry, translation: "покупать; купить", translationSource: "dictionary" })).toBeNull();
  });

  it("shows the dictionary copy once the entry is gone", () => {
    expect(translationLine({ entry: null, translation: "покупать", translationSource: "dictionary" })?.kind).toBe(
      "dictionary",
    );
  });

  it("falls back to a neutral label for words saved before sources were kept", () => {
    expect(translationLine({ entry, translation: "покупать; купить", translationSource: null })).toBeNull();
    expect(translationLine({ entry, translation: "брать", translationSource: null })?.kind).toBe("saved");
  });

  it("is null without a translation", () => {
    expect(translationLine({ entry, translation: null })).toBeNull();
  });
});
