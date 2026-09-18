import { useState } from "react";
import { Pressable, type PressableProps } from "react-native";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { useTheme } from "@/shared/lib/useTheme";

export interface ActionTileProps extends Omit<PressableProps, "children" | "accessibilityLabel"> {
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Icon-over-caption tile for choosing between a small set of equal actions
 * (upload source: camera / gallery / files). `Button`'s 56px gradient pill
 * is a single primary call to action — three of them side by side would read
 * as three competing primaries, which is why this exists as its own
 * primitive rather than a `Button` variant.
 *
 * The icon is decorative (the visible `label` beside it already carries the
 * meaning); the accessible name comes from `accessibilityLabel` on the
 * `Pressable`, same split as the tab bar.
 */
export function ActionTile({
  icon,
  label,
  accessibilityLabel,
  disabled,
  className = "",
  ...props
}: ActionTileProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        props.onPressOut?.(e);
      }}
      className={`min-h-[44px] items-center justify-center gap-xs rounded-card bg-surface p-md shadow-md shadow-shadow/10 dark:border dark:border-border-dark dark:bg-surface-dark dark:shadow-none ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : ""
      } ${disabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      <Icon name={icon} size={24} color={colors.primary} />
      <Text variant="caption" className="text-center font-semibold">
        {label}
      </Text>
    </Pressable>
  );
}
