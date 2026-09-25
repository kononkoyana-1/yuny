import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { motion } from "@/shared/config/tokens";
import { useReducedMotion } from "./useReducedMotion";

/**
 * #65 (today-session.design.md V.6): the `motion.pressScale` squeeze shared
 * by every pressable #65 primitive (`HeroButton`, `OptionTile`, `WordTile`,
 * `StudyButton`, …) — one hook instead of copying the same
 * `useSharedValue`/`useAnimatedStyle` pair into each.
 *
 * At `useReducedMotion() === true` the value never moves: V.1 п.4 replaces
 * scale/shift motion with an instant state change or a fade no longer than
 * `motion.fast`, and a squeeze carries no information on its own that the
 * fill/border change (owned by the caller) doesn't already carry.
 *
 * `onPressIn`/`onPressOut` are plain functions, not `useCallback`-memoized —
 * mutating a Reanimated shared value inside a memoized callback trips the
 * React Compiler ESLint plugin's `react-hooks/immutability` rule (it can't
 * tell a `.value` write on a Reanimated shared value from a write to
 * React-owned state), and `Pressable` re-subscribing these two handlers
 * every render costs nothing worth avoiding it for.
 */
export function usePressScale(scale: number = motion.pressScale) {
  const scaleValue = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scaleValue.value }] }));

  function onPressIn() {
    if (!reducedMotion) scaleValue.value = withTiming(scale, { duration: motion.fast });
  }

  function onPressOut() {
    if (!reducedMotion) scaleValue.value = withTiming(1, { duration: motion.fast });
  }

  return { style, onPressIn, onPressOut };
}
