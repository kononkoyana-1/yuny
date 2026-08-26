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
    primary: "#7B6BD6",
    primarySoft: "#EFECFB",
    accent: "#FFD764",
    accentSoft: "#FFF6DC",
    info: "#6BC0EC",
    success: "#4A9B6E",
    warning: "#E8A54B",
    danger: "#D96A6A",
    background: "#FAF7F2",
    surface: "#FFFFFF",
    surfaceAlt: "#F3EFE8",
    border: "#E6E0D6",
    text: "#2A2440",
    textMuted: "#7A7391",
    textInverse: "#FFFFFF",
  },
  dark: {
    primary: "#9B8FE3",
    primarySoft: "#2B2547",
    accent: "#FFD764",
    accentSoft: "#3A3320",
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
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { size: 32, weight: "700", lineHeight: 40 },
  title: { size: 24, weight: "700", lineHeight: 32 },
  heading: { size: 18, weight: "600", lineHeight: 26 },
  body: { size: 16, weight: "400", lineHeight: 24 },
  caption: { size: 13, weight: "400", lineHeight: 18 },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;
