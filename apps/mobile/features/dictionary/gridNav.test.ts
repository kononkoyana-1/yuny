import { describe, expect, it } from "@jest/globals";
import { nextGridIndex } from "./gridNav";

// 7 плиток в 3 колонки:
//   0 1 2
//   3 4 5
//   6
describe("nextGridIndex", () => {
  it("moves by one along a row and by a row up and down", () => {
    expect(nextGridIndex(4, 7, 3, "ArrowLeft")).toBe(3);
    expect(nextGridIndex(4, 7, 3, "ArrowRight")).toBe(5);
    expect(nextGridIndex(4, 7, 3, "ArrowUp")).toBe(1);
    expect(nextGridIndex(1, 7, 3, "ArrowDown")).toBe(4);
  });

  it("stays put at the edges instead of wrapping", () => {
    expect(nextGridIndex(0, 7, 3, "ArrowLeft")).toBe(0);
    expect(nextGridIndex(6, 7, 3, "ArrowRight")).toBe(6);
    expect(nextGridIndex(2, 7, 3, "ArrowUp")).toBe(2);
    expect(nextGridIndex(6, 7, 3, "ArrowDown")).toBe(6);
  });

  it("drops onto the last tile when the last row is short", () => {
    expect(nextGridIndex(5, 7, 3, "ArrowDown")).toBe(6);
    expect(nextGridIndex(3, 7, 3, "ArrowDown")).toBe(6);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextGridIndex(4, 7, 3, "Home")).toBe(0);
    expect(nextGridIndex(4, 7, 3, "End")).toBe(6);
  });

  it("ignores other keys and an empty grid", () => {
    expect(nextGridIndex(4, 7, 3, "Enter")).toBeNull();
    expect(nextGridIndex(0, 0, 3, "ArrowDown")).toBeNull();
  });
});
