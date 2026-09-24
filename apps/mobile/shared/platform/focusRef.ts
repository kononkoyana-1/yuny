import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * Moves keyboard focus to a ref'd element, native implementation.
 *
 * A no-op: `SegmentedChoice`'s roving tabindex (S7) exists for keyboard
 * users, and touch-only iOS/Android has no keyboard focus to move
 * programmatically — VoiceOver/TalkBack navigate by swipe, following
 * `accessibilityRole`/`aria-checked`, not `tabIndex`.
 */
export function focusRef(_ref: RefObject<View | null>): void {}
