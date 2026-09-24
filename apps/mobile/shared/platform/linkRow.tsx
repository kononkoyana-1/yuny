import { Pressable, type PressableProps } from "react-native";

/**
 * `SettingsRow`'s platform-specific tap surface, native implementation.
 *
 * Split the same way `shared/platform/gradient.{ts,web.ts}` is (TZ.md §4:
 * no `Platform.OS` in `shared/ui/`, `features/`, or `app/`) — the only thing
 * that differs by platform here is *which host element* renders a link
 * (`<a>` on web, `Linking.openURL` from a `Pressable` on native); the row's
 * own content and styling stay in `SettingsRow.tsx`.
 */
export interface LinkRowProps extends PressableProps {
  /**
   * Present only so the two platform files share one prop type; native has
   * no separate anchor element, so `SettingsRow` supplies its own `onPress`
   * that calls `Linking.openURL` and this prop goes unused here.
   */
  href?: string | null;
}

export function LinkRow({ href: _href, ...props }: LinkRowProps) {
  return <Pressable {...props} />;
}
