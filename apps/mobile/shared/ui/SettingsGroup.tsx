import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { Text } from "./Text";

export interface SettingsGroupProps {
  title: string;
  lead?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

/**
 * S1 (settings.design.md §9): one named section of the settings screen —
 * "Профиль", "Повторения", etc. Renders its `title` as a level-2 heading
 * above a `Card`, and lays a hairline divider between each direct child
 * (never above the first), so a caller just lists rows/blocks as children
 * without managing separators itself.
 *
 * `typography.eyebrow` is a #65 token not yet in `tokens.ts` — settings.design.md
 * §V-F's replacement is used instead until it lands.
 */
export function SettingsGroup({ title, lead, footer, children, className = "" }: SettingsGroupProps) {
  const items = Children.toArray(children);

  return (
    <View className={className}>
      <Text
        variant="eyebrow"
        tone="muted"
        accessibilityRole="header"
        className="mb-xs px-md uppercase"
        // react-native's AccessibilityProps has no `aria-level` (checked
        // node_modules/react-native/Libraries/Components/View/ViewAccessibility.d.ts);
        // cast is the same escape hatch `features/dictionary/CheckMark.tsx`
        // uses for web-only ARIA attributes RN's own types don't carry.
        {...({ "aria-level": 2 } as object)}
      >
        {title}
      </Text>

      {lead ? (
        <Text variant="caption" tone="muted" className="mb-sm px-md">
          {lead}
        </Text>
      ) : null}

      <Card className="p-0">
        {items.map((child, index) => (
          <View key={index}>
            {index > 0 ? (
              <View
                className="ml-md border-t border-border dark:border-border-dark"
                style={{ borderTopWidth: StyleSheet.hairlineWidth }}
              />
            ) : null}
            {child}
          </View>
        ))}
      </Card>

      {footer ? (
        <Text variant="caption" tone="muted" className="mt-sm px-md">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export interface SettingBlockProps {
  label: string;
  /** Rendered inline, right of `label` — typically `<SaveStatus layout="inline" .../>`. */
  status?: ReactNode;
  hint?: string;
  /**
   * `nativeID` put on the rendered hint, so a control inside `children`
   * (e.g. `SegmentedChoice`'s `aria-describedby`) can point at it.
   */
  hintId?: string;
  /** The block's control — e.g. a `SegmentedChoice`. */
  children: ReactNode;
  /**
   * Rendered below the hint. Not in settings.design.md §9's terse S1 prop
   * table, but §3.4's own layout mockup puts the error line
   * (`SaveStatus state="error" layout="block"`) *after* the hint text, one
   * row per block — a slot `children` can't produce that ordering without
   * one. Optional and additive: omitting it reproduces the table exactly.
   */
  footer?: ReactNode;
  className?: string;
}

/**
 * S1 (settings.design.md §9): one labelled control inside a `SettingsGroup`
 * card — "Время на повторение", "Тема", etc. `gap-sm` between the label
 * row, the control, and the hint; `md` padding all round.
 */
export function SettingBlock({
  label,
  status,
  hint,
  hintId,
  children,
  footer,
  className = "",
}: SettingBlockProps) {
  return (
    <View className={`gap-sm p-md ${className}`}>
      <View className="flex-row items-center gap-sm">
        <Text variant="heading" className="flex-1">
          {label}
        </Text>
        {status}
      </View>

      {children}

      {hint ? (
        <Text
          variant="caption"
          tone="muted"
          nativeID={hintId}
          // `nativeID` maps to DOM `id` under react-native-web, which is
          // exactly what `aria-describedby` needs to resolve on web.
        >
          {hint}
        </Text>
      ) : null}

      {footer}
    </View>
  );
}
