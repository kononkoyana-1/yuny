import { useEffect } from "react";
import { Image, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./Text";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";

export type MascotStage = 1 | 2 | 3 | 4 | 5;
export type MascotMood = "neutral" | "thinking" | "celebrating" | "resting";
export type MascotSize = "small" | "medium" | "large";

const SPRITES: Record<MascotMood, number> = {
  neutral: require("../../assets/mascot/neutral.png"),
  thinking: require("../../assets/mascot/thinking.png"),
  celebrating: require("../../assets/mascot/celebrating.png"),
  resting: require("../../assets/mascot/resting.png"),
};

const SIZE_PX: Record<MascotSize, number> = {
  small: 64,
  medium: 128,
  large: 220,
};

export interface MascotProps {
  stage: MascotStage;
  mood: MascotMood;
  size: MascotSize;
  /** 0..1, progress within the current stage. Omit to hide the indicator. */
  growthProgress?: number;
  className?: string;
}

export function Mascot({
  stage,
  mood,
  size,
  growthProgress,
  className = "",
}: MascotProps) {
  const reducedMotion = useReducedMotion();
  const dimension = SIZE_PX[size];

  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      floatY.value = 0;
      return;
    }
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, floatY]);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(0, { duration: 120 }, () => {
      opacity.value = withTiming(1, { duration: 200 });
    });
  }, [mood, reducedMotion, opacity]);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withSequence(
      withTiming(1.08, { duration: 180, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 220 }),
    );
  }, [stage, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Mascot, ${mood}, stage ${stage}`}
      className={`items-center ${className}`}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={SPRITES[mood]}
          style={{ width: dimension, height: dimension }}
          resizeMode="contain"
        />
      </Animated.View>

      <View className="mt-xs flex-row items-center gap-xs">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((s) => (
          <View
            key={s}
            className={`h-1.5 w-1.5 rounded-pill ${
              s <= stage
                ? "bg-primary dark:bg-primary-dark"
                : "bg-surface-alt dark:bg-surface-alt-dark"
            }`}
          />
        ))}
      </View>

      {typeof growthProgress === "number" ? (
        <Text variant="caption" tone="muted" className="mt-xs">
          {Math.round(Math.max(0, Math.min(1, growthProgress)) * 100)}%
        </Text>
      ) : null}
    </View>
  );
}
