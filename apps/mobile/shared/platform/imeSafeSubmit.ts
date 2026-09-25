/**
 * DS-E6 (exercise.design.md §9), native implementation.
 *
 * IME composition is a DOM `keydown` concept (`keyCode 229` / `nativeEvent
 * .isComposing`) — native `TextInput` has no such native event shape, so
 * this side always reports "not composing".
 */
export function isImeComposing(_event: unknown): boolean {
  return false;
}
