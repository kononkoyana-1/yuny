import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "./Text";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import "./animated";

export type MascotStage = 1 | 2 | 3 | 4 | 5;
export type MascotMood = "neutral" | "thinking" | "celebrating" | "resting";
export type MascotSize = "small" | "medium" | "large" | "hero";

const SPRITES: Record<MascotMood, number> = {
  neutral: require("../../assets/mascot/neutral.png"),
  thinking: require("../../assets/mascot/thinking.png"),
  celebrating: require("../../assets/mascot/celebrating.png"),
  resting: require("../../assets/mascot/resting.png"),
};

const SIZE_PX: Record<MascotSize, number> = {
  small: 64,
  medium: 128,
  large: 220,
  // Welcome only — the one screen where the mascot IS the content rather than
  // a companion beside it.
  hero: 288,
};

// Five particles fanned evenly around the mascot (72° apart, starting
// pointing up) for the "celebrating" sparkle burst.
const SPARKLE_ANGLES_DEG = [-90, -18, 54, 126, 198] as const;

interface SparkleProps {
  progress: SharedValue<number>;
  angle: number;
  distance: number;
}

/**
 * A single sparkle particle. Its own component (not a `.map()`-inlined
 * `useAnimatedStyle`) so each instance owns exactly one hook call — calling
 * `useAnimatedStyle` from inside a `.map()` in `Mascot` would violate the
 * rules of hooks.
 */
function Sparkle({ progress, angle, distance }: SparkleProps) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * distance;
  const dy = Math.sin(rad) * distance;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: dx * p },
        { translateY: dy * p },
        {
          scale: interpolate(
            p,
            [0, 0.3, 1],
            [0, 1, 0.3],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        p,
        [0, 0.15, 0.7, 1],
        [0, 1, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Position and transform live in `style`; the visible dot is a plain child
  // with the classes on it. NativeWind does not apply `className` to
  // Reanimated's components — classes set directly on `Animated.View` are
  // silently dropped, which here would take the size and colour with them and
  // render nothing at all.
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", top: "50%", left: "50%", marginTop: -4, marginLeft: -4 },
        style,
      ]}
    >
      <View className="h-2 w-2 rounded-pill bg-accent" />
    </Animated.View>
  );
}

interface MascotBaseProps {
  stage: MascotStage;
  mood: MascotMood;
  size: MascotSize;
  /** 0..1, progress within the current stage. Omit to hide the indicator. */
  growthProgress?: number;
  /**
   * The five stage pips beside the figure. On by default, because wherever
   * progression is the subject the indicator is the point.
   *
   * Turn it off where the mascot is present as a companion rather than as a
   * record of growth — a welcome screen, a spinner, an error. Five pips under
   * a centred illustration read as carousel dots promising four more screens,
   * and on those screens the stage means nothing anyway.
   */
  showStage?: boolean;
  className?: string;
}

export interface MascotProps extends MascotBaseProps {
  /**
   * Set when the mascot carries no information a screen reader user needs —
   * a companion beside copy that already says everything, a spinner, an
   * error illustration. Hidden from assistive tech on all three targets via
   * the single `aria-hidden` prop: on native, RN's `View` translates it into
   * `accessibilityElementsHidden` + `importantForAccessibility=
   * "no-hide-descendants"`; on web, react-native-web 0.21 forwards it
   * straight through as the DOM `aria-hidden` attribute (confirmed in
   * `node_modules/react-native-web/dist/modules/createDOMProps` — the older
   * `accessibilityHidden` prop it also accepts is deprecated there).
   *
   * Replaces the `<View accessibilityElementsHidden
   * importantForAccessibility="no-hide-descendants">` wrapper pattern, which
   * react-native-web 0.21 does not understand and so leaves the mascot
   * readable on web.
   */
  decorative?: boolean;
  /**
   * Required when `decorative` is false — this component has no hardcoded
   * label (there used to be an English `` `Mascot, ${mood}, stage ${stage}`
   * `` fallback here — callers are Russian-only per `shared/i18n`, so the
   * label has to come from the caller, which is the only place that already
   * imports `t`). Ignored when `decorative` is true.
   */
  accessibilityLabel?: string;
}

