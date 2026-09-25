import { View } from "react-native";
import { Text } from "./Text";

export interface KeyHintProps {
  /** The key's visible name, e.g. `"1"`. */
  keyLabel: string;
  className?: string;
}

/**
 * DS-E5 (exercise.design.md §9): the keyboard-shortcut badge in an
 * `OptionTile`'s corner, wide screen only (§3.2). Decorative — the shortcut
 * already works without being announced, and the option's own
 * `accessibilityLabel` names the option, not the key.
 */
export function KeyHint({ keyLabel, className = "" }: KeyHintProps) {
  return (
    <View
      aria-hidden
      className={`items-center justify-center rounded-sm bg-surface-alt px-xs py-[2px] dark:bg-surface-alt-dark ${className}`}
    >
      <Text variant="caption" tone="muted">
        {keyLabel}
      </Text>
    </View>
  );
}
