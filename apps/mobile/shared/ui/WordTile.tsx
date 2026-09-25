import { useEffect, useState, type Ref } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { gradients, motion } from "@/shared/config/tokens";
import { angledGradient } from "@/shared/platform/gradient";
import { useTheme } from "@/shared/lib/useTheme";
import { usePressScale } from "@/shared/lib/usePressScale";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { pickHanziTileVariant } from "@/shared/lib/hanziVariant";
import { STAGE_FILL_CLASS, STAGE_IS_DEEP, STAGE_NEEDS_EDGE, STAGE_ORDER, type Stage } from "./stage";
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
  /**
   * Roving tabindex сетки (web): только одна плитка — остановка Tab, по
   * остальным ходят стрелками (folder-map.design.md §7). По умолчанию `true`.
   */
  tabStop?: boolean;
  /** Клавиши на плитке (web): стрелки, Home / End. */
  onKeyDown?: (event: { key: string; preventDefault(): void }) => void;
  onFocus?: () => void;
}

/** Вспышка `heroSheen` после «наливания»: появляется и гаснет. */
const SHEEN_IN = motion.fast;
const SHEEN_OUT = motion.base;

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
  tabStop = true,
  onKeyDown,
  onFocus,
}: WordTileProps) {
  const { colors, scheme } = useTheme();
  const { style, onPressIn, onPressOut } = usePressScale();
  const reducedMotion = useReducedMotion();
  const onColor = STAGE_IS_DEEP.has(stage) ? colors.onStageDeep : colors.onStageLight;
  const variant = pickHanziTileVariant(headword);

  // «Наливание» (§3.3): стадия выросла с прошлого показа — это сравнение двух
  // ответов сервера, а не расчёт стадии. Пока новая заливка поднимается снизу,
  // под ней остаётся старая (`under`). При reduced motion — сразу новый цвет.
  const [shown, setShown] = useState(stage);
  const [under, setUnder] = useState<Stage | null>(null);
  if (stage !== shown) {
    setShown(stage);
    setUnder(!reducedMotion && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(shown) ? shown : null);
  }
  const fill = useSharedValue(1);
  const sheen = useSharedValue(0);
  useEffect(() => {
    if (under === null) return;
    fill.set(0);
    fill.set(withTiming(1, { duration: motion.slow, easing: Easing.out(Easing.quad) }));
    sheen.set(0);
    sheen.set(
      withDelay(motion.slow, withSequence(withTiming(1, { duration: SHEEN_IN }), withTiming(0, { duration: SHEEN_OUT }))),
    );
    const done = setTimeout(() => setUnder(null), motion.slow + SHEEN_IN + SHEEN_OUT);
    return () => clearTimeout(done);
  }, [under, fill, sheen]);
  const fillStyle = useAnimatedStyle(() => ({ height: `${fill.value * 100}%` }));
  const sheenStyle = useAnimatedStyle(() => ({ opacity: sheen.value }));

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onFocus={onFocus}
      tabIndex={tabStop ? 0 : -1}
      // `onKeyDown` есть у DOM-узла `Pressable` в react-native-web, но не в типах React Native.
      {...(onKeyDown ? ({ onKeyDown } as object) : {})}
      style={style}
      className={`relative h-word-tile w-word-tile items-center justify-center rounded-tile p-sm ${STAGE_FILL_CLASS[under ?? stage]} ${
        STAGE_NEEDS_EDGE.has(stage) ? "border border-stage-edge dark:border-stage-edge-dark" : ""
      } ${due ? "border-due-border border-dashed border-attention dark:border-attention-dark" : ""} ${FOCUS_RING_CLASS} ${className}`}
    >
      {under !== null ? (
        <View pointerEvents="none" aria-hidden className="absolute inset-0 justify-end overflow-hidden rounded-tile">
          <Animated.View className={`w-full ${STAGE_FILL_CLASS[stage]}`} style={fillStyle} />
          <Animated.View
            className="absolute inset-0"
            style={[angledGradient(scheme === "dark" ? gradients.heroSheenDark : gradients.heroSheen), sheenStyle]}
          />
        </View>
      ) : null}
      <HanziText variant={variant} numberOfLines={variant === "inline" ? 2 : 1} className="text-center" style={{ color: onColor }}>
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
