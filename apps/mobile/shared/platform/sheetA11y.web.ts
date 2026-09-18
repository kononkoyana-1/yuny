import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * `Sheet`'s platform-specific accessibility mechanics, web implementation —
 * see `sheetA11y.ts` for why this file exists.
 *
 * `react-native-web` 0.21 forwards `role`/`aria-*` straight to the DOM node
 * (confirmed for `Mascot`'s `aria-hidden`, `node_modules/react-native-web/
 * dist/modules/createDOMProps`), and forwards a `View` ref to the underlying
 * DOM element, so plain DOM APIs (`.focus()`, `document.addEventListener`)
 * work directly here.
 *
 * No `role="dialog"` here: `Modal`'s own DOM wrapper already gets
 * `role="dialog"`/`aria-modal` from react-native-web (`ModalContent.js`),
 * and `Sheet` now names that outer dialog directly via the `Modal`'s own
 * `accessibilityLabel`. A second, nested `role="dialog"` on this panel
 * would produce two dialog roles for one sheet, which is an invalid ARIA
 * tree (home.review.md B1's second half). `aria-label` stays here anyway —
 * harmless without a landmark role, and gives the panel a spoken name if
 * focus ever lands on it directly.
 */

/** Props spread onto the panel `View`; `tabIndex` makes it a focus target. */
export function sheetPanelA11yProps(accessibilityLabel: string) {
  return {
    "aria-label": accessibilityLabel,
    tabIndex: -1,
  } as const;
}

function asElement(ref: RefObject<View | null> | undefined): HTMLElement | null {
  return (ref?.current as unknown as HTMLElement | null) ?? null;
}

/** Moves DOM focus into the panel once it has mounted. */
export function focusSheetPanel(ref: RefObject<View | null>) {
  asElement(ref)?.focus();
}

/** Returns DOM focus to the element that opened the sheet. */
export function returnFocusTo(ref: RefObject<View | null> | undefined) {
  asElement(ref)?.focus();
}

/**
 * The web `Modal` polyfill does not call `onRequestClose` on Escape by
 * itself, so this listens for it directly. Returns an unsubscribe function;
 * `Sheet` calls it in the same effect's cleanup.
 */
export function attachEscapeListener(onClose: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = (event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
