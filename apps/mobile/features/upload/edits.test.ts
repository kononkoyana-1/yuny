import { describe, expect, it } from "@jest/globals";
import type { ExtractedWord } from "@yuny/shared";
import { MAX_TRANSLATION, applyEdits, cleanTranslation, savedSource } from "./edits";

const words: ExtractedWord[] = [
  { word: "买", reading: "mǎi", translation: "покупать", source: "dictionary", entry_id: 1 },
  { word: "网红", reading: "wǎnghóng", translation: "блогер", source: "ai", entry_id: null },
];

describe("applyEdits", () => {
  it("replaces the translation and marks the word as edited", () => {
    const [buy, blogger] = applyEdits(words, new Map([["买", "купить"]]));
    expect(buy).toMatchObject({ translation: "купить", edited: true });
    expect(savedSource(buy)).toBe("user");
    expect(blogger).toMatchObject({ translation: "блогер", edited: false });
    expect(savedSource(blogger)).toBe("ai");
  });

  it("treats an edit equal to the original as no edit", () => {
    const [buy] = applyEdits(words, new Map([["买", "покупать"]]));
    expect(buy.edited).toBe(false);
    expect(savedSource(buy)).toBe("dictionary");
  });
});

describe("cleanTranslation", () => {
  it("trims and collapses spaces", () => {
    expect(cleanTranslation("  купить,   покупать ")).toBe("купить, покупать");
  });

  it("is null when nothing is left", () => {
    expect(cleanTranslation("   ")).toBeNull();
  });

  it("fits the column", () => {
    expect(cleanTranslation("я".repeat(400))).toHaveLength(MAX_TRANSLATION);
  });
});
