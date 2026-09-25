import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { StageDot, Text } from "@/shared/ui";
import { motion } from "@/shared/config/tokens";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { t } from "@/shared/i18n";
import type { RoundProgress } from "../session/summary";

/**
 * Счётчик шапки в раунде знакомства (folder-study.design.md §4 п. 1): «3 из 7
 * слов». Когда слово запомнено, рядом на `motion.slow` вспыхивает точка
 * стадии «знакомство» — единственный праздник внутри раунда. При reduced
 * motion точки нет: число и так меняется.
 */
export function RoundCounter({ learned, total }: RoundProgress) {
  const reducedMotion = useReducedMotion();
  const flash = useSharedValue(0);
  const shown = useRef(learned);

  useEffect(() => {
    if (learned > shown.current && !reducedMotion) {
      flash.value = withSequence(
        withTiming(1, { duration: motion.fast }),
        withDelay(motion.slow, withTiming(0, { duration: motion.slow })),
      );
    }
    shown.current = learned;
  }, [learned, reducedMotion, flash]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: flash.value, transform: [{ scale: 0.6 + flash.value * 0.4 }] }));

  return (
    <View
      accessible
      accessibilityLabel={t("learn.round.progressA11y", { learned, count: total })}
      className="flex-row items-center gap-xs"
    >
      <Animated.View style={dotStyle}>
        <StageDot stage="meeting" size={8} />
      </Animated.View>
      <Text variant="caption" tone="muted" className="tabular-nums">
        {t("learn.round.progress", { learned, count: total })}
      </Text>
    </View>
  );
}
