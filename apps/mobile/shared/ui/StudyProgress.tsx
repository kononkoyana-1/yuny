import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { gradients, motion } from "@/shared/config/tokens";
import { linearGradient } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";
import "./animated";

export interface StudyProgressProps {
  done: number;
  total: number;
  /** e.g. "Задание 7 из 10" (§7 accessibility table). */
  accessibilityLabel: string;
  className?: string;
}

/**
 * DS-E3 (exercise.design.md §9): the exercise shell's thick progress bar —
 * `sizing.progressHeight`, `gradients.primary` fill, `radius.pill`. A
 * separate component from `ProgressBar` (not a size prop on it): that one's
 * fill is a flat `primary`, this one's is the gradient, and the two are
 * never used interchangeably per their specs.
 */
export function StudyProgress({ done, total, accessibilityLabel, className = "" }: StudyProgressProps) {
  const { scheme } = useTheme();
  const clamped = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: motion.base });
  }, [clamped, width]);

  const style = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  const [from, to] = scheme === "dark" ? gradients.primaryDark : gradients.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      {...({
        "aria-valuemin": 0,
        "aria-valuemax": total,
        "aria-valuenow": done,
      } as object)}
      className={`h-progress-height overflow-hidden rounded-pill bg-surface-alt dark:bg-surface-alt-dark ${className}`}
    >
      <Animated.View style={[style, linearGradient(from, to, "90deg")]} className="h-full rounded-pill" />
    </View>
  );
}
