import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * Moves keyboard focus to a ref'd element, web implementation.
 *
 * `react-native-web` forwards a `View` ref to its underlying DOM node
 * (confirmed for the same pattern in `shared/platform/sheetA11y.web.ts`), so
 * a plain `.focus()` call works directly.
 */
export function focusRef(ref: RefObject<View | null>): void {
  (ref.current as unknown as HTMLElement | null)?.focus();
}
