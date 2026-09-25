import { describe, expect, it } from "@jest/globals";
import { isPhraseQuery } from "./phrase";

const item = (headword: string, ...compact: string[]) => ({ headword, compact });

describe("isPhraseQuery", () => {
  it("китайский: длинное, с пунктуацией или без точной статьи — фраза", () => {
    expect(isPhraseQuery("我想买咖啡", [])).toBe(true);
    expect(isPhraseQuery("买吗？", [item("买", "покупать")])).toBe(true);
    expect(isPhraseQuery("别跑", [item("别", "не надо")])).toBe(true);
    expect(isPhraseQuery("咖啡", [item("咖啡", "кофе")])).toBe(false);
  });

  it("русский: одно слово — не фраза; два — фраза, если значения нет в словаре", () => {
    expect(isPhraseQuery("кофе", [])).toBe(false);
    expect(isPhraseQuery("хочу купить кофе", [])).toBe(true);
    expect(isPhraseQuery("звонить по телефону", [item("打电话", "звонить по телефону")])).toBe(false);
    expect(isPhraseQuery("Сколько стоит?", [item("多少钱", "сколько стоит")])).toBe(false);
  });

  it("пиньинь и пустое — не фраза", () => {
    expect(isPhraseQuery("mai dongxi", [])).toBe(false);
    expect(isPhraseQuery("  ", [])).toBe(false);
  });
});
