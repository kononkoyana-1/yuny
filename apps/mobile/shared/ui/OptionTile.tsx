import type { ReactNode } from "react";
import { usePressScale } from "@/shared/lib/usePressScale";
import { FOCUS_RING_CLASS } from "./focusRing";
import { AnimatedPressable } from "./animated";

export type OptionTileLayout = "row" | "square";
export type OptionTileState = "idle" | "submitted" | "correct" | "wrongSelected" | "dimmed";

const STATE_CONTAINER_CLASS: Record<OptionTileState, string> = {
  idle: "bg-surface border border-border shadow-raised dark:border-border-dark dark:shadow-none hover:border-primary dark:hover:border-primary-dark",
  // Толщина рамки — `sizing.focusRingWidth` (те же 3px, что и у focus-ring).
  submitted: "bg-primary-soft border-[3px] border-primary dark:bg-primary-soft-dark dark:border-primary-dark",
  correct: "bg-success-soft border border-success dark:bg-success-soft-dark dark:border-success-dark",
  wrongSelected: "bg-attention-soft border border-attention dark:bg-attention-soft-dark dark:border-attention-dark",
  // Text stays `text` (not `textMuted`) at this opacity — `opacity.dimmed`'s own comment in tokens.ts.
  dimmed: "bg-surface border border-border opacity-dimmed dark:border-border-dark",
};

const LAYOUT_CLASS: Record<OptionTileLayout, string> = {
  row: "w-full min-h-option-min-height flex-row items-center justify-between px-md py-sm",
  square: "aspect-square w-hanzi-choice items-center justify-center",
};

export interface OptionTileProps {
  /** The answer content — a `Text` (R1/P1) or `HanziText` (W1/W2/C1), the caller's own tone/variant. */
  children: ReactNode;
  layout?: OptionTileLayout;
  state?: OptionTileState;
  /** A `KeyHint` (or any small corner decoration), row layout, wide screen only. */
  corner?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  className?: string;
}

/**
 * DS-E1 (exercise.design.md §9): an answer choice (§3.2). `state` mirrors
 * the table there 1:1 — the caller is the one who knows *which* option is
 * "the chosen one", "the correct one" or "one of the rest" once an answer
 * lands, so this stays a dumb visual switch on an enum rather than owning
 * that logic itself.
 *
 * `motion.pressScale` only applies at `state="idle"` — once an answer has
 * landed the fill/border change already carries the feedback, and a still
 * `submitted`/`correct`/`wrongSelected` tile is not meant to be pressed
 * again.
 */
export function OptionTile({
  children,
  layout = "row",
  state = "idle",
  corner,
  onPress,
  disabled = false,
  accessibilityLabel,
  className = "",
}: OptionTileProps) {
  const { style, onPressIn, onPressOut } = usePressScale();
  const isIdle = state === "idle";

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={isIdle ? onPressIn : undefined}
      onPressOut={isIdle ? onPressOut : undefined}
      style={isIdle ? style : undefined}
      className={`relative rounded-tile ${LAYOUT_CLASS[layout]} ${STATE_CONTAINER_CLASS[state]} ${FOCUS_RING_CLASS} ${className}`}
    >
      {children}
      {corner ? <>{corner}</> : null}
    </AnimatedPressable>
  );
}
