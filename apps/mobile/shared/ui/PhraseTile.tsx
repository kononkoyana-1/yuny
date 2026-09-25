import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { usePressScale } from "@/shared/lib/usePressScale";
import { HanziText } from "./HanziText";
import { FOCUS_RING_CLASS } from "./focusRing";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PhraseTileProps {
  /** A word or short phrase, e.g. "这个" or "买". */
  text: string;
  /** C2's tile-bank "shadow" left where a tile was dragged out — a `surfaceAlt`, dashed placeholder, same footprint, unpressable. */
  placeholder?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  className?: string;
}

/**
 * DS-E4 (exercise.design.md §9): the C2 sentence-assembly piece — pressing
 * one in the tile bank appends it to the answer, pressing one in the answer
 * returns it to the bank (§4.8). `AnswerLine`/`TileBank` (the two
 * containers) stay a feature concern per the Composition table ("(фича)");
 * only the tile itself is a `shared/ui` primitive.
 *
 * Distinct from `WordTile` (folder-map.design.md's stage-coloured map
 * tile) despite exercise.design.md's own Composition table naming this one
 * "WordTile" too — see `WordTile.tsx`'s doc comment for the resolved name
 * collision.
 */
export function PhraseTile({ text, placeholder = false, onPress, accessibilityLabel, className = "" }: PhraseTileProps) {
  const { style, onPressIn, onPressOut } = usePressScale();

  if (placeholder) {
    return (
      <Animated.View
        aria-hidden
        className={`min-h-tap items-center justify-center rounded-tile border border-dashed border-border bg-surface-alt px-md py-sm opacity-50 dark:border-border-dark dark:bg-surface-alt-dark ${className}`}
      />
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
      className={`min-h-tap items-center justify-center rounded-tile bg-surface px-md py-sm shadow-raised dark:bg-surface-dark dark:shadow-none ${FOCUS_RING_CLASS} ${className}`}
    >
      <HanziText variant="sentence">{text}</HanziText>
    </AnimatedPressable>
  );
}
