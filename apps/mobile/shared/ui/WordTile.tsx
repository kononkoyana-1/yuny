import type { Ref } from "react";
import { View } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { usePressScale } from "@/shared/lib/usePressScale";
import { STAGE_FILL_CLASS, STAGE_IS_DEEP, STAGE_NEEDS_EDGE, type Stage } from "./stage";
import { HanziText } from "./HanziText";
import { Icon } from "./Icon";
import { Chip } from "./Chip";
import { FOCUS_RING_CLASS } from "./focusRing";
import { AnimatedPressable } from "./animated";

export interface WordTileProps {
  headword: string;
  stage: Stage;
  /** Dashed `attention` border — the word is due for review (§3.3, "пора освежить"). */
  due?: boolean;
  /** Confusion-pair partner headword, e.g. "卖" — corner `Chip size="micro" variant="pair"`. */
  pairPartner?: string;
  onPress: () => void;
  accessibilityLabel: string;
  className?: string;
  /** Для возврата фокуса на плитку после закрытия карточки слова. */
  ref?: Ref<View>;
}

/**
 * DS-M3 (folder-map.design.md §8): the folder-map word grid tile —
 * `sizing.wordTile`, filled by `stage*`, `stageEdge` border at steps 1–3, a
 * dashed `attention` border when due, and a `stageStableMark` star at
 * "Устойчиво".
 *
 * Named `WordTile` per folder-map's own spec. Exercise's C2 draggable
 * word/phrase piece (exercise.design.md §4.8/§9 DS-E4) is a visually
 * unrelated component despite sharing that name in its own spec text — it's
 * `PhraseTile` here (`shared/ui/PhraseTile.tsx`) to avoid the collision; see
 * this task's final report for the resolved ambiguity.
 */
export function WordTile({
  headword,
  stage,
  due = false,
  pairPartner,
  onPress,
  accessibilityLabel,
  className = "",
  ref,
}: WordTileProps) {
  const { colors } = useTheme();
  const { style, onPressIn, onPressOut } = usePressScale();
  const onColor = STAGE_IS_DEEP.has(stage) ? colors.onStageDeep : colors.onStageLight;

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
      className={`relative h-word-tile w-word-tile items-center justify-center rounded-tile p-sm ${STAGE_FILL_CLASS[stage]} ${
        STAGE_NEEDS_EDGE.has(stage) ? "border border-stage-edge dark:border-stage-edge-dark" : ""
      } ${due ? "border-due-border border-dashed border-attention dark:border-attention-dark" : ""} ${FOCUS_RING_CLASS} ${className}`}
    >
      <HanziText variant="tile" style={{ color: onColor }}>
        {headword}
      </HanziText>
      {stage === "stable" ? (
        <View aria-hidden className="absolute right-1 top-1">
          <Icon name="star" size={14} color={colors.stageStableMark} />
        </View>
      ) : null}
      {pairPartner ? (
        <View className="absolute -right-1 -top-1">
          <Chip size="micro" variant="pair" label={pairPartner} />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}
