import { describe, expect, it } from "@jest/globals";
import { CharNoteSchema } from "@yuny/shared";
import { charNoteView } from "./charNote";

describe("заметка о знаке в знакомстве", () => {
  it("舒服: новый знак — чтение и значение", () => {
    const v = charNoteView({ char: "舒", reading: "shū", meaning: "вольготный", known_in: [] });
    expect([v.reading, v.meaning, v.known]).toEqual(["shū", "вольготный", []]);
    expect(v.a11y).toBe("舒, shū, вольготный. Новый знак");
  });

  it("舒服: знак из своих слов — слова с пиньинем, тоны знаками", () => {
    const v = charNoteView({
      char: "服",
      reading: "fu2",
      meaning: "одежда; подчиняться",
      known_in: [
        { headword: "衣服", reading: "yi1fu5" },
        { headword: "服务", reading: "fúwù" },
      ],
    });
    expect(v.reading).toBe("fú");
    expect(v.known).toEqual([
      { headword: "衣服", reading: "yīfu" },
      { headword: "服务", reading: "fúwù" },
    ]);
    expect(v.a11y).toBe("服, fú, одежда; подчиняться. Уже есть в ваших словах: 衣服 yīfu, 服务 fúwù");
  });

  it("два чтения: показывается то, что сервер выбрал для этого слова", () => {
    expect(charNoteView({ char: "好", reading: "hào", meaning: "любить", known_in: [] }).a11y).toBe(
      "好, hào, любить. Новый знак",
    );
  });

  it("статьи на знак нет — без значения", () => {
    const v = charNoteView({ char: "服", reading: "fu", meaning: null, known_in: [] });
    expect(v.meaning).toBeNull();
    expect(v.a11y).toBe("服, fu. Новый знак");
  });

  it("старая форма с сервера читается: слова строками, без чтения и значения", () => {
    const note = CharNoteSchema.parse({ char: "买", known_in: ["买东西"] });
    expect(charNoteView(note).a11y).toBe("买. Уже есть в ваших словах: 买东西");
  });
});
