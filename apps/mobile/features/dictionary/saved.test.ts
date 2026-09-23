import { describe, expect, it } from "@jest/globals";
import type { UserDictionaryItem } from "@yuny/shared";
import { folderCounts, groupSavedWords, searchSaved } from "./saved";

let n = 0;
function item(folder: string, headword: string, reading: string | null, glosses: string[] = []): UserDictionaryItem {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    folder_id: folder,
    headword,
    reading,
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

  it("returns nothing for an empty or letterless query", () => {
    expect(found("  ")).toEqual([]);
    expect(found("...")).toEqual([]);
  });
});
