import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import "./animated";

export interface PortionDotsProps {
  /** 1-based index of the portion in progress. */
  index: number;
  count: number;
  className?: string;
}

function CurrentDot() {
  const pulse = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, pulse]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={style} className="h-2 w-2 rounded-pill bg-primary dark:bg-primary-dark" />
  );
}

/**
 * DS9 (today-session.design.md §9): the pause screen's portion tracker —
 * done portions solid, the current one pulses, the rest are outlined.
 * Always `aria-hidden`: the same information is already in the eyebrow text
 * ("Порция 2 из 4"), per V.1 п.4 ("движение никогда не единственный
 * носитель смысла").
 */
export function PortionDots({ index, count, className = "" }: PortionDotsProps) {
  return (
    <View aria-hidden className={`flex-row items-center gap-xs ${className}`}>
      {Array.from({ length: count }, (_, i) => i + 1).map((portion) => {
        if (portion < index) {
          return <View key={portion} className="h-2 w-2 rounded-pill bg-primary dark:bg-primary-dark" />;
        }
        if (portion === index) {
          return <CurrentDot key={portion} />;
        }
        return (
          <View
            key={portion}
            className="h-2 w-2 rounded-pill border border-border bg-transparent dark:border-border-dark"
          />
        );
      })}
    </View>
  );
}
