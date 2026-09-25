import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import { gradients } from "@/shared/config/tokens";
import { linearGradient } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";
import { usePressScale } from "@/shared/lib/usePressScale";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { FOCUS_RING_CLASS } from "./focusRing";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface StudyButtonProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to `"{{title}}. {{subtitle}}"` — pass to override. */
  accessibilityLabel?: string;
  className?: string;
}

/**
 * DS-S1 (folder-study.design.md §8): the folder screen's main two-line
 * action ("Повторить · 26" / "~10 минут · только эта папка") — same
 * `gradients.primary` + `radius.hero` + `elevation.glow` treatment as
 * `HeroCard`, `sizing.studyButton` tall. `loading` swaps both lines for a
 * shimmer placeholder rather than an `ActivityIndicator`, since the button
 * keeps its full two-line footprint while the folder's plan loads.
 */
export function StudyButton({
  icon,
  title,
  subtitle,
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  className = "",
}: StudyButtonProps) {
  const { scheme, colors } = useTheme();
  const { style, onPressIn, onPressOut } = usePressScale();
  const [from, to] = scheme === "dark" ? gradients.primaryDark : gradients.primary;
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[linearGradient(from, to), style]}
      className={`h-study-button w-full flex-row items-center gap-md rounded-hero px-lg shadow-glow dark:shadow-glow-dark ${
        isDisabled ? "opacity-50" : ""
      } ${FOCUS_RING_CLASS} ${className}`}
    >
      <Icon name={icon} size={24} color={colors.textInverse} />
      <View className="flex-1">
        {loading ? (
          <View aria-hidden className="h-4 w-2/3 rounded-sm bg-text-inverse/20 dark:bg-text-inverse-dark/20" />
        ) : (
          <>
            <Text variant="heading" tone="inverse">
              {title}
            </Text>
            <Text variant="caption" className="text-text-inverse/80 dark:text-text-inverse-dark/80">
              {subtitle}
            </Text>
          </>
        )}
      </View>
      <Icon name="arrowRight" size={20} color={colors.textInverse} />
    </AnimatedPressable>
  );
}
