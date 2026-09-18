import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./Text";
import { Mascot } from "./Mascot";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";

const DOT_COUNT = 3;
const DOT_STEP_MS = 200;
const DOT_CYCLE_MS = 600;

/**
 * One dot of the loading rhythm. Its own component so each instance owns
 * exactly one `useAnimatedStyle` call — the same rule-of-hooks constraint
 * `Mascot`'s `Sparkle` exists for.
 *
 * A rhythm rather than a spinner arc: an arc implies a measurable percentage,
 * and nothing here knows one.
 */
function LoadingDot({ index }: { index: number }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withDelay(
      index * DOT_STEP_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DOT_CYCLE_MS / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: DOT_CYCLE_MS / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, reducedMotion, pulse]);

  // Floor at 0.35 rather than 0 — a dot that vanishes entirely reads as a
  // missing element, and with reduced motion on, the static row still needs
  // three visible dots.
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.65 }));

  // The Animated.View carries only the opacity; the dot itself is a plain
  // View. NativeWind does not apply `className` to Reanimated's components,
  // so classes put directly on `Animated.View` are dropped — including the
  // width and height, which makes the element vanish rather than fail loudly.
  return (
    <Animated.View style={style}>
      <View className="h-2 w-2 rounded-pill bg-primary dark:bg-primary-dark" />
    </Animated.View>
  );
}

export interface LoadingStateProps {
  /** Human-readable explanation of what is happening, e.g. "Analyzing your goal…" */
  message: string;
  /** Optional second line under `message`, muted tone — e.g. which phase, or which file. Same live region as `message`, so a change here is announced too. */
  detail?: string;
  className?: string;
}

export function LoadingState({ message, detail, className = "" }: LoadingStateProps) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`items-center justify-center gap-md bg-background p-lg dark:bg-background-dark ${className}`}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Mascot stage={1} mood="thinking" size="medium" showStage={false} />
      </View>

      <View className="flex-row gap-xs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <LoadingDot key={i} index={i} />
        ))}
      </View>

      <View className="items-center gap-xs">
        <Text variant="body" className="text-center font-semibold">
          {message}
        </Text>
        {detail ? (
          <Text variant="body" tone="muted" className="text-center">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
