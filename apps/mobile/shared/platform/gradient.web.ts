import type { ViewStyle } from "react-native";

/**
 * Gradient fills, web implementation — see `gradient.ts` for why this file
 * exists and why no blur is used.
 *
 * `react-native-web` forwards unknown style keys to the DOM node, so the
 * plain CSS `backgroundImage` property is what paints here. The native
 * `experimental_backgroundImage` is dropped silently on web, which is exactly
 * the failure this split prevents.
 */
export function linearGradient(from: string, to: string, angle = "135deg"): ViewStyle {
  return {
    backgroundImage: `linear-gradient(${angle}, ${from} 0%, ${to} 100%)`,
  } as ViewStyle;
}

export function verticalGradient(stops: readonly string[]): ViewStyle {
  return {
    backgroundImage: `linear-gradient(180deg, ${spread(stops)})`,
  } as ViewStyle;
}

/** `closest-side` — see `gradient.ts` for why the CSS default seams. */
export function radialGlow(stops: readonly string[], position = "50% 50%"): ViewStyle {
  return {
    backgroundImage: `radial-gradient(ellipse closest-side at ${position}, ${spread(stops)})`,
  } as ViewStyle;
}

/** Evenly spaces colour stops across 0–100%. */
export function spread(stops: readonly string[]): string {
  if (stops.length === 1) return `${stops[0]} 0%, ${stops[0]} 100%`;
  return stops
    .map((color, i) => `${color} ${Math.round((i / (stops.length - 1)) * 100)}%`)
    .join(", ");
}
