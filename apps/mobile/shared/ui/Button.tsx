import type { Ref } from "react";
import {
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";
import { gradients } from "@/shared/config/tokens";
import { linearGradient } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";
import { usePressScale } from "@/shared/lib/usePressScale";
import { Text, type TextTone } from "./Text";
import { AnimatedPressable } from "./animated";
import { FOCUS_RING_CLASS } from "./focusRing";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "hero";

const CONTAINER_CLASS: Record<ButtonVariant, string> = {
  // `primary` paints itself with a gradient below; the solid class is the
  // fallback that shows if the gradient style is ever dropped.
  primary: "bg-primary dark:bg-primary-dark",
  secondary:
    "bg-primary-soft dark:bg-primary-soft-dark border border-primary dark:border-primary-dark",
  ghost: "bg-transparent",
  /**
   * S4 (settings.design.md §9): flat `destructive` fill, no gradient — the
   * spec calls out "без градиента" explicitly so this destructive action
   * never reads as the screen's primary one (§1, "один акцент на экране").
   */
  destructive: "bg-destructive dark:bg-destructive-dark",
  /** DS2 (today-session.design.md §9): `HeroButton` — inverse fill on `gradients.hero`. */
  hero: "bg-hero-action dark:bg-hero-action-dark",
};

/** Label colour goes through `Text`'s `tone` — a `text-*` className loses to the default tone's class. */
const LABEL_TONE: Record<ButtonVariant, TextTone> = {
  primary: "inverse",
  secondary: "brand",
  ghost: "brand",
  destructive: "inverse",
  hero: "heroActionInk",
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
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { scheme } = useTheme();
  // DS2 (today-session.design.md §9): `HeroButton`'s `motion.pressScale`
  // squeeze — the one variant #65 asks for it on. `usePressScale` is called
  // unconditionally (rules of hooks); its style is only applied below.
  const { style: pressStyle, onPressIn: startPressScale, onPressOut: endPressScale } = usePressScale();
  const isHero = variant === "hero";

  /**
   * Both stops clear WCAG AA against the white label; see `gradients` in
   * `shared/config/tokens.ts` for why they are darker than the reference's.
   *
   * The per-platform mechanics live in `shared/platform/gradient` — native
   * and web need different style keys, and getting that wrong silently drops
   * the gradient on one target (it did, on web, before this split existed).
   */
  const [from, to] = scheme === "dark" ? gradients.primaryDark : gradients.primary;
  // `destructive` (S4) paints flat, so only `primary` computes a gradient.
  const gradientStyle = variant === "primary" ? linearGradient(from, to) : null;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`min-h-[56px] items-center justify-center rounded-pill px-lg py-md ${CONTAINER_CLASS[variant]} ${FOCUS_RING_CLASS} ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={[gradientStyle, isHero ? pressStyle : null, style]}
      onPressIn={(e) => {
        if (isHero) startPressScale();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (isHero) endPressScale();
        onPressOut?.(e);
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text variant="heading" tone={LABEL_TONE[variant]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
