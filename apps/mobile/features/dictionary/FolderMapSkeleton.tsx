import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { motion } from "@/shared/config/tokens";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { Text } from "@/shared/ui";

/** Столько серых плиток в скелете (folder-map.design.md §6) — три ряда по три. */
const TILE_COUNT = 9;
const TILE_ROWS = [0, 1, 2].map((row) =>
  Array.from({ length: TILE_COUNT / 3 }, (_, i) => row * 3 + i),
);

/**
 * Загрузка карты папки (folder-map.design.md §6): вместо `LoadingState` —
 * скелет экрана: полоска и 9 плиток `surfaceAlt`, которые мерцают
 * за `motion.slow` (при reduced motion — без мерцания). Для диктора — живая
 * область с `message` («Открываем папку»), на экране её не видно.
 */
export function FolderMapSkeleton({ message }: { message: string }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.set(0);
      return;
    }
    pulse.set(withRepeat(withTiming(1, { duration: motion.slow, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [reducedMotion, pulse]);

  const shimmer = useAnimatedStyle(() => ({ opacity: 1 - pulse.value * 0.5 }));
  const block = "rounded-tile bg-surface-alt dark:bg-surface-alt-dark";

  return (
    <View className="flex-1 px-lg pt-md">
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" className="absolute h-px w-px overflow-hidden opacity-0">
        <Text variant="caption">{message}</Text>
      </View>
      <Animated.View aria-hidden className="gap-md" style={shimmer}>
        <View className="h-stage-bar w-full rounded-pill bg-surface-alt dark:bg-surface-alt-dark" />
        <View className="gap-sm pt-xl">
          {TILE_ROWS.map((row) => (
            <View key={row[0]} className="flex-row gap-sm">
              {row.map((i) => (
                <View key={i} className={`h-word-tile flex-1 ${block}`} />
              ))}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
