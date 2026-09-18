import { AccessibilityInfo, findNodeHandle, type View } from "react-native";
import type { RefObject } from "react";

/**
 * `Sheet`'s platform-specific accessibility mechanics, native implementation.
 *
 * Split from `Sheet.tsx` the same way `shared/platform/gradient.{ts,web.ts}`
 * is split from `Button`/`AtmosphericBackground` — TZ.md §17 keeps
 * `Platform.OS` out of `shared/ui/`, `features/`, and `app/`, so the branch
 * lives here as two files with identical exports instead.
 */

/** Props spread onto the panel `View` so iOS/Android treat it as a modal. */
export function sheetPanelA11yProps(accessibilityLabel: string) {
  return {
    accessibilityViewIsModal: true,
    accessibilityLabel,
  } as const;
}

/** Moves assistive-tech focus into the panel once it has mounted. */
export function focusSheetPanel(ref: RefObject<View | null>) {
  const node = ref.current ? findNodeHandle(ref.current) : null;
  if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
}

/** Returns assistive-tech focus to the element that opened the sheet. */
export function returnFocusTo(ref: RefObject<View | null> | undefined) {
  const node = ref?.current ? findNodeHandle(ref.current) : null;
  if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
}

/**
 * Native handles "back" through `Modal`'s own `onRequestClose` (Android
 * hardware/gesture back). No extra listener needed, so this is a no-op that
 * still returns an unsubscribe function for a uniform call site.
 */
export function attachEscapeListener(_onClose: () => void): () => void {
  return () => {};
}
