/**
 * Single source of truth for design tokens.
 *
 * Mirrors apps/mobile/tailwind.config.js exactly — any value changed here
 * must be changed there too (and vice versa). NativeWind className usage
 * reads from tailwind.config.js; this file is for the rare non-className
 * case (Reanimated shared values, SVG props, chart colors) where a raw
 * value is required instead of a class name.
 */

export const colors = {
  light: {
    /**
     * Darkened from #7B6BD6 so white label text clears WCAG AA (TZ.md §13).
     * The old value gave 4.27:1 against white — under the 4.5 floor for the
     * 18px semibold button label, which is not large text by WCAG's rule.
     * #6B5AC9 gives 5.34:1 and is the same hue.
     */
    primary: "#6B5AC9",
    primarySoft: "#EFECFB",
    accent: "#FFD764",
    /**
     * Softened toward neutral from #FFF6DC. The accent itself stays gold —
     * it comes from the mascot's star — but a saturated cream pill read as a
     * stray warm patch once the background moved to lavender.
     */
    accentSoft: "#FCF3E8",
    info: "#6BC0EC",
    success: "#4A9B6E",
    warning: "#E8A54B",
    danger: "#D96A6A",
    // Cool lavender, replacing the warm cream #FAF7F2. The dark theme was
    // already cool (#17142A), so the two modes now agree instead of reading
    // as different products.
    background: "#F1EFFC",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F3FE",
    border: "#E8E4F8",
    text: "#241F3D",
    /**
     * Cooled from #7A7391, which failed AA in the old palette too: 4.19:1 on
     * the warm background and 4.48:1 on white, both under 4.5. #6E6890 gives
     * 4.57:1 and 5.19:1. This fixes a pre-existing defect, not one the new
     * palette introduced.
     */
    textMuted: "#6E6890",
    textInverse: "#FFFFFF",
  },
  dark: {
    primary: "#9B8FE3",
    primarySoft: "#2B2547",
    accent: "#FFD764",
    /**
     * Was #3A3320 — gold mixed into near-black, which came out olive and
     * read as dirt against a violet dark theme. A deep violet carries the
     * gold as TEXT instead (9.8:1), which is how the badge renders in dark
     * mode; see the readiness pill on Home.
     */
    accentSoft: "#31294A",
    info: "#6BC0EC",
    success: "#5FB584",
    warning: "#E8A54B",
    danger: "#E58585",
    background: "#17142A",
    surface: "#221E3B",
    surfaceAlt: "#2B2547",
    border: "#332D52",
    text: "#F2EFF8",
    textMuted: "#A9A2C4",
    textInverse: "#17142A",
  },
} as const;

/**
 * Primary-action gradient. Both stops must clear WCAG AA against the label
 * colour that sits on top of the whole sweep.
 *
 * Light theme label is `text-inverse` (#FFFFFF): #5E4BBA is 6.58:1 and
 * #7566CE is 4.62:1.
 *
 * Dark theme label is `text-inverse-dark` (#17142A — dark text, reused from
 * the badge/pill "inverse" role for a light-tinted background). The first
 * stop was #7E6FD8, which gave only 4.40:1 against that dark label — under
 * the 4.5 floor. Lightened to #8273D9 (4.62:1); the second stop (#9384E4,
 * 5.69:1) already cleared AA and is unchanged.
 *
 * The visual reference used #8B7BE8 → #A78BFA, which measures 3.44:1 and
 * 2.72:1 (light theme) — copying it verbatim would have shipped an
 * unreadable button.
 */
export const gradients = {
  primary: ["#5E4BBA", "#7566CE"] as const,
  primaryDark: ["#8273D9", "#9384E4"] as const,
  /**
   * Full-bleed backdrop for the entry screen — a barely-there vertical wash
   * that lifts the top of the page. Both stops sit within a shade of
   * `background`, so it reads as depth rather than as a coloured panel.
   */
  welcome: ["#F5F3FE", "#EAE6F9"] as const,
  welcomeDark: ["#1B1733", "#141126"] as const,
};

/**
 * The entry screen's atmosphere — near-white at the top, a cold lavender
 * glow through the middle, soft cloud shapes at the foot so the mascot reads
 * as standing on them.
 *
 * Built from gradients alone, with no `filter: blur()`. A radial gradient
 * whose last stop is fully transparent already has no visible edge, and
 * blurring a full-bleed view costs an offscreen pass every frame on a phone
 * for a result that costs nothing here.
 *
 * All alpha values are `#rrggbbaa`: React Native accepts eight-digit hex on
 * every target, while `rgba()` inside a gradient string is parsed by three
 * different engines and does not survive all of them.
 */
