interface MaybeComposingEvent {
  nativeEvent?: { isComposing?: boolean; keyCode?: number };
}

/**
 * DS-E6 (exercise.design.md §9), web implementation. P2's pinyin field
 * (exercise.design.md §4.5) must not submit on the Enter that only
 * *confirms* a Chinese IME's candidate — `isComposing` is the modern
 * signal, `keyCode 229` the historical cross-browser one for the same
 * event (older Safari/Firefox still report only the code), so both are
 * checked.
 */
export function isImeComposing(event: MaybeComposingEvent): boolean {
  return Boolean(event?.nativeEvent?.isComposing || event?.nativeEvent?.keyCode === 229);
}
