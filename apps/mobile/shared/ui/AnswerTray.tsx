import { useEffect, type ReactNode } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { motion } from "@/shared/config/tokens";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import "./animated";

export type AnswerTrayOutcome = "correct" | "partial" | "wrong";

const CONTAINER_CLASS: Record<AnswerTrayOutcome, string> = {
  correct: "bg-success-soft dark:bg-success-soft-dark",
  partial: "bg-attention-soft dark:bg-attention-soft-dark",
  wrong: "bg-attention-soft dark:bg-attention-soft-dark",
};

export interface AnswerTrayProps {
  outcome: AnswerTrayOutcome;
  /** The heading row — e.g. a check glyph + `Text tone="successInk"`, per §3.3's table. Caller-composed, since the copy and icon differ per outcome. */
  title: ReactNode;
  /** Body + the "Дальше" `Button` slot. */
  children: ReactNode;
  className?: string;
}

/**
 * DS-E2 (exercise.design.md §9): the sliding answer-feedback tray (§3.3) —
 * `radius.hero` top corners, `elevation.glow`, a live region so the outcome
 * is announced without moving focus (§7: focus goes to "Дальше" inside it).
 *
 * Slides up from the bottom over `motion.base`; at
 * `useReducedMotion() === true` it only fades in over `motion.fast`,
 * matching every other #65 entrance (V.1 п.4).
 */
export function AnswerTray({ outcome, title, children, className = "" }: AnswerTrayProps) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(reducedMotion ? 0 : 24);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: reducedMotion ? motion.fast : motion.base });
    translateY.value = withTiming(0, { duration: reducedMotion ? motion.fast : motion.base });
  }, [reducedMotion, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={style}
      className={`gap-sm rounded-t-hero p-lg shadow-glow dark:shadow-glow-dark ${CONTAINER_CLASS[outcome]} ${className}`}
    >
      {title}
      {children}
    </Animated.View>
  );
}
