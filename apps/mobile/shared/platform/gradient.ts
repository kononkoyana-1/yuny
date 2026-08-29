import type { ViewStyle } from "react-native";

/**
 * Gradient fills, native implementation.
 *
 * React Native 0.86 renders CSS gradient strings through
 * `experimental_backgroundImage` — both `linear-gradient` and
 * `radial-gradient` — so no extra dependency is needed on iOS or Android,
 * which matters since TZ.md §2 rules out packages that break the web target
 * and the cheapest way to honour that is to add none.
 *
 * The web build takes `gradient.web.ts` instead: `react-native-web` does not
 * forward the experimental prop, and a button whose gradient silently
 * vanishes on one of three required platforms is not a shared primitive.
 * Keeping the split here is what TZ.md §4 asks for — no `Platform.OS` in
 * `features/` or `app/`.
 */
export function linearGradient(from: string, to: string, angle = "135deg"): ViewStyle {
  return {
    experimental_backgroundImage: `linear-gradient(${angle}, ${from} 0%, ${to} 100%)`,
  } as ViewStyle;
}

/**
 * A multi-stop vertical wash. Stops are spread evenly, which is all the
 * atmospheric backgrounds need and keeps call sites from hand-computing
 * percentages.
 */
export function verticalGradient(stops: readonly string[]): ViewStyle {
  return {
    experimental_backgroundImage: `linear-gradient(180deg, ${spread(stops)})`,
  } as ViewStyle;
}

/**
 * A soft glow. `position` is CSS (`50% 100%`, `left bottom`), `stops` run from
 * the centre outwards and should end at a fully transparent colour so the
 * shape has no visible edge.
 *
 * `closest-side` rather than the CSS default `farthest-corner`: the default
 * reaches its last stop only at the box CORNERS, so along the top and side
 * edges the fill is still partly opaque and the view's rectangle shows as a
 * straight seam across the page. Ending at the nearest edge guarantees the
 * glow is fully transparent everywhere it meets its own bounds.
 *
 * Deliberately no `filter: blur()`: a radial gradient with a transparent last
 * stop is already smooth, and blurring a large view costs a full offscreen
 * pass every frame on a phone for a result the gradient gives for free.
 */
export function radialGlow(stops: readonly string[], position = "50% 50%"): ViewStyle {
  return {
    experimental_backgroundImage: `radial-gradient(ellipse closest-side at ${position}, ${spread(stops)})`,
  } as ViewStyle;
}

/** Evenly spaces colour stops across 0–100%. */
export function spread(stops: readonly string[]): string {
  if (stops.length === 1) return `${stops[0]} 0%, ${stops[0]} 100%`;
  return stops
    .map((color, i) => `${color} ${Math.round((i / (stops.length - 1)) * 100)}%`)
    .join(", ");
}
