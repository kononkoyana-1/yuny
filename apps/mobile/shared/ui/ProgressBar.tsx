import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

export interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  className?: string;
  accessibilityLabel?: string;
}

export function ProgressBar({
  progress,
  className = "",
  accessibilityLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 300 });
  }, [clamped, width]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      className={`h-2 overflow-hidden rounded-pill bg-surface-alt dark:bg-surface-alt-dark ${className}`}
    >
      <Animated.View
        style={style}
        className="h-full rounded-pill bg-primary dark:bg-primary-dark"
      />
    </View>
  );
}
