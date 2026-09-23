import { describe, expect, it } from "@jest/globals";
import type { DictionarySense } from "@yuny/shared";
import { articleNests, entrySummary } from "./article";

const header = (nest: string, gloss: string): DictionarySense => ({ nest, num: null, gloss, header: true });
const sense = (nest: string | null, num: string | null, gloss: string): DictionarySense => ({
  nest,
  num,
  gloss,
});

describe("articleNests", () => {
  it("keeps a flat article as one nest without a heading", () => {
    expect(articleNests([sense(null, "1", "вкусный"), sense(null, "2", "легко есть")])).toEqual([
      {
        nest: null,
        heading: null,
        senses: [
          { num: "1", gloss: "вкусный" },
          { num: "2", gloss: "легко есть" },
        ],
      },
    ]);
  });

  it("turns header rows into nest headings, not senses", () => {
    const nests = articleNests([
      header("I", "гл. dǎ"),
      sense("I", "1", "бить, ударять"),
      sense("I", "2", "играть"),
      header("II", "сущ. dá"),
      sense("II", null, "дюжина"),
    ]);

    expect(nests).toEqual([
      {
        nest: "I",
        heading: "гл. dǎ",
        senses: [
          { num: "1", gloss: "бить, ударять" },
          { num: "2", gloss: "играть" },
        ],
      },
      { nest: "II", heading: "сущ. dá", senses: [{ num: null, gloss: "дюжина" }] },
    ]);
  });

  it("accepts the string form of the header flag", () => {
    const nests = articleNests([{ nest: "I", num: null, gloss: "piányi", header: "true" }]);
    expect(nests).toEqual([{ nest: "I", heading: "piányi", senses: [] }]);
  });

  it("keeps article order when a nest letter repeats later", () => {
    const nests = articleNests([sense("I", "1", "а"), sense("II", "1", "б"), sense("I", "2", "в")]);
    expect(nests.map((n) => n.nest)).toEqual(["I", "II", "I"]);
  });

  it("returns no nests for an empty article", () => {
    expect(articleNests([])).toEqual([]);
  });
});

describe("entrySummary", () => {
  it("joins the first three compact senses", () => {
    expect(entrySummary({ compact: ["а", "б", "в", "г"], senses: [] })).toBe("а; б; в");
  });

  it("falls back to the first non-header sense when compact is empty", () => {
    expect(
      entrySummary({ compact: [], senses: [header("I", "гл. dǎ"), sense("I", "1", "бить")] }),
    ).toBe("бить");
  });
});
