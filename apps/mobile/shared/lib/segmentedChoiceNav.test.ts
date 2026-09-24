import { describe, expect, it } from "@jest/globals";
import { isSegmentedChoiceKey, nextSegmentedIndex } from "./segmentedChoiceNav";

describe("nextSegmentedIndex", () => {
  it("moves right/down to the next option", () => {
    expect(nextSegmentedIndex(0, 3, "ArrowRight")).toBe(1);
    expect(nextSegmentedIndex(0, 3, "ArrowDown")).toBe(1);
  });

  it("moves left/up to the previous option", () => {
    expect(nextSegmentedIndex(1, 3, "ArrowLeft")).toBe(0);
    expect(nextSegmentedIndex(1, 3, "ArrowUp")).toBe(0);
  });

  it("wraps past the last option", () => {
    expect(nextSegmentedIndex(2, 3, "ArrowRight")).toBe(0);
  });

  it("wraps past the first option", () => {
    expect(nextSegmentedIndex(0, 3, "ArrowLeft")).toBe(2);
  });

  it("Home jumps to the first option, End to the last", () => {
    expect(nextSegmentedIndex(1, 4, "Home")).toBe(0);
    expect(nextSegmentedIndex(1, 4, "End")).toBe(3);
  });

  it("ignores keys the group doesn't handle", () => {
    expect(nextSegmentedIndex(0, 3, "Enter")).toBeNull();
    expect(nextSegmentedIndex(0, 3, " ")).toBeNull();
  });

  it("returns null for an empty group", () => {
    expect(nextSegmentedIndex(0, 0, "ArrowRight")).toBeNull();
  });
});

describe("isSegmentedChoiceKey", () => {
  it("accepts the six navigation keys", () => {
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]) {
      expect(isSegmentedChoiceKey(key)).toBe(true);
    }
  });

  it("rejects everything else", () => {
    expect(isSegmentedChoiceKey("Enter")).toBe(false);
    expect(isSegmentedChoiceKey("a")).toBe(false);
  });
});
