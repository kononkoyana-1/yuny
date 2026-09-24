import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { motion } from "@/shared/config/tokens";
import { Icon } from "./Icon";
import { Text } from "./Text";

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
 * Two #65 tokens the spec calls for are not in `tokens.ts` yet
 * (settings.design.md §V-F has the replacements used below):
 * - `successInk` / `attentionInk` → an icon in the existing `success` /
 *   `warning` colour plus `Text tone="default"` — the *current* `success`
 *   only reaches 3.4:1 against `surface` as text colour, under AA.
 * - `motion.slow` (the delay before "Сохраняем…" appears, to avoid a
 *   flicker on fast connections) and `motion.base` (the fade-out after the
 *   hold) → both replaced by an instant change, since §V-F bans duration
 *   literals for any `motion.*` token that isn't in `tokens.ts`.
 *   `motion.statusHold` is this task's own token (not #65's), so its 1600ms
 *   hold is real and used as specified.
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
  if (state !== prevState) {
    setPrevState(state);
    setHoldExpired(false);
  }

  useEffect(() => {
    if (state !== "saved" || holdExpired) return undefined;
    const id = setTimeout(() => setHoldExpired(true), motion.statusHold);
    return () => clearTimeout(id);
  }, [state, holdExpired]);

  const display: SaveStatusState = state === "saved" && holdExpired ? "idle" : state;

  if (display === "idle") return null;

  const containerClass = layout === "block" ? "flex-row items-center gap-sm" : "flex-row items-center gap-xs";

  return (
    <View
      accessibilityLiveRegion="polite"
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
          {/* #65-token: successInk — replacement per §V-F: `success`-coloured
              icon, default-toned text (the current `success` value fails
              AA as text colour). */}
          <Icon name="check" size={14} color={colors.success} />
          <Text variant="caption" tone="default">
            {message}
          </Text>
        </>
      ) : null}

      {display === "error" ? (
        <>
          {/* #65-token: attentionInk — replacement per §V-F: default-toned
              text, no colour borrowed from a token that isn't AA-safe for
              text yet. */}
          <Text variant="caption" tone="default">
            {message}
          </Text>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={retryA11yLabel ?? retryLabel}
              onPress={onRetry}
              // #65-token: sizing.tapTarget — §V-F's one allowed literal
              // (`min-h-[44px]`) until the token lands. The row's height is
              // typically under 44 (it's a caption-sized inline element), so
              // the target is padded out rather than shrinking the text.
              className="min-h-[44px] min-w-[44px] items-center justify-center"
              hitSlop={8}
            >
              <Text variant="caption" className="font-semibold text-primary dark:text-primary-dark">
                {retryLabel}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
