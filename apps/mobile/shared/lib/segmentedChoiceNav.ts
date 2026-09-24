/**
 * Pure arrow/Home/End navigation for `SegmentedChoice` (S7,
 * settings.design.md §9 / today-session.design.md DS4): WAI-ARIA
 * `radiogroup` moves *and selects* on arrow keys, wraps at the ends, and
 * Home/End jump to the first/last option. Split out from the component so
 * the logic can be unit-tested without rendering (`react-test-renderer` /
 * jsdom) — see `segmentedChoiceNav.test.ts`.
 */
export type SegmentedChoiceKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

const KEYS: ReadonlySet<string> = new Set<SegmentedChoiceKey>([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

export function isSegmentedChoiceKey(key: string): key is SegmentedChoiceKey {
  return KEYS.has(key);
}

/**
 * `current` is the index the key press originates from (the option
 * currently focused). Returns the index to select and move focus to, or
 * `null` for a key this group doesn't handle (the caller should let it
 * propagate normally).
 *
 * ←/↑ move to the previous option, →/↓ to the next, both wrapping around
 * the ends — the same behaviour as a native `<input type="radio">` group.
 */
export function nextSegmentedIndex(
  current: number,
  count: number,
  key: string,
): number | null {
  if (count <= 0 || !isSegmentedChoiceKey(key)) return null;

  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return (current - 1 + count) % count;
    case "ArrowRight":
    case "ArrowDown":
      return (current + 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