export function Mascot({
  stage,
  mood,
  size,
  growthProgress,
  showStage = true,
  className = "",
  decorative = false,
  accessibilityLabel,
}: MascotProps) {
  const reducedMotion = useReducedMotion();
  const dimension = SIZE_PX[size];

  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  // Idle "breathing" pulse — layered on top of `scale` (which handles the
  // stage-change pop) via multiplication, so the two never fight.
  const breathe = useSharedValue(1);
  const burstProgress = useSharedValue(0);
  const [burstActive, setBurstActive] = useState(false);
  const previousMood = useRef(mood);

  useEffect(() => {
    if (reducedMotion) {
      floatY.value = 0;
      return;
    }
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, floatY]);

  useEffect(() => {
    if (reducedMotion) {
      breathe.value = 1;
      return;
    }
    // Same duration family as the float above, so the two read as one
    // "alive" idle motion rather than two competing loops.
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.015, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, breathe]);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(0, { duration: 120 }, () => {
      opacity.value = withTiming(1, { duration: 200 });
    });
  }, [mood, reducedMotion, opacity]);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withSequence(
      withTiming(1.08, { duration: 180, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 220 }),
    );
  }, [stage, reducedMotion, scale]);

  // Sparkle burst — fires only on the transition *into* "celebrating", not
  // on mount and not on other mood changes. `isBursting` is a plain ref
  // (not React state) tracking whether a burst is currently in flight, so
  // this single effect can both start and stop the burst without ever
  // depending on the `burstActive` state it also sets (an effect that reads
  // and writes the same state is exactly the cascading-render footgun the
  // set-state-in-effect lint rule flags).
  const isBursting = useRef(false);

  useEffect(() => {
    const becameCelebrating =
      mood === "celebrating" && previousMood.current !== "celebrating";
    const leftCelebrating =
      previousMood.current === "celebrating" && mood !== "celebrating";
    previousMood.current = mood;

    if (becameCelebrating && !reducedMotion) {
      isBursting.current = true;
      setBurstActive(true);
      burstProgress.value = 0;
      burstProgress.value = withTiming(
        1,
        { duration: 700, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            isBursting.current = false;
            runOnJS(setBurstActive)(false);
          }
        },
      );
      return;
    }

    // Stop-gate: cancel an in-flight burst immediately if `mood` leaves
    // "celebrating" early (e.g. a completion toast dismisses quickly) or
    // reduced-motion turns on mid-burst — don't let it play out silently.
    if (isBursting.current && (leftCelebrating || reducedMotion)) {
      isBursting.current = false;
      cancelAnimation(burstProgress);
      burstProgress.value = 0;
      setBurstActive(false);
    }
  }, [mood, reducedMotion, burstProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value * breathe.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View
      {...(decorative
        ? { "aria-hidden": true }
        : { accessibilityRole: "image" as const, accessibilityLabel })}
      className={`items-center ${className}`}
    >
      <Animated.View style={animatedStyle} className="relative">
        <Image
          source={SPRITES[mood]}
          style={{ width: dimension, height: dimension }}
          resizeMode="contain"
        />
        {burstActive
          ? SPARKLE_ANGLES_DEG.map((angle) => (
              <Sparkle
                key={angle}
                progress={burstProgress}
                angle={angle}
                distance={dimension * 0.55}
              />
            ))
          : null}
      </Animated.View>

      {showStage ? (
        <View
          className="mt-xs flex-row items-center gap-xs"
          accessibilityRole="progressbar"
          accessibilityLabel={`Growth stage ${stage} of 5`}
        >
          {Array.from({ length: 5 }, (_, i) => i + 1).map((s) => (
            <View
              key={s}
              className={`h-1.5 w-1.5 rounded-pill ${
                s <= stage
                  ? "bg-primary dark:bg-primary-dark"
                  : "bg-surface-alt dark:bg-surface-alt-dark"
              }`}
            />
          ))}
        </View>
      ) : null}

      {typeof growthProgress === "number" ? (
        <Text variant="caption" tone="muted" className="mt-xs">
          {Math.round(Math.max(0, Math.min(1, growthProgress)) * 100)}%
        </Text>
      ) : null}
    </View>
  );
}
