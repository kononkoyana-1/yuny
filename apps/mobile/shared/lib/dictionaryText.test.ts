import { describe, expect, it } from "@jest/globals";
import { hasHanzi, pinyinCanonical, pinyinWithMarks } from "./dictionaryText";

describe("pinyinWithMarks", () => {
  it("ставит знак тона по цифре", () => {
    expect(pinyinWithMarks("mai3")).toBe("mǎi");
    expect(pinyinWithMarks("lv4")).toBe("lǜ");
    expect(pinyinWithMarks("nü3")).toBe("nǚ");
    expect(pinyinWithMarks("lu:e4")).toBe("lüè");
  });

  it("лёгкий тон и слог без цифры — без знака", () => {
    expect(pinyinWithMarks("ma5")).toBe("ma");
    expect(pinyinWithMarks("ma")).toBe("ma");
  });

  it("правило a/e, ou и последней гласной", () => {
    expect(pinyinWithMarks("hao3")).toBe("hǎo");
    expect(pinyinWithMarks("dou1")).toBe("dōu");
    expect(pinyinWithMarks("gui4")).toBe("guì");
    expect(pinyinWithMarks("liu2")).toBe("liú");
  });

  it("несколько слогов", () => {
    expect(pinyinWithMarks("ni3hao3")).toBe("nǐhǎo");
    expect(pinyinWithMarks("ni3 hao3")).toBe("nǐ hǎo");
  });
});

describe("pinyinCanonical", () => {
  it("знаки и цифры сравнимы", () => {
    expect(pinyinCanonical("mǎi")).toBe(pinyinCanonical("mai3"));
    expect(pinyinCanonical("MAI3")).toBe("mai|3");
    expect(pinyinCanonical("lǜ")).toBe(pinyinCanonical("lv4"));
    expect(pinyinCanonical("nü3")).toBe("nv|3");
    expect(pinyinCanonical("ma5")).toBe(pinyinCanonical("ma"));
    expect(pinyinCanonical("mai4")).not.toBe(pinyinCanonical("mai3"));
  });
});

describe("hasHanzi", () => {
  it("замечает иероглифы", () => {
    expect(hasHanzi("买")).toBe(true);
    expect(hasHanzi("mai3")).toBe(false);
  });
});
