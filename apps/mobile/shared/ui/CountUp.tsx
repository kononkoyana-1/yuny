import { useEffect, useRef, useState } from "react";
import { motion } from "@/shared/config/tokens";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { Text, type TextTone } from "./Text";

export interface CountUpProps {
  value: number;
  tone?: TextTone;
  className?: string;
  /** Spoken value, e.g. "34 задания" — the caller's job (V.7 DS8: a screen reader gets only the final number, never the intermediate frames). */
  accessibilityLabel?: string;
}

/**
 * DS8 (today-session.design.md §9): the "Сегодня" task count, counting up
 * from 0 over `motion.slow`. At `useReducedMotion() === true` the final
 * number is shown immediately — no animation at all, per V.1 п.4.
 *
 * Driven by `requestAnimationFrame` + React state rather than Reanimated: a
 * `Text` node's string content can't be reached through a `useAnimatedStyle`
 * `style`, only through re-rendering the number itself.
 */
export function CountUp({ value, tone = "default", className = "", accessibilityLabel }: CountUpProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // At `reducedMotion` the very first frame already reports `t = 1` (a
    // `duration` of 0 divides to `Infinity`, clamped to 1 by `Math.min`), so
    // the "no animation" case runs through the same `requestAnimationFrame`
    // path as the animated one — every `setDisplay` call then happens inside
    // that async callback rather than synchronously in the effect body.
    const start = Date.now();
    const duration = reducedMotion ? 0 : motion.slow;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      setDisplay(Math.round(value * t));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, reducedMotion]);

  return (
    <Text
      variant="numberHero"
      tone={tone}
      className={className}
      // The counting frames are visual only; a screen reader announces the
      // caller-supplied final label rather than every intermediate value.
      accessibilityLabel={accessibilityLabel ?? String(value)}
    >
      {display}
    </Text>
  );
}
