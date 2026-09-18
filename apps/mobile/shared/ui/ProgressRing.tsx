import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/shared/lib/useTheme";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { sizing } from "@/shared/config/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingBaseProps {
  value: number;
  max: number;
  /** Outer diameter — pass `sizing.moduleCircle` at the call site. */
  size: number;
  strokeWidth?: number;
  /** Rendered centred inside the ring — the disc + label in `ModuleCircle`. */
  children?: ReactNode;
  className?: string;
}

/**
 * Discriminated on `decorative`, same shape as `Mascot`: a caller that omits
 * `decorative` must supply the two a11y props, enforced at the type level
 * rather than by a runtime check.
 */
export type ProgressRingProps =
  | (ProgressRingBaseProps & {
      decorative: true;
      accessibilityLabel?: string;
    })
  | (ProgressRingBaseProps & {
      decorative?: false;
      accessibilityLabel: string;
      /**
       * The spoken value, e.g. "3 из 8" — `ProgressRing` does not import
       * i18n (per the design system's primitives-stay-i18n-free rule), so
       * the caller owns pluralisation and phrasing.
       */
      accessibilityValueText: string;
    });

/**
 * A circular progress indicator (home.design.md §Composition, new
 * primitives). Draws a track (`primarySoft`) and, above a fraction of 0, an
 * arc (`primary`) with rounded caps starting at 12 o'clock and growing
 * clockwise.
 *
 * Home's `ModuleCircle` renders this `decorative` and puts the spoken value
 * on its own enclosing `Pressable` instead — a `progressbar` nested inside a
 * `button` is an invalid ARIA tree on web. A caller that needs the ring
 * itself to announce a value (outside a bigger interactive control) sets
 * `decorative={false}`.
 */
export function ProgressRing(props: ProgressRingProps) {
  const {
    value,
    max,
    size,
    strokeWidth = sizing.progressRingStroke,
    children,
    className = "",
  } = props;

  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  const fraction = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(fraction);
  useEffect(() => {
    progress.value = reducedMotion ? fraction : withTiming(fraction, { duration: 300 });
  }, [fraction, reducedMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Narrowed on `props.decorative` (the discriminant), not the destructured
  // `decorative` local — TS can only follow the union through the former.
  const a11yProps = props.decorative
    ? // Same single-prop trick as `Mascot`: `aria-hidden` on a native `View`
      // is translated into `accessibilityElementsHidden` +
      // `importantForAccessibility="no-hide-descendants"`, and forwarded
      // verbatim as the DOM attribute on web (react-native-web 0.21,
      // `createDOMProps`).
      { "aria-hidden": true as const }
    : {
        accessibilityRole: "progressbar" as const,
        accessibilityLabel: props.accessibilityLabel,
        // Flat `aria-value*` props, not the nested `accessibilityValue={{
        // min, max, now, text }}` object: react-native-web's `createDOMProps`
        // only reads the flat (or `aria-`-prefixed) props into
        // `aria-valuemin`/`-max`/`-now`/`-text` — the nested object is
        // silently dropped on web (verified against `node_modules/
        // react-native-web/dist/modules/createDOMProps`, the same file that
        // confirmed `aria-hidden`'s pass-through for `Mascot`). React
        // Native's own `View` accepts this exact flat shape too (`Libraries/
        // Components/View/ViewAccessibility.js`), so one set of props covers
        // both targets.
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-valuenow": value,
        "aria-valuetext": props.accessibilityValueText,
      };

  return (
    <View
      {...a11yProps}
      style={{ width: size, height: size }}
      className={`items-center justify-center ${className}`}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primarySoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/*
         * Rendered only above a target fraction of 0 — a full-circumference
         * dash array at offset 0 length can still paint a stray round-cap
         * dot depending on the renderer's rounding, and the spec is explicit
         * that a 0 fraction draws no arc at all.
         */}
        {fraction > 0 ? (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}
