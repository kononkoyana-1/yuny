import type { ReactNode } from "react";
import { Pressable } from "react-native";
import type { LinkRowProps } from "./linkRow";

/**
 * `SettingsRow`'s platform-specific tap surface, web implementation.
 *
 * A real `<a href target="_blank" rel="noopener noreferrer">` when `href` is
 * set (settings.design.md §3.6, Acceptance 14) — a `Pressable` with
 * `role="link"` only fakes the role; it gives none of a real anchor's
 * behaviour (status-bar URL preview, "open in new tab", middle-click,
 * "copy link address", crawlers). `react-native-web` forwards `className`
 * straight to the DOM node the same way it forwards `aria-*`
 * (`shared/platform/sheetA11y.web.ts`), and Tailwind's compiled stylesheet
 * matches class *names*, not the element that carries them — so the plain
 * `<a>` below picks up the same classes a `Pressable` would.
 *
 * No `href` (role `"button"`, or a `"link"` row whose URL isn't known yet —
 * settings.design.md §3.6's `hsk2` source before Open Question 1 is
 * answered) falls back to an ordinary `Pressable`.
 */
export function LinkRow({
  href,
  accessibilityLabel,
  className,
  children,
  onPress,
  ...props
}: LinkRowProps) {
  if (!href) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        className={className}
        onPress={onPress}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibilityLabel}
      className={className}
    >
      {children as ReactNode}
    </a>
  );
}
