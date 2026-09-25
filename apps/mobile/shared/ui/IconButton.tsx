import { useState, type Ref } from "react";
import { Pressable, type PressableProps, type View } from "react-native";
import { Icon, type IconName } from "./Icon";
import { useTheme } from "@/shared/lib/useTheme";

export interface IconButtonProps extends Omit<PressableProps, "children" | "accessibilityLabel"> {
  icon: IconName;
  /** Required, not optional — this is a bare icon with no visible caption, so it is the only source of an accessible name. */
  accessibilityLabel: string;
  disabled?: boolean;
  className?: string;
  /** Для возврата фокуса сюда, когда закроется открытый ею лист (React 19: `ref` — обычный проп). */
  ref?: Ref<View>;
}

/**
 * A bare icon action (e.g. remove a file row) with a tap target padded out
 * to 44×44 regardless of the 20px glyph inside it — the visible icon can
 * stay small without shrinking the touch area under it.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  disabled,
  className = "",
  ...props
}: IconButtonProps) {
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
      className={`min-h-tap min-w-tap items-center justify-center rounded-pill ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : ""
      } ${disabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      <Icon name={icon} size={20} color={pressed ? colors.text : colors.textMuted} />
    </Pressable>
  );
}