export const atmosphere = {
  light: {
    /** Top-to-bottom wash. Starts at pure white — the reference's top third. */
    sky: ["#FFFFFF", "#FCFBFF", "#F7F4FE", "#F0EBFC"] as const,
    /** Wide lavender bloom sitting low and centre. */
    glowMain: ["#9A82E838", "#B0A0EE20", "#C9BEF50E", "#FFFFFF00"] as const,
    /** Warmer violet, bottom-left. */
    glowSide: ["#7860D633", "#9683E01C", "#FFFFFF00"] as const,
    /** The mascot's tail blue, bottom-right, kept fainter than the violets. */
    glowCool: ["#6BC0EC2B", "#A5D6F214", "#FFFFFF00"] as const,
    /** Cloud body: bright crown, lavender underside. */
    cloud: ["#FFFFFFFA", "#FAF8FFEB", "#E2D9FCB8"] as const,
  },
  dark: {
    sky: ["#1B1733", "#191530", "#15122A", "#100E20"] as const,
    glowMain: ["#7E6FD83D", "#6455B024", "#4A3F8410", "#00000000"] as const,
    glowSide: ["#9384E42E", "#6C5FB818", "#00000000"] as const,
    glowCool: ["#4E93B82B", "#3A6E8C14", "#00000000"] as const,
    cloud: ["#2E2750F5", "#272144E8", "#1F1A38C4"] as const,
  },
};

/**
 * Shadow colour for raised surfaces. A tinted near-black rather than pure
 * black: on a lavender background a neutral shadow reads as grey dirt, while
 * a violet-tinted one sits in the same family as the page.
 */
export const shadowColor = "#3C2D78";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  /** Cards. Larger than `lg` and softer than `xl` — the reference sits here. */
  card: 22,
  xl: 24,
  pill: 999,
} as const;

/**
 * Font families, keyed by the weight each file actually carries.
 *
 * React Native does not synthesise weights from one file the way a browser
 * does: asking for `fontWeight: 800` on a Regular face gives you Regular on
 * Android and a faked smear on iOS. So each weight in the scale below maps
 * to its own loaded family, and `Text` picks the family rather than setting
 * a numeric weight.
 */
export const fontFamily = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semibold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
  extrabold: "PlusJakartaSans-ExtraBold",
} as const;

/**
 * Type scale, tuned along Material 3's two rules for a display-to-body ramp.
 *
 * 1. TRACKING FOLLOWS SIZE, INVERSELY. Large text at default spacing reads
 *    loose and soft, so display and title carry negative letter-spacing;
 *    small text needs the opposite, which is why `caption` sits at zero and
 *    the uppercase labels add their own positive tracking at the call site.
 * 2. WEIGHT CARRIES THE HIERARCHY, not size alone. Display and title move to
 *    800 and heading to 700, so a heading still reads as a heading when it
 *    wraps to two lines and the size cue weakens.
 *
 * Line heights tighten with size for the same reason — 40/34 on display is
 * about 1.18, against 1.5 on body, which is where comfortable reading sits.
 */
export const typography = {
  display: { size: 34, weight: "800", lineHeight: 40, letterSpacing: -1.0 },
  title: { size: 24, weight: "800", lineHeight: 30, letterSpacing: -0.6 },
  heading: { size: 18, weight: "700", lineHeight: 24, letterSpacing: -0.3 },
  body: { size: 16, weight: "400", lineHeight: 24, letterSpacing: 0 },
  /** Doubles as Material's "label" role, hence medium rather than regular. */
  caption: { size: 13, weight: "500", lineHeight: 18, letterSpacing: 0 },
  /**
   * Tab-bar labels only, and smaller than `caption` on purpose: under a 22px
   * glyph the word is a name for the icon rather than something to read, and
   * at 13px the pair looks like two competing elements. Both iOS and Material
   * put tab labels at 10–12px for the same reason.
   *
   * Not a general "smallest text" size — nothing else may reach for it, since
   * 11px body copy would fail readability everywhere else in the app.
   */
  tabLabel: { size: 11, weight: "600", lineHeight: 14, letterSpacing: 0.1 },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;
