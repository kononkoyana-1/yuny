import type { PropsWithChildren } from "react";
import { View, useColorScheme } from "react-native";
import { atmosphere } from "@/shared/config/tokens";
import { radialGlow, verticalGradient } from "@/shared/platform/gradient";
import { Sparkles } from "./Sparkles";

/**
 * The entry screen's backdrop: near-white at the top, a cold lavender bloom
 * through the middle, and soft cloud shapes at the foot so the mascot reads
 * as standing on them.
 *
 * Four layers, painted back to front — a vertical sky wash, three overlapping
 * radial glows, and the clouds. Every one is a gradient on a plain `View`, so
 * this runs unchanged on iOS, Android and web through the shim in
 * `shared/platform/gradient`, with no blur anywhere: a radial gradient ending
 * on a transparent stop is already smooth, and blurring a full-bleed view
 * costs an offscreen pass every frame on a phone for the same result.
 *
 * Deliberately static. TZ.md §12 asks for calm, the mascot already floats on
 * this screen, and a permanently-animating backdrop behind it would compete
 * with the one thing that is supposed to move — and with the CTA.
 *
 * The four-point sparkles from the reference sit on top of all of it, in
 * `Sparkles` — four separate drawn stars rather than one glyph repeated, so
 * the scatter reads as illustration instead of a pattern.
 */
export function AtmosphericBackground({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? atmosphere.dark : atmosphere.light;

  return (
    <View className={`flex-1 overflow-hidden ${className}`} style={verticalGradient(palette.sky)}>
      {/* Glows. `pointerEvents="none"` throughout: decoration must never eat a
          tap meant for the content above it. */}
      {/* The main bloom is centred on the mascot's middle, not on the floor:
          it is the light the figure sits in, so it has to reach the figure. */}
      <View
        pointerEvents="none"
        className="absolute -left-[25%] top-[26%] h-[52%] w-[150%]"
        style={radialGlow(palette.glowMain, "50% 50%")}
      />
      <View
        pointerEvents="none"
        className="absolute -left-[35%] top-[46%] h-[34%] w-[90%]"
        style={radialGlow(palette.glowSide, "50% 50%")}
      />
      <View
        pointerEvents="none"
        className="absolute -right-[32%] top-[42%] h-[32%] w-[85%]"
        style={radialGlow(palette.glowCool, "50% 50%")}
      />

      {/*
        Clouds. Each is an ellipse lit from the upper left — the gradient's
        centre sits at 35% 25%, which is where the light would fall — so the
        crown is white and the underside carries the lavender. They overlap
        and run past both edges, so the row reads as one soft bank rather than
        four separate pills.

        The band sits at roughly two-thirds down, level with the mascot's feet
        as in the reference. Lower and it would be a decoration behind the
        button; the point is that the mascot stands on it.
      */}
      <View pointerEvents="none" className="absolute inset-x-0 top-[58%] h-[26%]">
        <View
          className="absolute -left-[14%] top-[26%] h-[112px] w-[230px] rounded-[999px] opacity-[0.85]"
          style={radialGlow(palette.cloud, "35% 25%")}
        />
        <View
          className="absolute left-[14%] top-[46%] h-[86px] w-[170px] rounded-[999px] opacity-[0.6]"
          style={radialGlow(palette.cloud, "35% 25%")}
        />
        <View
          className="absolute right-[8%] top-[20%] h-[120px] w-[245px] rounded-[999px] opacity-[0.8]"
          style={radialGlow(palette.cloud, "35% 25%")}
        />
        <View
          className="absolute -right-[16%] top-[50%] h-[92px] w-[180px] rounded-[999px] opacity-[0.55]"
          style={radialGlow(palette.cloud, "35% 25%")}
        />
      </View>

      <Sparkles />

      {children}
    </View>
  );
}
