import { describe, expect, it } from "@jest/globals";
import type { CharWord } from "@yuny/shared";
import { graphSides } from "./charGraph";

const word = (headword: string, position: CharWord["position"]): CharWord => ({
  headword,
  reading: null,
  meaning: null,
  hsk_level: null,
  position,
  mine: false,
  stage: null,
});

describe("graphSides", () => {
  it("puts words ending with the character on the left, the rest on the right", () => {
    const { left, right, rest } = graphSides([word("好看", "end"), word("看书", "start"), word("看不起", "start")]);
    expect(left.map((w) => w.headword)).toEqual(["好看"]);
    expect(right.map((w) => w.headword)).toEqual(["看书", "看不起"]);
    expect(rest).toEqual([]);
  });

  it("keeps the server order and sends the tail beyond the rays to the list", () => {
    const words = ["一", "二", "三", "四"].map((c, i) => word(`看${c}`, i % 2 ? "end" : "start"));
    const { left, right, rest } = graphSides(words, 3);
    expect(right.map((w) => w.headword)).toEqual(["看一", "看三"]);
    expect(left.map((w) => w.headword)).toEqual(["看二"]);
    expect(rest.map((w) => w.headword)).toEqual(["看四"]);
  });
});
