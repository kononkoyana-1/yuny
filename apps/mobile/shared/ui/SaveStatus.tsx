import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useTheme } from "@/shared/lib/useTheme";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { motion } from "@/shared/config/tokens";
import { Icon } from "./Icon";
import { Text } from "./Text";
import "./animated";

export type SaveStatusState = "idle" | "saving" | "saved" | "error";
export type SaveStatusLayout = "inline" | "block";

export interface SaveStatusProps {
  state: SaveStatusState;
  message?: string;
  /** Retry button label — required together with `onRetry` for the `error` state. */
  retryLabel?: string;
  onRetry?: () => void;
  retryA11yLabel?: string;
  layout: SaveStatusLayout;
  className?: string;
}

/**
 * S3 (settings.design.md §9): the per-field save indicator next to each
 * `SettingBlock` label. Owns its own timing — once `state` becomes `"saved"`
 * it holds for `motion.statusHold`, then blanks itself, regardless of
 * whether the caller's own `state` prop has already moved on.
 *
 * "Сохраняем…" appears only after `motion.slow`, so a fast save never
 * flickers it; whatever is showing fades out over `motion.base` when the
 * status clears (instantly under reduced motion).
 */
export function SaveStatus({
  state,
  message,
  retryLabel,
  onRetry,
  retryA11yLabel,
  layout,
  className = "",
}: SaveStatusProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  // Holds `"saved"` on screen for `motion.statusHold` past when the caller
  // may have already moved `state` on, then blanks itself.
  //
  // `holdExpired` resets the moment `state` changes — via React's documented
  // "adjusting state when a prop changes" pattern (a `setState` call during
  // render, not inside an effect: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes),
  // which is how this avoids the `react-hooks/set-state-in-effect` rule that
  // a mirroring `useEffect` would trip. The effect below only ever calls
  // `setState` from its `setTimeout` callback — reacting to time passing,
  // an actual external event, which is the pattern that rule asks for.
  const [prevState, setPrevState] = useState(state);
  const [holdExpired, setHoldExpired] = useState(false);
  const [savingDelayed, setSavingDelayed] = useState(true);
  if (state !== prevState) {
    setPrevState(state);
    setHoldExpired(false);
    setSavingDelayed(true);
  }

  useEffect(() => {
    if (state !== "saving" || !savingDelayed) return undefined;
    const id = setTimeout(() => setSavingDelayed(false), motion.slow);
    return () => clearTimeout(id);
  }, [state, savingDelayed]);

  useEffect(() => {
    if (state !== "saved" || holdExpired) return undefined;
    const id = setTimeout(() => setHoldExpired(true), motion.statusHold);
    return () => clearTimeout(id);
  }, [state, holdExpired]);

  const display: SaveStatusState =
    (state === "saved" && holdExpired) || (state === "saving" && savingDelayed) ? "idle" : state;

  if (display === "idle") return null;

  const containerClass = layout === "block" ? "flex-row items-center gap-sm" : "flex-row items-center gap-xs";

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      exiting={reducedMotion ? undefined : FadeOut.duration(motion.base)}
      className={`${containerClass} ${className}`}
    >
      {display === "saving" ? (
        // Not announced — only the outcome ("Сохранено" / the error) is.
        <Text variant="caption" tone="muted" aria-hidden>
          {message}
        </Text>
      ) : null}

      {display === "saved" ? (
        <>
          <Icon name="check" size={14} color={colors.successInk} />
          <Text variant="caption" tone="successInk">
            {message}
          </Text>
        </>
      ) : null}

      {display === "error" ? (
        <>
          <Text variant="caption" tone="attentionInk">
            {message}
          </Text>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={retryA11yLabel ?? retryLabel}
              onPress={onRetry}
              // The row is caption-sized, so the target is padded out to
              // `sizing.tapTarget` rather than shrinking the text.
              className="min-h-tap min-w-tap items-center justify-center"
              hitSlop={8}
            >
              <Text variant="caption" tone="brand" className="font-semibold">
                {retryLabel}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Animated.View>
  );
}
