import type { Ref } from "react";
import {
  Pressable,
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";
import { gradients } from "@/shared/config/tokens";
import { linearGradient } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const CONTAINER_CLASS: Record<ButtonVariant, string> = {
  // `primary` paints itself with a gradient below; the solid class is the
  // fallback that shows if the gradient style is ever dropped.
  primary: "bg-primary dark:bg-primary-dark",
  secondary:
    "bg-primary-soft dark:bg-primary-soft-dark border border-primary dark:border-primary-dark",
  ghost: "bg-transparent",
};

const LABEL_TONE_CLASS: Record<ButtonVariant, string> = {
  primary: "text-text-inverse dark:text-text-inverse-dark",
  secondary: "text-primary dark:text-primary-dark",
  ghost: "text-primary dark:text-primary-dark",
};

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  /**
   * Narrower than `Pressable`'s own `style`, which also accepts a function of
   * press state. NativeWind's wrapper silently drops the function form, and
   * with it the gradient underneath — so the type rules it out rather than
   * letting it fail at runtime on one platform.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Reaches the `Pressable` through `...props` — in React 19 `ref` is an
   * ordinary prop of a function component. Lets a `Sheet` return focus to the
   * button that opened it.
   */
  ref?: Ref<View>;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { scheme } = useTheme();

  /**
   * Both stops clear WCAG AA against the white label; see `gradients` in
   * `shared/config/tokens.ts` for why they are darker than the reference's.
   *
   * The per-platform mechanics live in `shared/platform/gradient` — native
   * and web need different style keys, and getting that wrong silently drops
   * the gradient on one target (it did, on web, before this split existed).
   */
  const [from, to] = scheme === "dark" ? gradients.primaryDark : gradients.primary;
  const gradientStyle = variant === "primary" ? linearGradient(from, to) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`min-h-[56px] items-center justify-center rounded-pill px-lg py-md ${CONTAINER_CLASS[variant]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={[gradientStyle, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text variant="heading" className={LABEL_TONE_CLASS[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
