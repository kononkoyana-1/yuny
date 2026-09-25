import { describe, expect, it } from "@jest/globals";
import { pickHanziHeroVariant } from "./hanziVariant";

describe("pickHanziHeroVariant", () => {
  it("stays 'hero' for 1 character", () => {
    expect(pickHanziHeroVariant("买")).toBe("hero");
  });

  it("stays 'hero' for 2 characters", () => {
    expect(pickHanziHeroVariant("买卖")).toBe("hero");
  });

  it("switches to 'heroLong' at 3 characters", () => {
    expect(pickHanziHeroVariant("便宜点")).toBe("heroLong");
  });

  it("switches to 'heroLong' for longer words", () => {
    expect(pickHanziHeroVariant("对不起了")).toBe("heroLong");
  });

  it("counts by code point, not UTF-16 unit", () => {
    // A rare character outside the BMP (surrogate pair) plus one more BMP
    // character must still read as length 2, not 3.
    expect(pickHanziHeroVariant("\u{20BB7}买")).toBe("hero");
  });

  it("treats an empty string as 'hero'", () => {
    expect(pickHanziHeroVariant("")).toBe("hero");
  });
});
