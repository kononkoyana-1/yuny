import { describe, expect, it } from "@jest/globals";
import type { Exercise } from "@yuny/shared";
import { voiceText } from "./voice";

const ex = (code: Exercise["code"], over: Partial<Exercise> = {}): Exercise => ({
  task_id: code,
  code,
  lexeme: { headword: "衣服", reading: "yīfu", tone_label: null, translation: "одежда" },
  is_retry: false,
  is_check: false,
  portion: 0,
  ...over,
});

describe("voiceText", () => {
  it("до ответа — только где чтение не проверяется", () => {
    expect(voiceText(ex("R1"), false)).toBe("衣服");
    expect(voiceText(ex("W1"), false)).toBe("衣服");
    for (const code of ["R2", "P1", "P2", "W2", "C1", "C2"] as const) expect(voiceText(ex(code), false)).toBeNull();
  });

  it("после ответа — слово, а в предложениях всё предложение", () => {
    expect(voiceText(ex("P2"), true)).toBe("衣服");
    const c1 = ex("C1", {
      sentence: { tokens: ["我", "想", "", "咖啡", "。"], blank_index: 2, ru: "" },
      options: [{ id: "o0", text: "买", kind: "hanzi", a11y: "买" }],
      key: { option_id: "o0" },
    });
    expect(voiceText(c1, true)).toBe("我想买咖啡。");
    expect(voiceText(ex("C2", { key: { tokens: ["这个", "太", "贵", "了"] } }), true)).toBe("这个太贵了");
  });

  it("знакомство и пара — не здесь", () => {
    expect(voiceText(ex("intro"), true)).toBeNull();
    expect(voiceText(ex("pair_card"), true)).toBeNull();
  });
});
