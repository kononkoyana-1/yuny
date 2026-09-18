import { describe, expect, it } from "@jest/globals";
import { coverText } from "./coverText";

/**
 * home.design.md §3 / Acceptance #11: the first grapheme of `title.trim()`,
 * upper-cased with `toLocaleUpperCase("ru")`.
 *
 * The spec's Acceptance #11 also names a "cover_text не null" case, but that
 * branch never calls `coverText()` at all — `ModuleCircle` renders the
 * server's `cover_text` verbatim in that case (§3: "при null — результат
 * coverText()"). There is nothing for this pure function to assert there;
 * flagged in the handoff rather than faked here.
 */
describe("coverText", () => {
  it("upper-cases a Cyrillic title's first letter", () => {
    expect(coverText("привет")).toBe("П");
  });

  it("trims leading whitespace before taking the first grapheme", () => {
    expect(coverText("   погода")).toBe("П");
  });

  it("takes the first CJK character without upper-casing it", () => {
    // `toLocaleUpperCase` is a no-op on CJK — 你 has no case to change.
    expect(coverText("你好")).toBe("你");
  });

  it("upper-cases a Latin title's first letter", () => {
    expect(coverText("hello")).toBe("H");
  });
});
